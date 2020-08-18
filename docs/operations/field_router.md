# field_router

The `field_router` processor will tag the incoming records with the `standard:route` metadata which is used by the [routed_sender](./routed_sender.md) processor to dynamically routes records to different locations.

This will enable routing based off of field names and their values for routed_sender

To use this processor, it is required to specify the fields that will be used to determine its destination index. It is recommended that the combined fields/values being used results in a highly unique value to avoid clobbering, unless that is intended.


`NOTE this processor will replace any field value chars that have "=" or "\" with "_"`



## Usage

### Create routes using the fields and values or records
This is an example of using the fields and their values to create unique metadata routes. Notice that the order which you specify the fields will effect the outputted string.

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

Here is a representation of what the processor will do with the configuration listed in the job above. Note that as stated above any `=` and `\` values will be replaced with a `_` char.

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
Here is an example of building the `standard:route` metadata key just by the values and not by the fields names. You can also change the delimiter.

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

Here is a representation of what the processor will do with the configuration listed in the job above. Note that as stated above any `=` and `\` values will be replaced with a `_` char.

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
| fields | Array of fields to partition on. Must specify at least one field | String[] | required |
| include_field_names | Determines if field is included in route value | Boolean | optional, defaults to true |
| field_delimiter | separator between field/value combinations | String | optional, defaults to `-` |
| value_delimiter | separator between the field name and the value | String | optional, defaults to `_` |
