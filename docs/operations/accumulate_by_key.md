# accumulate_by_key

The `accumulate_by_key` processor is used to gather and accumulate data over time, only to return results when a certain amount of slices generating zero results have been reached in which it will return an array of multiple [DataWindows](../entity/data-window.md) with each DataWindow containing records that have the same `_key` metadata value.

DataWindows are a special [DataEntity](https://terascope.github.io/teraslice/docs/packages/utils/api/classes/dataentity)  that encloses an array of data-entities.

For this processor to work, the `_key` metadata value of the records must be set.

`NOTE`: Be careful as the window can grow rather large if this is not flushed which only happens when there are slices with zero records.


## Usage

### Accumulate data
This is an example of of a job that will accumulate records and will only flush when there are three empty slices from from the reader `test-reader` or if the job is shutting down

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
            "_op": "accumulate_by_key",
            "flush_data_on_shutdown": true,
            "empty_after": 3
        }
    ]
}
```
Here is some pseudocode showing the behavior of the `accumulate_by_key` processor, and the expected output.
```javascript
const data = [
    DataEntity.make({ name: 'chilly' }, { _key: 1 }),
    DataEntity.make({ name: 'willy' }, { _key: 1 }),
    DataEntity.make({ name: 'billy' }, { _key: 2 }),
    DataEntity.make({ name: 'dilly' }, { _key: 3 }),
]

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
// third empty slice, since empty_after is set to 3, it returns multiple DataWindows which contains the accumulated data by _key
results4 === [
    // { name: 'chilly' } and { name: 'willy' } are in the same DataWindow as they have the same _key metadata
    { dataArray: [{ name: 'chilly' },  { name: 'willy' }] },
    { dataArray: [{ name: 'billy' }] },
    { dataArray: [{ name: 'dilly' }] }
]

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
| key_field              | Field to key docs by                                                               | String  | optional, defaults to _key  |
| batch_return           | If true will return arrays of specified batch_size                                 | Boolean | optional, defaults to false |
| batch_size             | Size of batches to return                                                          | Number  | optional, defaults to 1000  |
