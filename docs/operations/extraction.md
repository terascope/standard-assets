
# extraction #

This processor encapsulates the extraction phase of [ts-transforms](https://terascope.github.io/teraslice/docs/packages/ts-transforms/overview). This is meant to work in conjunction with the selection processor as this works by using the metadata set in the selection processor.




| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| rules | an array of strings that are the locations where rule files. must be specifed in "assetName:path" format | String[] | optional, defaults to [] (it just noops) |
| plugins | an array of strings that are the locations where [plugins](https://terascope.github.io/teraslice/docs/packages/ts-transforms/plugins) reside. must be specifed in "assetName:modulePath" format | Object[] | optional, defaults to [] |


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
    _op: 'extraction',
    plugins: ['someAssetId:plugins'],
    rules: ['someAssetId:transformRules.txt'],
};

const data = [
    { some: 'data', field: 'onething', field2: 'something' },
    { location: '33.242, -111.453' }
];

 const metaArray = [
    { selectors: ['some: $foo', '*'] },
    // eslint-disable-next-line no-useless-escape
    { selectors: ["location: geoBox( top_left: '33.906320, -112.758421' bottom_right: '32.813646,-111.058902')", '*'] }
];

// this metadata is set in the selection operation, take note of metaArray if you wish to do so without it
const dataArray = data.map((obj, ind) => new DataEntity(obj, metaArray[ind]));

// Results
const resultsArray = [
    { interm1: 'onething', interm2: 'something' },
    { loc: '33.242, -111.453' }
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
            "rules": ["someAssetId:transformRules.txt"]
        }
    ],
}

```
