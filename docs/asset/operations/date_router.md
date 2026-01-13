# date_router

The `date_router` enables time series based routing by the [routed_sender](./routed_sender.md).   It uses a date field on the incoming record, as specified by the job config, to annotate a record's `standard:route` metatdata with a time based route.   The `standard:route` metadata is then read by the the routed_sender and used to determine the route for each record.

## Usage

### Example of time series routing with daily resolution using Elasticsearch

This teraslice job would write the record with `created: 2021-09-14` to the index `example-index-2021.09.14`.

Example Job

```json
{
    "name" : "example",
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
            "index": "example-index",
            "size": 1000
        }
    ],
    "operations" : [
        {
            "_op": "data_generator",
            "size": 10000
        },
        {
            "_op": "date_router",
            "field": "created",
            "resolution": "daily",
            "date_delimiter": "."
        },
        {
            "_op": "routed_sender",
            "_api_name": "elasticsearch_sender_api",
            "routing": {
                "**": "ELASTICSEARCH_CONNECTION"
            }
        }
    ]
}
```

View of the metadata for a record processed with the above job config:

```javascript
// incoming doc
const doc = {
    foo: 'bar',
    created: '2021-09-14T19:21:52.159Z'
}

// post date_router process
doc.getMetadata('standard:route') // 2021.09.14
```

### Example of time series routing with weekly_epoch resolution using Elasticsearch

This teraslice job would write the record with `created: 2021-09-14` to the index `example-index-2697`.

Example Job

```json
{
    "name" : "example",
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
            "index": "example-index",
            "size": 1000
        }
    ],
    "operations" : [
        {
            "_op": "data_generator",
            "size": 10000
        },
        {
            "_op": "date_router",
            "field": "created",
            "resolution": "weekly_epoch"
        },
        {
            "_op": "routed_sender",
            "_api_name": "elasticsearch_sender_api",
            "routing": {
                "**": "ELASTICSEARCH_CONNECTION"
            }
        }
    ]
}
```

View of the metadata for a record processed with the above job config:

```javascript
// incoming doc
const doc = {
    foo: 'bar',
    created: '2021-09-14T19:21:52.159Z'
}

// post date_router process
doc.getMetadata('standard:route') // 2697
```

### Example of time series routing with monthly resolution using a file system

This example writes to a file location.  A record with `created: 2021-08-21` will be saved to the path and file `/example/path/2021_08`

Example Job

```json
{
    "name" : "example",
    "workers" : 1,
    "slicers" : 1,
    "lifecycle" : "once",
    "assets" : [
        "standard",
        "file"
    ],
    "apis": [
        {
            "_name": "file_sender_api",
            "path": "/example/path/",
            "format": "tsv",
            "file_per_slice": true
        }
    ],
    "operations" : [
        {
            "_op": "data_generator",
            "size": 10000
        },
        {
            "_op": "date_router",
            "field": "created",
            "resolution": "monthly",
            "date_delimiter": "_"
        },
        {
            "_op": "routed_sender",
            "_api_name": "file_sender_api",
            "routing": {
                "**": "FILE_CONNECTION"
            }
        }
    ]
}
```

View of the metadata for a record processed with the above job config:

```javascript
// incoming doc
const doc = {
    foo: 'bar',
    created: '2021-08-21T19:21:52.159Z'
}

// post date_router process
doc.getMetadata('standard:route') // 2021_08
```

### Example of time series routing with daily resolution and date units using a file system

This example also writes to a file location but includes the date units in the route .   Note that "`/`" is used as the date_delimiter to create file paths based on the year and month.  A record with `created: 2021-08-21` will be saved to the path and file `/example/path/year_2021/month_08/day_21`.

Example Job

```json
{
    "name" : "example",
    "workers" : 1,
    "slicers" : 1,
    "lifecycle" : "once",
    "assets" : [
        "standard",
        "file"
    ],
    "apis": [
        {
            "_name": "file_sender_api",
            "path": "/example/path/",
            "format": "tsv",
            "file_per_slice": true
        }
    ],
    "operations" : [
        {
            "_op": "data_generator",
            "size": 10000
        },
        {
            "_op": "date_router",
            "field": "created",
            "resolution": "daily",
            "date_delimiter": "/",
            "include_date_units": true,
            "date_unit_delimiter": "_"
        },
        {
            "_op": "routed_sender",
            "_api_name": "file_sender_api",
            "routing": {
                "**": "FILE_CONNECTION"
            }
        }
    ]
}
```

View of the metadata for a record processed with the above job config:

```javascript
// incoming doc
const doc = {
    foo: 'bar',
    created: '2021-08-21T19:21:52.159Z'
}

// post date_router process
doc.getMetadata('standard:route') // year_2021/month_08/day_21
```

## Parameters

| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | routed_sender | String | required |
| field | Name of field that will be used for the time series routing, must be a date field | String | required |
| use_clock_time | Uses system time for the series routing instead of pulling the date from the incoming data, overrides the `field` setting | Boolean | optional, defaults to false |
| resolution | The unit of time that a record will be routed by, options are `daily`, `monthly`, `yearly`, `weekly`, or `weekly_epoch (weeks since 1/1/1970)` | String | optional, defaults to `daily` |
| date_delimiter | Separator between the date parts in the route, limited to the characters `".", "-", "_", "/" or "" (no delimiter)` | String | optional, defaults to `.` |
| include_date_units | Determines if the date unit (year, month, day) should be included in final output | Boolean | optional, defaults to false |
| date_unit_delimiter | Separator between the date units and their values, limited to the characters `".", "-", "_", "/" or "" (no delimiter)`| String | optional, defaults to `_` |
