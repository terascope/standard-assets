# window

This processor is used to gather data within a certain time frame and return a [DataWindow](../entity/data-window.md) representing that time window.  This is similar to [accumulate](./accumulate.md) except it doesn't wait for empty slices to release the data and instead accumulates and releases data based on a time window.  

The processor can be configured to gather data by either [tumbling windows](https://ci.apache.org/projects/flink/flink-docs-release-1.8/dev/stream/operators/windows.html#tumbling-windows) or [sliding windows](https://ci.apache.org/projects/flink/flink-docs-release-1.8/dev/stream/operators/windows.html#sliding-windows).  The window duration can either be set to track the window duration by server time or base the window off of a date field value in the data.

## Usage

### Tumbling window

Example of a job using the `window` processor and using a tumbling window with a duration of 7 seconds. This has an `event_window_expiration` setting of 10 seconds.  Once 10 seconds passes with no new incoming data, it will return a window based on whatever documents have been accumulated.

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

Output of the example job

```javascript
// each record is one second apart
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

// first three records are only 3 seconds apart
results = await process.run(data.slice(0, 3))

// no return data expected
results === [];

// the next 3 records are only six seconds apart
results = await process.run(data.slice(3, 6))

// no results expected
results === [];

// the next records span 9 second from the first one
results = await process.run(data.slice(6, 9))

// 7 seconds worth of records are returned, the rest are kept for the next window
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

// no new incoming data
results = await process.run([]);

results === [];


// we wait 10 seconds for the event_window_expiration timer to expire
await pDelay(10000);

results = await process.run([])

// get the rest of the data
results === {
    dataArray: [
        { time: '2020-08-18T21:04:08.000Z' }
    ]
};

```

### Sliding window

Example of a job with a sliding window. The sliding_window_interval is 2 seconds.  This has an `event_window_expiration` setting of 10 seconds.  Once 10 seconds passes with no new incoming data, it will return a window based on whatever documents have been accumulated.

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

Output of the example job

```javascript
// each record is one second apart
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

results = await process.run(data)

// each DataWindow encompasses 3 seconds
// there is a 2 second difference for the start of each DataWindow 
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

// no new data
results = await process.run([]

results === [];

// we wait for the event_window_expiration timer
await pDelay(10000);

results = await process.run([])
// once the event_window_expiration passes it pushes out whatever the current window has collected
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
