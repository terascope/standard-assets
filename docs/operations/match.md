# match

This processor encapsulates the [matcher](https://terascope.github.io/teraslice/docs/packages/ts-transforms/overview#matcher) of ts-transforms. This does not do any transformations on the data, it just returns any matched data

To use this processor, it requires a file containing all match rules that is will be preforming and any necessary plugins that those rules require to operate.


## Usage

### Matching records using ts-transforms match rules
Below is an example of xLucene match rules and the configuration needed to match expression to documents.

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
            "_op": "match",
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

Example xLucene rules located at `someAssetId:matchRules.txt`

```txt
some:data AND bytes:>=1000
other:/.*abc.*/ OR _created:>=2018-11-16T15:16:09.076Z
```

Here is a representation of what the processor will do with the configuration listed in the job above

```javascript

const data = [
    { some: 'data', bytes: 1200 },
    { some: 'data', bytes: 200 },
    { some: 'other', bytes: 1200 },
    { other: 'xabcd' },
    { _created: '2018-12-16T15:16:09.076Z' }
]

const results = await processor.run(data);

results === [
    { some: 'data', bytes: 1200 },
    { other: 'xabcd' },
    { _created: '2018-12-16T15:16:09.076Z' }
];
```



## Parameters

| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| rules | an array of strings that are the locations where rule files. must be specified in "assetName:path" format | String[] | required |
| plugins | an array of strings that are the locations where [plugins](https://terascope.github.io/teraslice/docs/packages/ts-transforms/plugins) reside. must be specified in "assetName:modulePath" format | Object[] | optional, defaults to [] |
| type_config | a schema for the data being consumed. Set the keys to your data field names, with values set to this [enum](https://terascope.github.io/teraslice/docs/packages/types/api/enums/xlucenefieldtype) | Object | optional |
| variables | An object containing any variables for the xlucene rules | Object | optional|
