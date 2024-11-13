# set_field_conditional

The `set_field_conditional` processor sets the value for a field in any [DataEntity](https://terascope.github.io/teraslice/docs/packages/utils/api/classes/dataentity) or [DataWindow](../entity/data-window.md). If the field already exists on a record the default behavior to is not overwrite it, but there is an option to overwrite the field value even if it exists.

## Usage

### Example Job

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
            "_op": "set_field_conditional",
            "conditional_field": "type",
            "conditional_values": ["data1", "data2"],
            "set_field": "test_prop",
            "value": true
        }
    ]
}

```
Example of the data and the expected results

```javascript
const data = [
    DataEntity.make({
        id: 1,
        test_prop: 'value'
    }),
    DataEntity.make({
        id: 2,
        type: 'data2'
    }),
    DataEntity.make({
        id: 3,
        type: 'data3'
    }),
]

const results = await processor.run(data);

results === [
    { id: 1, type: 'data1', test_prop: true },
    { id: 2, type: 'data2', test_prop: true },
    { id: 3, type: 'data3' }
]
```

## Parameters

| Configuration | Description                                                   | Type   | Notes                        |
| ------------- | ------------------------------------------------------------- | ------ | ---------------------------- |
| _op           | Name of operation, it must reflect the exact name of the file | String | required                     |
| conditional_field  | Field name to run checks on    | String | required |
| conditional_values  | Values to check for given Field    | Any[] | required |
| set_field | Name of the field to set | String | required |
| value   | Value to set field to        | Any | required |
