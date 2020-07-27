
# date_router #

This processor will tag records with the `standard:route` metadata which is used by the routed_sender processor to dynamically routes records to different locations.


This will enable timeseries based routing for the routed_sender



| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| field | Which field in each data record contains the date to use for timeseries | String | required |
| resolution | Type of timeseries data, may be set to `daily`, `monthly`, or `yearly` | String | optional, defaults to `daily` |
| field_delimiter | separator between field/value combinations | String | optional, defaults to `-` |
| value_delimiter | separator between the field name and the value | String | optional, defaults to `_` |


## Usage

```

const data =  {
    date: '2020-01-17T19:21:52.159Z',
    text: 'test data'
};

const opConfig = {
    _op: 'date_router',
    field: 'date',
    resolution: 'daily',
    field_delimiter: '-',
    value_delimiter: '_'
};

// the opConfig above will make: `year_2020-month_01-day_17`


const opConfig = {
    _op: 'date_router',
    field: 'date',
    resolution: 'monthly',
    field_delimiter: '-',
    value_delimiter: '_'
};

// the opConfig above will make: `year_2020-month_01`


const opConfig = {
    _op: 'date_router',
    field: 'date',
    resolution: 'monthly',
     field_delimiter: ' > '
    value_delimiter: '_'
};

// the opConfig above will make: `year_2020 > month_01`


const opConfig = {
    _op: 'date_router',
    field: 'date',
    resolution: 'yearly',
     field_delimiter: '-'
    value_delimiter: '&'
};

// the opConfig above will make: `year&2020`

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
            "_op": "date_router",
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
