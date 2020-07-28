
# Match #

This processor encapsulates the [matcher](https://terascope.github.io/teraslice/docs/packages/ts-transforms/overview#matcher) of ts-transforms. This does not do any transformations on the data, it just returns any matched data


| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| rules | an array of strings that are the locations where rule files. must be specifed in "assetName:path" format | String[] | optional, defaults to [] (it just noops) |
| plugins | an array of strings that are the locations where [plugins](https://terascope.github.io/teraslice/docs/packages/ts-transforms/plugins) reside. must be specifed in "assetName:modulePath" format | Object[] | optional, defaults to [] |
| type_config |if specified it sets describes the types on the incoming records | Object | optional |
| variables | variables used in the xLucene query | Object | optional |

## Usage

```typescript

// someAssetId:matchRules.txt
some:data AND bytes:>=1000
other:/.*abc.*/ OR _created:>=2018-11-16T15:16:09.076Z

// ------------


const config = {
    _op: 'match',
    rules: ['someAssetId:matchRules.txt'],
    variables: { foo: "data" }
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
