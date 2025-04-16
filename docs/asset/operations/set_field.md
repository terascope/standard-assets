# set_field

The `set_field` processor sets the value for a field in any [DataEntity](https://terascope.github.io/teraslice/docs/packages/utils/api/classes/dataentity) or [DataWindow](../entity/data-window.md). If the field already exists on a record the default behavior to is not overwrite it, but there is an option to overwrite the field value even if it exists.

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
            "_op": "set_field",
            "field": "some_field",
            "value": 2
        }
    ]
}

```

Example of the data and the expected results

```javascript
const data = [
    DataEntity.make({ name: 'milly' }),
    DataEntity.make({ name: 'willy' }),
    DataEntity.make({ name: 'billy' }),
    DataEntity.make({ name: 'dilly' }),
]

const results = await processor.run(data);

results === [
    { name: 'milly', 'some_field': 2 }
    { name: 'willy', 'some_field': 2 }
    { name: 'billy', 'some_field': 2 }
    { name: 'dilly', 'some_field': 2 }
]
```

## Parameters

| Configuration | Description                                                   | Type   | Notes                        |
| ------------- | ------------------------------------------------------------- | ------ | ---------------------------- |
| _op           | Name of operation, it must reflect the exact name of the file | String | required                     |
| field         | Field name to set value                  | String | required |
| value         | Value to set field to                    | String | required |
| overwrite | Set to true to overwrite the field to the specified value if it exists | Boolean | default `false` |
