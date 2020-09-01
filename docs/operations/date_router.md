# date_router

The `date_router` processor will tag the incoming records with the `standard:route` metadata which is used by the [routed_sender](./routed_sender.md) processor to dynamically routes records to different locations.

This will enable time series based routing for the routed_sender

To use this processor, it is required that the record has a field with an appropriate date value that will be used to determine its destination index.


## Usage

### Enable time series indexing by year, month and date
Here is an example of using the processor to annotate records by year, month and date and dynamically send it to different indicies in elasticsearch. The way the operation is configured will check the created field, and format the date accordingly

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
            "_op": "date_router",
            "field": "created",
            "resolution": "daily",
            "field_delimiter": "-",
            "value_delimiter": "_"
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

``` javascript
const data = [{
    created: '2020-01-17T19:21:52.159Z',
    text: 'test data'
}];

const results = await processor.run(data);

results[0].getMetadata('standard:route') === `2020-01-17`;
```

### Example of changing the date resolution and delimiters
In this example we show how we can change the resolution of the date and change the delimiters of the field and value to create another path, which will then be used by the routed_sender to send to a file.

Example Job
```json
{
    "name" : "testing",
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
            "path": "/app/data/",
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
            "field_delimiter": "."
        },
        {
            "_op": "routed_sender",
            "api_name": "file_sender_api",
            "routing": {
                "**": "default"
            }
        }
    ]
}
```
Here is an example of what will be returned from the processor
``` javascript
const data = [{
    created: '2020-01-17T19:21:52.159Z',
    text: 'test data'
}];

const results = await processor.run(data);

results[0].getMetadata('standard:route') === `2020.01`;
```

### Enable time series indexing by year, month and date including date units
Here is an example of using the processor to annotate records by year, month and date attached with its unit name, and dynamically send it to different indicies in elasticsearch. The way the operation is configured will check the created field, and format the date accordingly

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
            "_op": "date_router",
            "field": "created",
            "resolution": "monthly",
            "field_delimiter": " > ",
            "value_delimiter": ":",
            "include_date_units": "true"
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

``` javascript
const data = [{
    created: '2020-01-17T19:21:52.159Z',
    text: 'test data'
}];

const results = await processor.run(data);

results[0].getMetadata('standard:route') === `year:2020 > month:01`;
```


## Parameters
| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| field | Which field in each data record contains the date to use for time series | String | required |
| resolution | Type of time series data, may be set to `daily`, `monthly`, or `yearly` | String | optional, defaults to `daily` |
| field_delimiter | separator between field/value combinations | String | optional, defaults to `-` |
| value_delimiter | separator between the field name and the value | String | optional, defaults to `_` |
| include_date_units | Determines if the date unit (year, month, day) should be included in final output | Boolean | optional, defaults to false |
