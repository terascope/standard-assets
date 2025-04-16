# accumulate

The `accumulate` processor is used to gather and accumulate data over time.  It returns the results when the specified number of empty slices has been processed.  The returned entity is the accumulated data in a single [DataWindow](../entity/data-window.md).

`NOTE`: The processor can potentially cause memory errors because it will continue to hold data in memory until it gets the specified number of empty slices or the job is stopped.

## Usage

### Accumulate data by key

Example of a job using the `accumulate` processor

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
            "_op": "accumulate",
            "flush_data_on_shutdown": true,
            "empty_after": 3
        }
    ]
}
```

Here is some pseudocode showing the behavior of the `accumulate` processor, and the expected output.

```javascript
const data = [
    DataEntity.make({ name: 'chilly' }, { _key: 1 }),
    DataEntity.make({ name: 'willy' }, { _key: 2 }),
    DataEntity.make({ name: 'billy' }, { _key: 3 }),
    DataEntity.make({ name: 'dilly' }, { _key: 4 }),
];

const results1 = await processor.run(data);
// processor is accumulating
results1 === [];

const results2 = await processor.run([]);
// first empty slice
results2 === [];

const results3 = await processor.run([]);
// second empty slice
results3 === [];

const results4 = await processor.run([]];
// third empty slice, since empty_after is set to 3, it returns a DataWindow which contains the accumulated data
results4 === [
    {
        dataArray: [{ name: 'chilly' },  { name: 'willy' }, { name: 'billy' }, { name: 'dilly' }]
    }
];

const flushedData = [
        DataEntity.make({ i: 'willBeFlushed' }, { _key: 5 }),
]

const results5 = await processor.run(flushedData);
// processor is accumulating
results5 === [];

// shutdown event fires, processor will flush its accumulation on this event
const flushedResults = [
    { dataArray: [{ i: 'willBeFlushed' }] }
]
```

## Parameters

| Configuration          | Description                                                                        | Type    | Notes                       |
| ---------------------- | ---------------------------------------------------------------------------------- | ------- | --------------------------- |
| _op                    | Name of operation, it must reflect the exact name of the file                      | String  | required                    |
| empty_after            | How many 0 record slices to require before starting to return the accumulated data | Number  | optional, defaults to 10    |
| flush_data_on_shutdown | Option to flush partial data accumulation on unexpected shutdown                   | Boolean | optional, defaults to false |
