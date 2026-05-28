import moment from 'moment';
import { DataGenerator, DateOptions, IDType } from '../interfaces.js';

/**
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * REGULAR EXPRESSIONS
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */

export function regexID(type: IDType) {
    const reg = { randexp: '' };

    if (type === 'base64url') {
        // eslint-disable-next-line
        reg.randexp = '[a-zA-Z1-9\-\_]\w{8}';
    }
    if (type === 'hexadecimal') {
        reg.randexp = '[0-9a-f]{8}';
    }
    if (type === 'HEXADECIMAL') {
        reg.randexp = '[0-9A-F]{8}';
    }

    return reg;
}

/**
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * DATES
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */

const dateFormat = 'YYYY-MM-DDTHH:mm:ss.SSSZ'; // "2016-01-19T13:33:09.356-07:00"
const _dateFormatSeconds = 'YYYY-MM-DDTHH:mm:ssZ'; // "2016-06-29T12:44:57-07:00"

function utcDate() {
    return new Date().toISOString();
}

/**  */
export function dateNow() {
    return moment().format(dateFormat);
}

/** ex. "2016-01-19T13:48:08.426-07:00" */
function isoBetween(start: number, diff: number) {
    return () => moment(start + (Math.random() * diff)).format(dateFormat);
}

/** ex. "2016-01-19T20:48:08.426Z"  , compare to isoBetween, same dates */
function utcBetween(start: number, diff: number) {
    return () => new Date(start + (Math.random() * diff)).toISOString();
}

const formatOptions = {
    dateNow,
    isoBetween,
    utcDate,
    utcBetween
};

export function getFormatFunction(
    format: DateOptions,
    options: {
        start?: number;
        end?: number;
        diff?: number;
    } = {}
) {
    const { start, diff } = options;

    if (format === DateOptions.isoBetween || format === DateOptions.utcBetween) {
        return formatOptions[format](start as number, diff as number);
    }

    return formatOptions[format];
}

export function getStartEndDiff(opConfig: DataGenerator) {
    const startDate = opConfig.start ? moment(opConfig.start) : moment(0); // 01 January, 1970 UTC
    const endDate = opConfig.end ? moment(opConfig.end) : moment();

    const start = startDate.valueOf();
    const end = endDate.valueOf();
    const diff = end - start;
    return { start, end, diff };
}
