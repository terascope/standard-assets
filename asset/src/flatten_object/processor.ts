import { MapProcessor, Context } from '@terascope/job-components';
import { ExecutionConfig } from '@terascope/types';
import { DataEntity, get, isPlainObject } from '@terascope/core-utils';
import { FlattenObjectConfig, MissingFieldAction } from './interfaces.js';
import DataWindow from '../__lib/data-window.js';

export const WILDCARD = '*';

/**
 * Splits a dot notation field path into segments, normalizing the bracket forms
 * so `locations[0]` becomes `locations.0` and both `locations[]` and
 * `locations[*]` become `locations.*`.
 */
export function parsePath(field: string): string[] {
    return field
        .replace(/\[\s*\*?\s*\]/g, `.${WILDCARD}`)
        .replace(/\[\s*(\d+)\s*\]/g, '.$1')
        .split('.')
        .filter((segment) => segment.length > 0);
}

/**
 * A value that keys can be read from and written to. Arrays are
 * excluded, an object cannot be dissolved into one.
 */
function isContainer(value: unknown): value is Record<string, unknown> {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Collapses nested objects into a single level of keys joined by a delimiter.
 * Either the whole record, or just the objects at the configured fields.
 */

export default class FlattenObject extends MapProcessor<FlattenObjectConfig> {
    /** the whole record is flattened when field is "all" or includes "all" */
    private readonly fields: string[];
    private readonly flattenAll: boolean;

    constructor(context: Context, opConfig: FlattenObjectConfig, exConfig: ExecutionConfig) {
        super(context, opConfig, exConfig);

        const { field } = this.opConfig;
        this.fields = Array.isArray(field) ? field : [field];
        this.flattenAll = this.fields.includes('all');
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
        if (this.flattenAll) {
            const flattened: Record<string, unknown> = {};

            this.flattenInto(doc, flattened, '', 1);

            // mutate in place so the DataEntity keeps its metadata
            for (const key of Object.keys(doc)) {
                delete doc[key];
            }

            return Object.assign(doc, flattened);
        }

        for (const field of this.fields) {
            this.flattenField(doc, field);
        }

        return doc;
    }

    /**
     * Dissolves the object at `field` into its parent, prefixing each of its
     * keys with the field's own name, so the parent itself stays nested. A
     * wildcard in the path resolves to many parents, each handled the same way.
     */
    private flattenField(doc: DataEntity, field: string): void {
        const segments = parsePath(field);
        const key = segments.pop() as string;
        const parents = this.resolveContainers(doc, segments);

        let found = false;

        for (const parent of parents) {
            if (!(key in parent)) continue;

            // the field resolved, even if it turns out to be a leaf value
            found = true;

            const value = parent[key];

            // nothing to flatten, the field is already a leaf value
            if (!this.isFlattenable(value)) continue;
            if (Object.keys(value as Record<string, unknown>).length === 0) continue;

            const flattened: Record<string, unknown> = {};

            // depth is counted from the field, not from the record root. It starts
            // at 2 because the field's own name already accounts for one segment.
            this.flattenInto(value as Record<string, unknown>, flattened, key, 2);

            delete parent[key];
            Object.assign(parent, flattened);
        }

        if (!found) this.handleMissingField(field);
    }

    /**
     * Walks the leading segments of a path and returns every container they
     * resolve to. Without a wildcard that is at most one, a wildcard fans out
     * across the elements of an array or the values of an object.
     */
    private resolveContainers(doc: DataEntity, segments: string[]): Record<string, unknown>[] {
        let current: unknown[] = [doc];

        for (const segment of segments) {
            const next: unknown[] = [];

            for (const node of current) {
                if (segment === WILDCARD) {
                    if (Array.isArray(node)) {
                        next.push(...node);
                    } else if (isContainer(node)) {
                        next.push(...Object.values(node));
                    }

                    continue;
                }

                if (node == null || typeof node !== 'object') continue;

                const value = get(node, segment);

                if (value !== undefined) next.push(value);
            }

            current = next;
        }

        return current.filter(isContainer);
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
                this.flattenInto(value as Record<string, unknown>, target, path, depth + 1);
            } else {
                target[path] = value;
            }
        }
    }

    private shouldDescend(value: unknown, depth: number): boolean {
        if (!this.isFlattenable(value)) return false;

        // an empty object or array has no leaves to flatten to, so it is kept as a value
        if (Object.keys(value as Record<string, unknown>).length === 0) return false;

        const { max_depth: maxDepth } = this.opConfig;

        return maxDepth === 0 || depth <= maxDepth;
    }

    /**
     * Whether the value can be broken apart into keys. null and non-plain
     * objects are always leaves, arrays only when flatten_arrays is on.
     */
    private isFlattenable(value: unknown): boolean {
        if (Array.isArray(value)) return this.opConfig.flatten_arrays;

        return isPlainObject(value);
    }
}
