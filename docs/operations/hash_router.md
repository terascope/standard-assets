# hash_router

The `hash_router` processor will tag the incoming records with the `standard:route` metadata which is used by the [routed_sender](./routed_sender.md) processor to dynamically routes records to different locations.

This will enable routing based off of hashing the `fields` values or the `_key` metadata value if no `fields` are configured, and distributing that over the number of buckets configured. Thus your ending route will be a number representing the bucket it was assigned.

The hashing algorithm used is [FNV-1a](https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function)

To use this processor, the `fields` specified need to exist on the records and have values that are hashable, or the `_key` metadata value must be set and be a hashable value.

## Usage

### Determine bucket route of hashed values by fields
This is an example of how to configure and use this processor. The job below generates some data, creates a hash from the created and uuid fields and then assigns it a destination bucket from the hash, and sends it to elasticsearch.

Example Job

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
            "size": 1000
        }
    ],
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
    ]
}
```

Here is an example of data and the resulting metadata generated from it based on the job above.

```javascript

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

const results = await processor.run(data);

results[0].getMetadata('standard:route') === '4';
results[1].getMetadata('standard:route') === '8';

```

### Determine bucket route of hashed values by _key
This is an example of how to configure and use this processor. The job below generates some data, sets the `_key` value using the `uuid` field of the record, then hashes it and assigns it a bucket that will be used by the routed_sender

Example Job

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
            "size": 1000
        }
    ],
    "operations" : [
        {
            "_op": "data_generator",
            "size": 10000
        },
        {
            "_op": "set_id",
            "field": "uuid"
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
    ]
}
```

Here is an example of data and the resulting metadata generated from it based on the job above.

```javascript

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

const results = await processor.run(data);

results[0].getMetadata('standard:route') === '0';
results[1].getMetadata('standard:route') === '14';

```

## Parameters

| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| fields | Specifies fields to hash for partitioning. Must specify at least one field. | String[] | optional, defaults to using the _key metadata field |
| buckets | Number of partitions to use with hashing | Number | required |
