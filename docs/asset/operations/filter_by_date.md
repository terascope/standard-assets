# filter_by_date

The `filter_by_date` processor filters records based on if the date value is within a given range

## Usage

### Filter records based off of date ranges

Example of a job using the `filter_by_date` processor

```json
{
    "name" : "testing",
    "workers" : 1,
    "slicers" : 1,
    "lifecycle" : "once",
    "assets" : [
        "standard"
    ],
    "operations" : [
        {
            "_op": "test-reader"
        },
        {
            "_op": "filter_by_date",
            "limit_past": "2week",
            "limit_future": "2day"
        }
    ]
}

```

Example of the data and the expected results

```javascript

// assuming current date is '2022-11-07T16:43:38.309Z'
const data = [
    DataEntity.make({ id: 1, timestamp: '2022-11-07T12:41:38.009Z' }),
    DataEntity.make({ id: 2, timestamp: '2022-09-02T12:13:28.823Z' }),
    DataEntity.make({ id: 3, timestamp: '2022-11-08T11:24:11.101Z' }),
    DataEntity.make({ id: 4, timestamp: '2022-11-11T09:22:54.534Z' }),
]

const results = await processor.run(data);

DataEntity.make({ id: 1, timestamp: '2022-11-07T12:41:38.009Z' }),
DataEntity.make({ id: 3, timestamp: '2022-11-08T11:24:11.101Z' }),
```

## Parameters

| Configuration | Description                                                   | Type   | Notes                        |
| ------------- | ------------------------------------------------------------- | ------ | ---------------------------- |
| _op     | Name of operation, it must reflect the exact name of the file | String | required |
| date_field  | The name of the date field to check | String | required, defaults to the "date" field |
| limit_past  | The lower date limit a date can be, can either be any exact date (ie an ) | String | required, defaults to '1week' |
| limit_future  | The higher date limit a date can be | String | required,  defaults to '1day' |
