import { get } from '@terascope/core-utils';

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
 * Walks the leading segments of a path and returns the containers they land on,
 * which are the parents a flattened field gets merged into. A path with no
 * wildcard lands on one container at most. A wildcard fans out across the
 * elements of an array or the values of an object, so it can land on many.
 */
export function resolveContainers(
    root: unknown,
    segments: string[]
): Record<string, unknown>[] {
    let current: unknown[] = [root];

    for (const segment of segments) {
        if (segment === WILDCARD) {
            current = current.flatMap(expandWildcard);
            continue;
        }

        current = current
            .map((node) => readSegment(node, segment))
            .filter((value) => value !== undefined);
    }

    return current.filter(isContainer);
}

/**
 * A value that keys can be read from and written to. An object cannot be
 * dissolved into an array, so arrays are excluded.
 */
function isContainer(value: unknown): value is Record<string, unknown> {
    return value != null && typeof value === 'object' && !Array.isArray(value);
}

/** Everything a wildcard matches: the elements of an array, or the values of an object. */
function expandWildcard(node: unknown): unknown[] {
    if (Array.isArray(node)) return node;
    if (isContainer(node)) return Object.values(node);

    return [];
}

/** The value at `segment`, or undefined when `node` cannot hold one. */
function readSegment(node: unknown, segment: string): unknown {
    if (node == null || typeof node !== 'object') return undefined;

    return get(node, segment);
}
