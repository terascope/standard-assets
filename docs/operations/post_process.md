
# post_process #

This processor encapsulates the post_process phase of [ts-transforms](https://terascope.github.io/teraslice/docs/packages/ts-transforms/overview). This is meant to work in conjunction with the selection processor as this works by using the metadata set in the selection processor.




| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| rules | an array of strings that are the locations where rule files. must be specifed in "assetName:path" format | String[] | required |
| plugins | an array of strings that are the locations where [plugins](https://terascope.github.io/teraslice/docs/packages/ts-transforms/plugins) reside. must be specifed in "assetName:modulePath" format | Object[] | optional, defaults to [] |
| type_config | a schema for the data being consumed. Set the keys to your data's field names, with values set to this [enum](https://terascope.github.io/teraslice/docs/packages/types/api/enums/xlucenefieldtype) | Object | optional |
| variables | An object containing any varialbes for the xlucene rules | Object | optional|


## Usage

```typescript

// someAssetId:transformRules.txt
{ "selector": "some: $foo", "source_field": "field", "target_field": "interm1", "tag": "someTag", "output": false }
{ "selector": "some: $foo", "source_field": "field2", "target_field": "interm2", "tag": "someTag", "output": false }
{ "follow": "someTag", "post_process": "join", "target_field": "final", "delimiter": " " }

{ "source_field": "otherField", "target_field": "lastField", "other_match_required": true }
{ "source_field": "_id", "target_field": "id", "other_match_required": true, "tag": "numberMe" }
{ "follow": "numberMe", "post_process": "number" }

{ "selector": "location: geoBox( top_left: '33.906320, -112.758421' bottom_right: '32.813646,-111.058902')", "source_field": "location", "target_field": "loc" }

{ "selector": "date:[2019-04-16T20:14:44.304Z TO *] AND bytes:>=1000000", "source_field": "date", "target_field": "last_seen", "tag": "tagOp" }
{ "follow": "tagOp", "post_process": "tag" }

// ------------

// someAssetId:plugins
import { DataEntity } from '@terascope/job-components';

class Tag {
    static cardinality = 'one-to-one';

    constructor(operationConfig: unknown) {
        // @ts-expect-error
        this.operationConfig = operationConfig;
    }

    run(doc: DataEntity): DataEntity {
        doc.wasTagged = true;
        return doc;
    }
}

export default class Plugin {
    init(): { tag: typeof Tag } {
        return {
            tag: Tag,
        };
    }
}


// ------------

const config = {
    _op: 'post_process',
    plugins: ['someAssetId:plugins'],
    rules: ['someAssetId:transformRules.txt'],
    type_config: {
        some: 'string',
        field: 'string,
        field2: 'string',
        date: 'date',
        location: 'geo-point'
    },
    variables: {
        foo: 'data'
    }
};

c const data = [
    new DataEntity({ interm1: 'hello', interm2: 'world' }, { selectors: ['some: $foo'] }),
    new DataEntity({ id: '1' }, { selectors: ['*'] }),
    new DataEntity({}, { selectors: ['date:[2019-04-16T20:14:44.304Z TO *] AND bytes:>=1000000'] }),
];

// Results
const resultsArray = [
   { interm1: 'hello', interm2: 'world', final: 'hello world' }
   { id: 1 },
   { wasTagged: true }
];

```

## Example Job

```json
{
    "name" : "testing",
    "workers" : 1,
    "slicers" : 1,
    "lifecycle" : "once",
    "assets" : [
        "standard"
    ],
    "operations" : [
        {
            "_op": "test-reader",
        },
        {
            "_op": "selection",
            "plugins": ["someAssetId:plugins"],
            "rules": ["someAssetId:transformRules.txt"],
            "types": { "date": "date", "location": "geo-point" },
            "variables": {
                "foo": "data"
            }
        }
        {
            "_op": "extraction",
            "plugins": ["someAssetId:plugins"],
            "rules": ["someAssetId:transformRules.txt"],
            "type_config": {
                "some": "string",
                "field": "string",
                "field2": "string"',
                "date": "date",
                "location": "geo-point"
            },
            "variables": {
                "foo": "data"
            }
        },
        {
            "_op": "post_process",
            "plugins": ["someAssetId:plugins"],
            "rules": ["someAssetId:transformRules.txt"],
            "type_config": {
                "some": "string",
                "field": "string",
                "field2": "string"',
                "date": "date",
                "location": "geo-point"
            },
            "variables": {
                "foo": "data"
            }
        }
    ],
}

```
