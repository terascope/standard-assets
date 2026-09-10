import { MapProcessor, Context } from '@terascope/job-components';
import { ExecutionConfig } from '@terascope/types';
import { DataEntity, castArray, isPlainObject } from '@terascope/core-utils';
import { FlattenObjectConfig, MissingFieldAction } from './interfaces.js';
import { parsePath, resolveContainers } from './path.js';
import DataWindow from '../__lib/data-window.js';

/** Swaps a record's keys for new ones in place, so a DataEntity keeps its metadata. */
function replaceKeys(doc: DataEntity, keys: Record<string, unknown>): DataEntity {
    for (const key of Object.keys(doc)) {
        delete doc[key];
    }

    return Object.assign(doc, keys);
}

/**
 * Collapses nested objects into a single level of keys joined by a delimiter.
 * Either the whole record, or just the objects at the configured fields.
 */
export default class FlattenObject extends MapProcessor<FlattenObjectConfig> {
    /** empty when no field was configured, which means flatten the whole record */
    private readonly fields: string[];

    constructor(context: Context, opConfig: FlattenObjectConfig, exConfig: ExecutionConfig) {
        super(context, opConfig, exConfig);

        this.fields = castArray(this.opConfig.field);
    }

    map(doc: DataEntity): DataEntity {
        if (doc instanceof DataWindow) {
            return this.handleDataWindow(doc);
        }

        return this.flattenRecord(doc);
    }

    private handleDataWindow(doc: DataWindow): DataWindow {
        doc.dataArray = doc.asArray().map((item: DataEntity) => this.flattenRecord(item));

        return doc;
    }

    private flattenRecord(doc: DataEntity): DataEntity {
        if (this.fields.length === 0) return this.flattenWholeRecord(doc);

        for (const field of this.fields) {
            this.flattenField(doc, field);
        }

        return doc;
    }

    /** Collapses every nested object in the record into a top level key. */
    private flattenWholeRecord(doc: DataEntity): DataEntity {
        const flattened: Record<string, unknown> = {};

        this.flattenInto(doc, flattened, '', 1);

        return replaceKeys(doc, flattened);
    }

    /**
     * Dissolves the object at `field` into its parent, prefixing each of its
     * keys with the field's own name, so the parent itself stays nested. A
     * wildcard in the path resolves to many parents, each handled the same way.
     */
    private flattenField(doc: DataEntity, field: string): void {
        const segments = parsePath(field);
        // the schema rejects a path with no segments, so there is always a key
        const key = segments.pop() as string;
        const parents = resolveContainers(doc, segments);

        let found = false;

        for (const parent of parents) {
            // hasOwn, not `in`, so an inherited DataEntity method never counts as a match
            if (!Object.hasOwn(parent, key)) continue;

            // the field resolved, even if it turns out to be a leaf value
            found = true;

            const value = parent[key];

            if (!this.canFlatten(value)) continue;

            const flattened: Record<string, unknown> = {};

            // depth is counted from the field, not from the record root. It starts
            // at 2 because the field's own name already accounts for one segment.
            this.flattenInto(value, flattened, key, 2);

            delete parent[key];
            Object.assign(parent, flattened);
        }

        if (!found) this.handleMissingField(field);
    }

    private handleMissingField(field: string): void {
        const { missing_field_action: action } = this.opConfig;

        if (action === MissingFieldAction.throw) {
            throw new Error(`Field "${field}" not found on record`);
        }

        if (action === MissingFieldAction.log) {
            this.logger.warn(`Field "${field}" not found on record`);
        }
    }

    private flattenInto(
        source: Record<string, unknown>,
        target: Record<string, unknown>,
        prefix: string,
        depth: number
    ): void {
        for (const [key, value] of Object.entries(source)) {
            const path = prefix === '' ? key : `${prefix}${this.opConfig.delimiter}${key}`;

            if (this.shouldDescend(value, depth)) {
                this.flattenInto(value, target, path, depth + 1);
            } else {
                target[path] = value;
            }
        }
    }

    /** Whether to break `value` apart at this depth, or write it out as a leaf. */
    private shouldDescend(value: unknown, depth: number): value is Record<string, unknown> {
        if (!this.canFlatten(value)) return false;

        const { max_depth: maxDepth } = this.opConfig;

        return maxDepth === 0 || depth <= maxDepth;
    }

    /**
     * Whether the value has keys to be broken apart. An empty object or
     * array has no leaves to flatten to, so it is kept as a value.
     */
    private canFlatten(value: unknown): value is Record<string, unknown> {
        if (!this.isFlattenable(value)) return false;

        return Object.keys(value).length > 0;
    }

    /**
     * Whether the value is the kind of thing that can be dissolved at all. null
     * and non-plain objects are always leaves, arrays only when flatten_arrays is on.
     */
    private isFlattenable(value: unknown): value is Record<string, unknown> {
        if (Array.isArray(value)) return this.opConfig.flatten_arrays;

        return isPlainObject(value);
    }
}
