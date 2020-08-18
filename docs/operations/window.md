# window

This processor is used to gather data within a certain frame and return a [DataWindow](../entity/data-window.md) representing that frame.

You would want to use this over [accumulate](./accumulate.md) and [accumulate_by_id](./accumulate_by_id.md) you you wanted well defined date based windows instead of counting the amount of empty slices.

This can be configured to have [tumbling windows](https://ci.apache.org/projects/flink/flink-docs-release-1.8/dev/stream/operators/windows.html#tumbling-windows) or [sliding windows](https://ci.apache.org/projects/flink/flink-docs-release-1.8/dev/stream/operators/windows.html#sliding-windows)

The timing can either be set to `clock` (which tracks by server time) or set to `event` which is based off of the time set on the record at what is configured at `time_field`

## Usage
### Tumbling window
This is an example of a tumbling window that has a duration of 7 seconds. This is also configured to have an event_window_expiration of 10 seconds of server time so it will return a window if that time has passed.

Example Job

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
            "window_length": 7000,
            "window_type": "tumbling",
            "time_field": "time",
            "window_time_setting": "event",
            "event_window_expiration": 10000
        }
    ]
}

```
Here is a representation of what the processor will do with the configuration listed in the job above

```javascript
// for the example, each record is one second apart
const data = [
    { time: '2020-08-18T21:04:00.000Z' },
    { time: '2020-08-18T21:04:01.000Z' },
    { time: '2020-08-18T21:04:02.000Z' },
    { time: '2020-08-18T21:04:03.000Z' },
    { time: '2020-08-18T21:04:04.000Z' },
    { time: '2020-08-18T21:04:05.000Z' },
    { time: '2020-08-18T21:04:06.000Z' },
    { time: '2020-08-18T21:04:07.000Z' },
    { time: '2020-08-18T21:04:08.000Z' }
];

// first three seconds
results = await process.run(data.slice(0, 3))

results === [];

// six seconds, still not at 7 second threshold
results = await process.run(data.slice(3, 6))

results === [];

// 7 second threshold, we return a DataWindow
results = await process.run(data.slice(6, 9))

// only 7 seconds worth of records are returned, the rest are kept for next window
results === {
    dataArray: [
        { time: '2020-08-18T21:04:00.000Z' },
        { time: '2020-08-18T21:04:01.000Z' },
        { time: '2020-08-18T21:04:02.000Z' },
        { time: '2020-08-18T21:04:03.000Z' },
        { time: '2020-08-18T21:04:04.000Z' },
        { time: '2020-08-18T21:04:05.000Z' },
        { time: '2020-08-18T21:04:06.000Z' },
        { time: '2020-08-18T21:04:07.000Z' },
    ]
};

results = await process.run([]);

results === [];


// we wait for the event_window_expiration timer
await pDelay(10000);

results = await process.run([])

results === {
    dataArray: [
        { time: '2020-08-18T21:04:08.000Z' }
    ]
};

```

### Sliding window
This is an example of a sliding window that has a duration of 3 seconds. The sliding_window_interval is 2 seconds. This is also configured to have an event_window_expiration of 10 seconds of server time so it will return a window if that time has passed.

Example Job

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
            "event_window_expiration": 10000
        }
    ]
}

```
Here is a representation of what the processor will do with the configuration listed in the job above

```javascript
// for the example, each record is one second apart
const data = [
    { time: '2020-08-18T21:04:00.000Z' },
    { time: '2020-08-18T21:04:01.000Z' },
    { time: '2020-08-18T21:04:02.000Z' },
    { time: '2020-08-18T21:04:03.000Z' },
    { time: '2020-08-18T21:04:04.000Z' },
    { time: '2020-08-18T21:04:05.000Z' },
    { time: '2020-08-18T21:04:06.000Z' },
    { time: '2020-08-18T21:04:07.000Z' },
    { time: '2020-08-18T21:04:08.000Z' },
    { time: '2020-08-18T21:04:09.000Z' }
];

// first three seconds
results = await process.run(data)

// each DataWindow encompasses 3 seconds as configured
// but there are 2 second difference from the start of each DataWindow
results === [
    {
        dataArray: [
            { time: '2020-08-18T21:04:00.000Z' },
            { time: '2020-08-18T21:04:01.000Z' },
            { time: '2020-08-18T21:04:02.000Z' },
            { time: '2020-08-18T21:04:03.000Z' }
        ]
    },
    {
        dataArray: [
            { time: '2020-08-18T21:04:02.000Z' },
            { time: '2020-08-18T21:04:03.000Z' },
            { time: '2020-08-18T21:04:04.000Z' },
            { time: '2020-08-18T21:04:05.000Z' },
        ]
    },
    {
        dataArray: [
            { time: '2020-08-18T21:04:04.000Z' },
            { time: '2020-08-18T21:04:05.000Z' },
            { time: '2020-08-18T21:04:06.000Z' },
            { time: '2020-08-18T21:04:07.000Z' },
        ]
    }
];

// six seconds, still not at 7 second threshold
results = await process.run([]

results === [];

// we wait for the event_window_expiration timer
await pDelay(10000);

results = await process.run([])

results === {
    dataArray: [
        { time: '2020-08-18T21:04:06.000Z' },
        { time: '2020-08-18T21:04:07.000Z' },
        { time: '2020-08-18T21:04:08.000Z' },
        { time: '2020-08-18T21:04:09.000Z' }
    ]
};

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
