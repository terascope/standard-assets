# window

This processor is used to gather data within a certain frame and return a [DataWindow](../entity/data-window.md) representing that frame.

This can be configured to have [tumbling windows](https://ci.apache.org/projects/flink/flink-docs-release-1.8/dev/stream/operators/windows.html#tumbling-windows) or [sliding windows](https://ci.apache.org/projects/flink/flink-docs-release-1.8/dev/stream/operators/windows.html#sliding-windows)

The timing can either be set to `clock` (which is server time) or set to `event` which is based off of the time set on the record at what is configured at `time_field`



## Example Job

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
            "_op": "window",
            "window_length": 3000,
            "window_type": "sliding",
            "sliding_window_interval": 2000,
            "time_field": "time",
            "window_time_setting": "event",
            "event_window_expiration": 100
        }
    ]
}

```


 ## Parameters

| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| time_field | field name that holds the time value | String | optional, defaults to @timestamp |
| window_time_setting | May be set to `clock` or `event` time | String | optional, defaults to `event` |
| window_length | Length of time for each window in milliseconds | Number | optional, defaults to 30000 |
| window_type | Type of window, `tumbling` or `sliding` | String | optional, defaults to `tumbling` |
| sliding_window_interval | Determines when to start a new sliding window, in milliseconds | Number | optional, defaults to 0, which means it start a new window on every slice |
| event_window_expiration | Determines how long to hold event based windows in milliseconds, 0 means no expiration | Number | optional, defaults to 0 |
