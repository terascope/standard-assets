# data_window_to_array #

The `data_window_to_array` is a helper processor that is used to convert [DataWindows](../entity/data-window.md) to a flattened array of all results of the DataWindows.

To use this processor, the input must be an array of DataWindow objects

## Usage

### Convert DataWindows to an array of data
Here is an example us using `data_window_to_array` to convert DataWindows back to a flattened array

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
            "empty_after": 10
        },
        {
            "_op": "data_window_to_array"
        },
        {
            "_op": "noop"
        }
    ]
}
```
Here is an example of a list of DataWindows being converted by the processor
```javascript
const dataWindowList = [
    { dataArray: [{ id: 1 }, { id: 2 }, { id: 3 }] },
    { dataArray: [{ id: 4 }, { id: 5 }, { id: 6 }] },
    { dataArray: [{ id: 7 }, { id: 8 }, { id: 9 }] }
];

const results = await processor.run(dataWindowList);


// will be converted to this:
results === [
    { id: 1 },
    { id: 2 },
    { id: 3 },
    { id: 4 },
    { id: 5 },
    { id: 6 },
    { id: 7 },
    { id: 8 },
    { id: 9 }
]
```


## Parameters

| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
