'use strict';

const { BatchProcessor, DataEntity } = require('@terascope/job-components');
const Timsort = require('timsort');
const { promisify } = require('util');
const { sortFunction } = require('../__lib/utils');

const immediate = promisify(setImmediate);


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
        this.hasData = false;
        this.keysToClean = [];
        this.keys = [];

        this.sort = sortFunction(this.opConfig.sort_field, this.opConfig.order);
    }

    _readyToEmpty() {
        return (this.emptySliceCount >= this.opConfig.empty_after)
            && this.hasData;
    }

    _cleanCompletedBuckets() {
        if (this.opConfig.clean_buckets) {
            this.keysToClean.forEach((key) => {
                delete this.buckets[key];
            });
        }

        this.keysToClean = [];
    }

    async _emptyNextBucket() {
        // We're done with the prior bucket so cleanup.
        if (this.bucketEmptying) {
            this.offset = 0;
            this.keysToClean.push(this.bucketEmptying);
        }

        // Get the next bucket to empty.
        this.bucketEmptying = this.keys.pop();

        // If there's another key sort it, otherwise we're out of data.
        if (this.bucketEmptying) {
            await this._sortBucket(this.bucketEmptying);
        } else {
            this.hasData = false;
        }
    }

    async _batchOfData() {
        let results = [];
        // Get the first key to process. This will persist across
        // slices until it is fully consumed. When only sort the arrays
        // we're processing.
        if (!this.bucketEmptying) {
            this.keys = Object.keys(this.buckets);
            await this._emptyNextBucket();
        }

        // Attempt to fill out the batch
        while (results.length < this.opConfig.batch_size && this.bucketEmptying) {
            // The number of records available in the current slice.
            const remaining = this.opConfig.batch_size - results.length;

            // On large arrays this gets progressively slower as you get deeper in the array.
            const chunk = this.buckets[this.bucketEmptying].slice(this.offset,
                this.offset + remaining);
            this.offset += chunk.length;

            if (this.opConfig.strip_metadata) {
                // Since we stripped the metadata when accumulating we need to re-add the key.
                chunk.forEach((record) => {
                    DataEntity.make(record, {
                        _key: this.bucketEmptying
                    });
                });
            }

            // Reset once we've read the entire content of a key.
            if (this.offset === this.buckets[this.bucketEmptying].length) {
                await this._emptyNextBucket();
            }

            results = results.concat(chunk);
        }

        // Slice result is prepared so we can cleanup.
        this._cleanCompletedBuckets();

        return results;
    }

    _accumulate(dataArray) {
        dataArray.forEach((doc) => {
            const key = DataEntity.getMetadata(doc, '_key');
            if (!this.buckets[key]) {
                this.buckets[key] = [];
            }

            if (this.opConfig.strip_metadata) {
                this.buckets[key].push(Object.assign({}, doc));
            } else {
                this.buckets[key].push(doc);
            }

            this.hasData = true;
        });
    }

    async _sortBucket(key) {
        // No point sorting a single element array
        if (this.buckets[key].length > 1) {
            if (this.opConfig.sort_using === 'timsort') {
                Timsort.sort(this.buckets[key], this.sort);
            } else {
                this.buckets[key].sort(this.sort);
            }
            await immediate();
        }
    }

    async _sortAllBuckets() {
        for (const key of Object.keys(this.buckets)) {
            await this._sortBucket(key);
        }
    }

    async onBatch(dataArray) {
        if (dataArray.length === 0) this.emptySliceCount++;
        else this._accumulate(dataArray);

        if (this._readyToEmpty()) {
            if (this.opConfig.keyed_batch) {
                // This requires everything to be sorted in advance.
                await this._sortAllBuckets();

                const result = this.buckets;
                this.buckets = {};
                this.hasData = false;
                return [result];
            }

            await immediate();
            return this._batchOfData();
        }

        return [];
    }
}

module.exports = SortedBucketAccumulator;
