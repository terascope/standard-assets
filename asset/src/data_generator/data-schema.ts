import moment from 'moment';
import { AnyObject, isEmpty } from '@terascope/utils';
import { DataGenerator, DateOptions, IDType } from './interfaces';

// "2016-01-19T13:33:09.356-07:00"
export const dateFormat = 'YYYY-MM-DDTHH:mm:ss.SSSZ';

// 2016-06-29T12:44:57-07:00
export const dateFormatSeconds = 'YYYY-MM-DDTHH:mm:ssZ';

function regexID(type: IDType) {
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

function utcDate() {
    return new Date().toISOString();
}

function dateNow() {
    return moment().format(dateFormat);
}

function isoBetween(start: number, diff: number) {
    // ex.   "2016-01-19T13:48:08.426-07:00"
    return () => moment(start + (Math.random() * diff)).format(dateFormat);
}

function utcBetween(start: number, diff: number) {
    // ex.   "2016-01-19T20:48:08.426Z"  , compare to isoBetween, same dates
    return () => new Date(start + (Math.random() * diff)).toISOString();
}

const formatOptions = {
    dateNow,
    isoBetween,
    utcDate,
    utcBetween
};

const nativeSchema = {
    ip: {
        faker: 'internet.ip'
    },
    userAgent: {
        faker: 'internet.userAgent'
    },
    url: {
        faker: 'internet.url'
    },
    uuid: {
        faker: 'random.uuid'
    },
    created: {
        function: dateNow
    },
    ipv6: {
        chance: 'ipv6'
    },
    location: {
        chance: 'coordinates'
    },
    bytes: {
        chance: 'integer({"min": 7850, "max": 5642867})'
    }
};

interface FormatOptions {
    start?: number;
    end?: number;
    diff?: number;
}

function getFormatFunction(format: DateOptions, options: FormatOptions = {}) {
    const { start, diff } = options;

    if (format === DateOptions.isoBetween || format === DateOptions.utcBetween) {
        return formatOptions[format](start as number, diff as number);
    }

    return formatOptions[format];
}

export default function getSchema(opConfig: DataGenerator, otherSchema: AnyObject): AnyObject {
    const startDate = opConfig.start ? moment(opConfig.start) : moment(0); // 01 January, 1970 UTC
    const endDate = opConfig.end ? moment(opConfig.end) : moment();
    const schema = isEmpty(otherSchema) ? nativeSchema : otherSchema;
    const start = startDate.valueOf();
    const end = endDate.valueOf();
    const diff = end - start;

    if (opConfig.date_key !== 'created') {
        schema[opConfig.date_key] = schema.created;
        delete schema.created;
    }

    if (opConfig.format) {
        schema[opConfig.date_key || 'created'].function = getFormatFunction(opConfig.format, { start, diff });
    }

    if (opConfig.set_id) {
        schema.id = regexID(opConfig.set_id);
    }

    if (opConfig.id_start_key) {
        const reg = schema.id.randexp;
        schema.id.randexp = `${opConfig.id_start_key}${reg}`;
    }

    return schema;
}
