# hash_router

The `hash_router` enables routing based off of hashing either the `fields` values or the `_key` metadata value.  It distributes the records equally over the number of partitions configured by adding the `standard:route` metadata to each record which is used by the [routed_sender](./routed_sender.md) processor to dynamically route records.  The hashing algorithm used is [FNV-1a](https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function).  This processor requires either the `fields` to be specified or the `_key` metadata value to be set.

## Usage

### Determine bucket route of hashed values by fields

Example of a job using the `hash_router` with `fields` configured and writing the data to Elasticsearch.  This configuration specifies 15 partitions, so each record will be routed to one of the 15 partitions depending the resulting hash value.  

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
            "partitions": 15
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

Output of the example job

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

Example of a job using the `hash_router` that uses the `_key` metadata value to determine the route.  In this example the `uuid` is set as the `_key` which is then used by the `hash_router` to assign the records to one of the 15 partitions.

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
            "_op": "set_key",
            "field": "uuid"
        },
        {
            "_op": "hash_router",
            "partitions": 15
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

Output of the example job

```javascript

const data = [
    DataEntity.make(
        {
            date: '2020-01-17T19:21:52.159Z',
            field1: 'val1.1',
            field2: 'val1.2',
            uuid: 'd0fd71ae-18db-41c6-b14f-e9fa40dc2566'
        },
        {
            _key: 'd0fd71ae-18db-41c6-b14f-e9fa40dc2566'
        }
    ),
    DataEntity.make(
        {
            date: '2020-01-17T19:21:52.159Z',
            field1: 'val2.1',
            field2: 'val2.2',
            uuid: '530ff04c-c673-4f75-b001-a341a16f64a3'
        },
        {
            _key: '530ff04c-c673-4f75-b001-a341a16f64a3'
        }
    ),
];

const results = await processor.run(data);

results[0].getMetadata('standard:route') === '1';
results[1].getMetadata('standard:route') === '14';

```

## Parameters

| Configuration | Description                                                                 | Type     | Notes                                               |
| ------------- | --------------------------------------------------------------------------- | -------- | --------------------------------------------------- |
| _op           | Name of operation, it must reflect the exact name of the file               | String   | required                                            |
| fields        | Specifies fields to hash for partitioning | String[] | optional, defaults to using the _key metadata field |
| partitions    | Number of partitions to use with hashing                                    | Number   | required                                            |
