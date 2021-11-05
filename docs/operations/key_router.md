# key_router

The `key_router` processor will tag the incoming records with the `standard:route` metadata which is used by the [routed_sender](./routed_sender.md) processor to dynamically routes records to different locations.

This will enable routing based off of the `_key` metadata for routed_sender

To use this processor, the `_key` must exists and must have valid chars that can be used for its destination, which is dependent on where you are sending it. For example, if sending it to elasticsearch, it must be lower cased and there are certain char restrictions.

Please be aware of the constraints for the particular destination api you are using.

## Usage

### Use the whole _key value but lowercase it
Here is an example of creating a route valid and changing the case of it

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
            "_op": "test-reader",
        },
        {
            "_op": "key_router",
            "case": "lower"
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
            _key: 'firstKEY'
        }
    ),
    DataEntity.make(
        {
            date: '2020-01-17T19:21:52.159Z',
            field1: 'val2.1',
            field2: 'val2.2'
        },
        {
            _key: 'secondKEY'
        }
    ),
];

const results = await processor.run(data);

results[0].getMetadata('standard:route') === 'firstkey';
results[1].getMetadata('standard:route') === 'secondkey';
```

### Use a partial of _key value
Here is an example of creating a route from part of the `_key` value

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
            "_op": "test-reader",
        },
        {
            "_op": "key_router",
            "use:": 1,
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
            _key: 'firstKEY'
        }
    ),
    DataEntity.make(
        {
            date: '2020-01-17T19:21:52.159Z',
            field1: 'val2.1',
            field2: 'val2.2'
        },
        {
            _key: 'secondKEY'
        }
    ),
];

const results = await processor.run(data);

results[0].getMetadata('standard:route') === 'f';
results[1].getMetadata('standard:route') === 's';
```


## Parameters

| Configuration | Description                                                                                            | Type   | Notes                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------ |
| _op           | Name of operation, it must reflect the exact name of the file                                          | String | required                                                     |
| use           | The number of characters to slice off the key and use as the routing value'                            | Number | optional, if used it must be used in conjunction with `from` |
| from          | Whether the characters are sliced from the `beginning` or `end` of the key                             | String | optional, if used it must be used in conjunction with `use`  |
| case          | Transform to apply to the values extracted from the key, may be set to `preserve`, `lower`, or `upper` | String | optional, defaults to preserve                               |
