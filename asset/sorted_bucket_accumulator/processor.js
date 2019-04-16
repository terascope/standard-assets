'use strict';

const { BatchProcessor, DataEntity } = require('@terascope/job-components');
const _ = require('lodash');
const Timsort = require('timsort');

const { sortFunction } = require('../__lib/utils');

/**
 * This processor accumulates a set of sorted buckets. The buckets are derived from the
 * key of a record. Once the accumulator starts to empty the results will be flattened
 * but all results for a bucket will be returned before results for the next bucket
 * are retured.
 */
class SortedBucketAccumulator extends BatchProcessor {
    constructor(...args) {
        super(...args);

        this.buckets = {};

        this.emptySliceCount = 0;
        this.offset = 0;
        this.bucketEmptying = undefined;

        this.sort = sortFunction(this.opConfig.sort_field, this.opConfig.order);
    }

    _readyToEmpty() {
        return (this.emptySliceCount >= this.opConfig.empty_after)
            && _.keys(this.buckets).length > 0;
    }

    _emptyNextBucket() {
        if (this.bucketEmptying) {
            this.offset = 0;
            delete this.buckets[this.bucketEmptying];
        }

        this.bucketEmptying = _.keys(this.buckets).pop();

        if (this.bucketEmptying) this._sortBucket(this.bucketEmptying);
    }

    _batchOfData() {
        let results = [];
        // Get the first key to process. This will persist across
        // slices until it is fully consumed. When only sort the arrays
        // we're processing.
        if (!this.bucketEmptying) {
            this._emptyNextBucket();
        }

        // Attempt to fill out the batch
        while (results.length < this.opConfig.batch_size && this.bucketEmptying) {
            // The number of records available in the current slice.
            const remaining = this.opConfig.batch_size - results.length;

            // On large arrays this gets progressively slower as you get deeper in the array.
            const chunk = this.buckets[this.bucketEmptying].slice(this.offset,
                this.offset + remaining);
            this.offset += chunk.length;

            // Reset once we've read the entire content of a key.
            if (this.offset === this.buckets[this.bucketEmptying].length) {
                this._emptyNextBucket();
            }

            results = results.concat(chunk);
        }

        return results;
    }

    _accumulate(dataArray) {
        dataArray.forEach((doc) => {
            const key = DataEntity.getMetadata(doc, '_key');
            if (!this.buckets[key]) {
                this.buckets[key] = [];
            }

            this.buckets[key].push(doc);
        });
    }

    _sortBucket(key) {
        if (this.opConfig.sort_using === 'timsort') {
            Timsort.sort(this.buckets[key], this.sort);
        }
        else {
            this.buckets[key].sort(this.sort);
        }
    }

    _sortAllBuckets() {
        const keys = _.keys(this.buckets);
        keys.forEach(key => this._sortBucket(key));
    }

    onBatch(dataArray) {
        if (dataArray.length === 0) this.emptySliceCount++;
        else this._accumulate(dataArray);

        if (this._readyToEmpty()) {
            if (this.opConfig.keyed_batch) {
                // This requires everything to be sorted in advance.
                this._sortAllBuckets();

                const result = this.buckets;
                this.buckets = {};
                return [result];
            }

            return this._batchOfData();
        }

        return [];
    }
}

module.exports = SortedBucketAccumulator;
