
# Match #

This processor encapsulates the [matcher](https://terascope.github.io/teraslice/docs/packages/ts-transforms/overview#matcher) of ts-transforms. This does not do any transformations on the data, it just returns any matched data


| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| rules | an array of strings that are the locations where rule files. must be specifed in "assetName:path" format | String[] | required |
| plugins | an array of strings that are the locations where [plugins](https://terascope.github.io/teraslice/docs/packages/ts-transforms/plugins) reside. must be specifed in "assetName:modulePath" format | Object[] | optional, defaults to [] |
| type_config | a schema for the data being consumed. Set the keys to your data's field names, with values set to this [enum](https://terascope.github.io/teraslice/docs/packages/types/api/enums/xlucenefieldtype) | Object | optional |
| variables | An object containing any varialbes for the xlucene rules | Object | optional|

## Usage

```typescript

// someAssetId:matchRules.txt
some:data AND bytes:>=1000
other:/.*abc.*/ OR _created:>=2018-11-16T15:16:09.076Z

// ------------


const config = {
    _op: 'match',
    rules: ['someAssetId:matchRules.txt'],
    type_config: {
        some: 'string',
        bytes: 'number,
        other: 'string',
        _created: 'date',
    },
    variables: {
        foo: 'data'
    }
};

const data = [[
    { some: 'data', bytes: 1200 },
    { some: 'data', bytes: 200 },
    { some: 'other', bytes: 1200 },
    { other: 'xabcd' },
    { _created: '2018-12-16T15:16:09.076Z' }
]

// Results
const resultsArray = [
    { some: 'data', bytes: 1200 },
    { other: 'xabcd' },
    { _created: '2018-12-16T15:16:09.076Z' }
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
            "_op": "match",
            "plugins": ["someAssetId:plugins"],
            "rules": ["someAssetId:transformRules.txt"],
            "types": { "date": "date", "location": "geo-point" },
            "variables": {
                "foo": "data"
            }
        }
    ],
}

```
