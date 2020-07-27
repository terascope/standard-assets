
# field_router #

This processor will tag records with the `standard:route` metadata which is used by the routed_sender processor to dynamically routes records to different locations.


This will enable routing based off of field values for routed_sender


`NOTE this will replace any field value chars that have "=" or "\" with "_"`


| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| fields | WArray fields to partition on. Must specify at least one field | String[] | required |
| include_field_names | Determines if field is included in route value | Boolean | optional, defaults to true |
| field_delimiter | separator between field/value combinations | String | optional, defaults to `-` |
| value_delimiter | separator between the field name and the value | String | optional, defaults to `_` |


## Usage

```

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
]


const opConfig = {
    _op: 'field_router',
    field: [ 'field2', 'field1'],
    field_delimiter: '-',
    value_delimiter: '_',
    include_field_names: true
};

// new 'standard:route' metadata of each record, data stays unchanged
const metaData = [
    'field2_val2-field1_val1',
    'field2_val_2-field1_val_1',
    'field2_val_2-field1_val_1'
];


const opConfig = {
    _op: 'field_router',
    field: [ 'field2', 'field1'],
    field_delimiter: '/',
    value_delimiter: '_',
    include_field_names: true
};

// new 'standard:route' metadata of each record, data stays unchanged
const metaData = [
    'field2_val2/field1_val1',
    'field2_val_2/field1_val_1',
    'field2_val_2/field1_val_1'
];


const opConfig = {
    _op: 'field_router',
    field: [ 'field2', 'field1'],
    field_delimiter: '-',
    value_delimiter: '&',
    include_field_names: true
};

// new 'standard:route' metadata of each record, data stays unchanged
const metaData = [
    'field2&val2-field1&val1',
    'field2&val_2-field1&val_1',
    'field2&val_2-field1&val_1'
];


const opConfig = {
    _op: 'field_router',
    field: [ 'field2', 'field1'],
    field_delimiter: '-',
    value_delimiter: '_',
    include_field_names: false
};

// new 'standard:route' metadata of each record, data stays unchanged
const metaData = [
    'val2-val1',
    'val_2-val_1',
    'val_2-val_1'
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
            "_op": "field_router",
            "field": "created"
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
