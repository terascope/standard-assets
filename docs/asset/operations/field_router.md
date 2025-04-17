# field_router

The `field_router` processor enables routing based off of field names and their values.  It adds the `standard:route` metadata to each record which is used by the [routed_sender](./routed_sender.md) processor to dynamically route records to different locations.  This processor requires the `field` setting to be configured in the job.

`NOTE this processor will replaces the characters "=" or "\" with "_" in the route value to ensure a valid route name`

## Usage

### Create routes using the fields and values or records

Example of a job using the `field_router`.  Notice that the order which you specify the fields will effect the outputted string.

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
            "_op": "field_router",
            "field": [ "field2", "field1"],
            "field_delimiter": "-",
            "value_delimiter": "_",
            "include_field_names": true
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

Output of the example job.  Note the `=` and `\` characters are replaced with a `_` char in the route.

```javascript
const data =  [
    {
        date: '2020-01-17T19:21:52.159Z',
        field1: 'val1',
        field2: 'val2'
    },
     {
        date: '2020-01-17T19:21:52.159Z',
        field1: 'val/1',
        field2: 'val/2'
    },
    {
        date: '2020-01-17T19:21:52.159Z',
        field1: 'val=1',
        field2: 'val=2'
    }
];

const results = await processor.run(data);

results[0].getMetadata('standard:route') === 'field2_val2-field1_val1';
results[1].getMetadata('standard:route') === 'field2_val_2-field1_val_1';
results[2].getMetadata('standard:route') === 'field2_val_2-field1_val_1';
```

### Can build metadata key just by values alone

Example a job without the field names in the route

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
            "_op": "field_router",
            "field": [ "field2", "field1"],
            "value_delimiter": ":",
            "include_field_names": false
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
const data =  [
    {
        date: '2020-01-17T19:21:52.159Z',
        field1: 'val1',
        field2: 'val2'
    },
     {
        date: '2020-01-17T19:21:52.159Z',
        field1: 'val/1',
        field2: 'val/2'
    },
    {
        date: '2020-01-17T19:21:52.159Z',
        field1: 'val=1',
        field2: 'val=2'
    }
];

const results = await processor.run(data);

results[0].getMetadata('standard:route') === 'val2:val1';
results[1].getMetadata('standard:route') === 'val_2:val_1';
results[2].getMetadata('standard:route') === 'val_2:val_1';
```

## Parameters

| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| fields | Array of fields used to build route. Must specify at least one field | String[] | required |
| include_field_names | Determines if field name is included in route value | Boolean | optional, defaults to true |
| field_delimiter | separator between field/value combinations | String | optional, defaults to `-` |
| value_delimiter | separator between the field name and the value | String | optional, defaults to `_` |
