# extraction

This processor encapsulates the extraction phase of [ts-transforms](https://terascope.github.io/teraslice/docs/packages/ts-transforms/overview).

To use this processor, it is required to use the [selection](./selection.md) processor as this works by using the metadata that is set in the selection processor. It also requires a file containing all transform rules that is will be preforming and any necessary plugins that those rules require to operate.

The full functionality of ts-transforms is encapsulated in the [transform]( ../transform.md) processor.

You would only want to use this processor instead of the fully functional transform processor if you wanted to inject a custom operation between each phase, or to capture the analytics of the records between each phase.


## Usage

### Example of the rules and plugins to run the extraction phase
Below contains an example of the transform rules, plugins and configurations to perform the extraction phase. Note that the post-process and output phases of ts-transforms are not executed.

Example Job
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
            "_op": "test-reader"
        },
        {
            "_op": "selection",
            "plugins": ["someAssetId:plugins"],
            "rules": ["someAssetId:transformRules.txt"],
            "type_config": {
                "some": "string",
                "field": "string",
                "field2": "string",
                "date": "date",
                "location": "geo-point"
            },
            "variables": {
                "foo": "data"
            }
        },
        {
            "_op": "extraction",
            "plugins": ["someAssetId:plugins"],
            "rules": ["someAssetId:transformRules.txt"],
            "type_config":  {
                "some": "string",
                "field": "string",
                "field2": "string",
                "date": "date",
                "location": "geo-point"
            },
            "variables": {
                "foo": "data"
            }
        }
    ]
}
```

Example rules located at `someAssetId:transformRules.txt`

```json
{ "selector": "some: $foo", "source_field": "field", "target_field": "interm1", "tag": "someTag", "output": false }
{ "selector": "some: $foo", "source_field": "field2", "target_field": "interm2", "tag": "someTag", "output": false }
{ "follow": "someTag", "post_process": "join", "target_field": "final", "delimiter": " " }

{ "source_field": "otherField", "target_field": "lastField", "other_match_required": true }
{ "source_field": "_key", "target_field": "id", "other_match_required": true, "tag": "numberMe" }
{ "follow": "numberMe", "post_process": "number" }

{ "selector": "location: geoBox( top_left: '33.906320, -112.758421' bottom_right: '32.813646,-111.058902')", "source_field": "location", "target_field": "loc" }

{ "selector": "date:[2019-04-16T20:14:44.304Z TO *] AND bytes:>=1000000", "source_field": "date", "target_field": "last_seen", "tag": "tagOp" }
{ "follow": "tagOp", "post_process": "tag" }

```

Example plugin used by rules above located at `someAssetId:plugins`

```javascript
import { DataEntity } from '@terascope/job-components';

class Tag {
    static cardinality = 'one-to-one';

    constructor(operationConfig) {
        this.operationConfig = operationConfig;
    }

    run(doc: DataEntity) {
        doc.wasTagged = true;
        return doc;
    }
}

export default class Plugin {
    init() {
        return {
            tag: Tag,
        };
    }
}

```

Example of the data and the expected results of the extraction phase, the metadata is what is set by the selection processor

```javascript

const data = [
    DataEntity.make(
        { some: 'data', field: 'oneThing', field2: 'something' },
        { selectors: ['some: $foo', '*'] }
    ),
    DataEntity.make(
        { location: '33.242, -111.453' },
        { selectors: ["location: geoBox( top_left: '33.906320, -112.758421' bottom_right: '32.813646,-111.058902')", '*'] }
    )
];

const results = await processor.run(data);

results === [
    { interm1: 'oneThing', interm2: 'something' },
    { loc: '33.242, -111.453' }
];
```


## Parameters

| Configuration | Description                                                                                                                                                                                       | Type     | Notes                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------ |
| _op           | Name of operation, it must reflect the exact name of the file                                                                                                                                     | String   | required                 |
| rules         | an array of strings that are the locations where rule files. must be specified in "assetName:path" format                                                                                         | String[] | required                 |
| plugins       | an array of strings that are the locations where [plugins](https://terascope.github.io/teraslice/docs/packages/ts-transforms/plugins) reside. must be specified in "assetName:modulePath" format  | Object[] | optional, defaults to [] |
| type_config   | a schema for the data being consumed. Set the keys to your data field names, with values set to this [enum](https://terascope.github.io/teraslice/docs/packages/types/api/enums/xlucenefieldtype) | Object   | optional                 |
| variables     | An object containing any variables for the xlucene rules                                                                                                                                          | Object   | optional                 |
