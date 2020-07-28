
# key_router #

This processor will tag records with the `standard:route` metadata which is used by the routed_sender processor to dynamically routes records to different locations.


This will enable routing based off of the _key metadata for routed_sender



| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| use | The number of characters to slice off the key and use as the routing value' | Number | optional, if used it must be used in conjunction with `from` |
| from | Whether the characters are sliced from the `beginning` or `end` of the key | String | optional, if used it must be used in conjunction with `use` |
| case | Transform to apply to the values extracted from the key, may be set to `preserve`, `lower`, or `upper`| String | optional, defaults to preserve |

## Usage

```

const data = [
    DataEntity.make(
        {
            date: '2020-01-17T19:21:52.159Z',
            field1: 'val1.1',
            field2: 'val1.2'
        },
        {
            _key: 'firstKey'
        }
    ),
    DataEntity.make(
        {
            date: '2020-01-17T19:21:52.159Z',
            field1: 'val2.1',
            field2: 'val2.2'
        },
        {
            _key: 'secondKey'
        }
    ),
];


const opConfig = {
    _op: 'key_router',
};

// new 'standard:route' metadata of each record, data stays unchanged
const metaData = ['firstKey', 'secondKey'];


const opConfig = {
    _op: 'key_router',
    case: 'upper'
};

// new 'standard:route' metadata of each record, data stays unchanged
const metaData = ['FIRSTKEY', 'SECONDKEY'];


const opConfig = {
    _op: 'key_router',
    case: 'lower'
};

// new 'standard:route' metadata of each record, data stays unchanged
const metaData = ['firstkey', 'secondkey'];


const opConfig = {
    _op: 'key_router',
    use: 1,
    from: 'beginning'
};

// new 'standard:route' metadata of each record, data stays unchanged
const metaData = ['f', 's'];
```


## Example Job

```json
{
    "name" : "testing",
    "workers" : 1,
    "slicers" : 1,
    "lifecycle" : "once",
    "assets" : [
        "standard",
        "elasticsearch"
    ],
    "apis": [
         {
            "_name": "elasticsearch_sender_api",
            "index": "other_index",
            "size": 1000,
            "index": true
        },
    ]
    "operations" : [
        {
            "_op": "data_generator",
            "size": 10000
        },
        {
            "_op": "key_router",
            "use": 1,
            "from": "beginning",
            "case": "lower"
        },
        {
            "_op": "routed_sender",
            "api_name": "elasticsearch_sender_api",
            "routing": {
                "**": "default"
            }
        }
    ],
}

```
