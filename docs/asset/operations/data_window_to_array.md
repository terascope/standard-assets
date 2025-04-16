# data_window_to_array

The `data_window_to_array` processor converts arrays of [DataWindows](../entity/data-window.md) to a flattened array of [DataEntities](https://terascope.github.io/teraslice/docs/packages/utils/api/entities/data-entity/classes/dataentity).  The input must be an array of DataWindows.

## Usage

### Convert DataWindows to an array of data

Example of a job using the `data_window_to_array` processor

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

Output from the example job

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
