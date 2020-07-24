
# data_window_to_array #

Used to convert [DataWindow](../entity/data-window.md) to regular arrays


| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |

```javascript
const testData = [
    DataWindow.make('key', [{ id: 1 }, { id: 2 }, { id: 3 }]),
    DataWindow.make('key', [{ id: 4 }, { id: 5 }, { id: 6 }]),
    DataWindow.make('key', [{ id: 7 }, { id: 8 }, { id: 9 }])
];

// will be converted to this:
[
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
            "_op": "accumulate_by_key",
            "flush_data_on_shutdown": true,
            "empty_after": 10,
        },
        {
            "_op": "data_window_to_array"
        },
        {
            "_op": "noop"
        }
    ],
}

```
