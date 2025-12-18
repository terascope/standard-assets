# key_router

The `key_router` processor enables routing based off of the `_key` metadata. This processor adds the `standard:route` metadata to each record which is used by the [routed_sender](./routed_sender.md) processor to dynamically route records.  The `key_router` requires the `_key` metadata field to exist.  The final route value must be composed of characters that can be used for its destination. For example, if sending data to elasticsearch, the route must be lowercase with no reserved characters.  Please be aware of the constraints and requirements of where the data will be written.

## Usage

### Use the whole _key value but lowercase it

Example of a job using the `key_router` and setting all the characters to be lowercase.

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
            "_api_name": "elasticsearch_sender_api",
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

### Use a part of the _key value

Example of a job using part of the `_key` value

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
            "_api_name": "elasticsearch_sender_api",
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

### Add a Suffix to the route

Example of a job adding a suffix the the route

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
            "case": "lower",
            "suffix_use": true,
            "suffix_upper": "--u",
            "suffix_lower": "--l",
            "suffix_number": "--n",
            "suffix_other": "--c"
        },
        {
            "_op": "routed_sender",
            "_api_name": "elasticsearch_sender_api",
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
            _key: 'FIRSTKEY'
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
    DataEntity.make(
        {
            date: '2020-01-17T19:21:52.159Z',
            field1: 'val2.1',
            field2: 'val2.2'
        },
        {
            _key: '11234key'
        }
    ),
     DataEntity.make(
        {
            date: '2020-01-17T19:21:52.159Z',
            field1: 'val2.1',
            field2: 'val2.2'
        },
        {
            _key: '-otherkey'
        }
    ),
];

const results = await processor.run(data);

results[0].getMetadata('standard:route') === 'f--u';
results[1].getMetadata('standard:route') === 's--l';
results[1].getMetadata('standard:route') === '1--n';
results[1].getMetadata('standard:route') === '---c';
```

## Parameters

| Configuration | Description                                                                                             | Type    | Notes                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------ |
| _op           | Name of operation, it must reflect the exact name of the file                                           | String  | required                                                     |
| use           | The number of characters to slice off the key and use as the routing value                              | Number  | optional, if used it must be used in conjunction with `from` |
| from          | Whether the characters are sliced from the `beginning` or `end` of the key                              | String  | optional, if used it must be used in conjunction with `use`  |
| case          | Specify the case of the route.  Options are `preserve`, `lower`, or `upper`  | String  | optional, defaults to preserve. When using with Elasticsearch use `"case": "lower"`. |
| suffix_use    | Append a suffix to the route depending on the case of the route value.  Though the final route value can be altered by the `case` setting the suffix is based on the original value's case.   It should be noted that when using with the `use` setting configured to a value greater than one there is a risk of clobbering the case of the extracted values. IE both `aa` and `aA` end up as `aa--l` | Boolean | optional, defaults to false requires at list one suffix_(upper/lower/number/other)  |
| suffix_upper  | Suffix value to be appended to the extracted value when the value is an upper case letter.              | String  | optional, defaults to `''`                                   |
| suffix_lower  | Suffix value to be appended to the extracted value when the value is a lower case letter.               | String  | optional, defaults to `''`                                   |
| suffix_number | Suffix value to be appended to the extracted value when the value is a number.                          | String  | optional, defaults to `''`                                   |
| suffix_other  | Suffix value to be appended to the extracted value when the value is a neither letter or number.        | String  | optional, defaults to `''`                                   |
