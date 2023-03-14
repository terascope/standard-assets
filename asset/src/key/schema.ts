import { ConvictSchema, OpConfig } from '@terascope/job-components';

const ALGOS = [
    'hex',
    'md4',
    'md5',
    'md5-sha1',
    'sha1',
    'sha256',
    'sha512',
    'whirlpool'
];

export default class Schema extends ConvictSchema<OpConfig> {
    build(): Record<string, any> {
        return {
            key_name: {
                doc: 'key field name',
                default: '_key',
                format: 'String'
            },
            key_fields: {
                doc: 'Fields to populate the key with.  If empty all fields are used to create the key',
                default: [],
                format: 'Array'
            },
            invert_key_fields: {
                doc: 'If set to true will exclude key_fields from key',
                default: false,
                format: 'Boolean'
            },
            hash_algorithm: {
                doc: 'Select which hash algorithm to use',
                default: 'md5',
                format: (value: string) => {
                    if (!ALGOS.includes(value)) {
                        throw new Error(`hash_algorithm must be ${ALGOS.join(' or ')}`);
                    }
                }
            },
            minimum_field_count: {
                doc: 'Minimum number of key fields needed to create a valid key, if it cannot create a key for that doc it will not be returned',
                default: 0,
                format: 'Number'
            },
            preserve_original_key: {
                doc: 'Useful when re-keying data. Setting to true will preserve the original key on the doc as _original_key',
                default: false,
                format: 'Boolean'
            },
            delete_original: {
                doc: 'Useful when re-indexing data. Setting this to true adds the original key to the metadata which allows for indexing and deleting records in one job',
                default: false,
                format: 'Boolean'
            },
            truncate_location: {
                doc: 'List of location fields that should be truncated, supports all Elasticsearch formats for geo-points as found in https://www.elastic.co/guide/en/elasticsearch/reference/current/geo-point.html',
                default: [],
                format: 'Array'
            },
            truncate_location_places: {
                doc: 'How many decimal places to preserve when truncating the location',
                default: 4,
                format: 'Number'
            }
        };
    }
}
