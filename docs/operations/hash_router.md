
# hash_router #

This processor will tag records with the `standard:route` metadata which is used by the routed_sender processor to dynamically routes records to different locations.


This will enable routing based off of hashing the fields specified for routed_sender



| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| fields | Specifies fields to hash for partitioning. Must specify at least one field. | String[] | optional, defaults to using the _key metadata field |
| buckets | Number of partitions to use with hashing | Number | required |

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
            _key: someId1
        }
    ),
    DataEntity.make(
        {
            date: '2020-01-17T19:21:52.159Z',
            field1: 'val2.1',
            field2: 'val2.2'
        },
        {
            _key: someId2
        }
    ),
];


const opConfig = {
    _op: 'hash_router',
    fields: [
        'field2',
        'field1'
    ],
    buckets: 15
};

// new 'standard:route' metadata of each record, data stays unchanged
const metaData = ['4', '8'];


const opConfig = {
    _op: 'hash_router',
    fields: [],
    buckets: 15
};

// new 'standard:route' metadata of each record, data stays unchanged
const metaData = ['0', '14'];
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
            "_op": "hash_router",
            "fields": ["created", "uuid"],
            "buckets": 15
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
