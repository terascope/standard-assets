import { isEmpty } from '@terascope/core-utils';
import { DataGenerator } from '../interfaces.js';
import { dateNow, getFormatFunction, getStartEndDiff, regexID } from './utils.js';

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
        faker: 'string.uuid'
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

export default function getSchema(
    opConfig: DataGenerator,
    otherSchema: Record<string, any>
): Record<string, any> {
    const dateKey = opConfig.date_key || 'created';
    const schema: Record<string, any> = isEmpty(otherSchema) ? nativeSchema : otherSchema;
    const { start, diff } = getStartEndDiff(opConfig);

    if (opConfig.date_key !== 'created') {
        schema[opConfig.date_key] = schema.created;
        delete schema.created;
    }

    if (opConfig.format) {
        const dataConfig = schema[dateKey];
        const newFn = getFormatFunction(opConfig.format, { start, diff });
        const formatConfig = Object.assign({}, dataConfig, { function: newFn });
        schema[dateKey] = formatConfig;
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
