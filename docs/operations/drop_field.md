# drop_field

This `drop_field` processor drops a field from a [DataEntity](https://terascope.github.io/teraslice/docs/packages/utils/api/classes/dataentity) or [DataWindow](../entity/data-window.md).


## Usage

### Drop a field from a document
Here is an example of dropping a field.

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
            "_op": "drop_field",
            "field": "name"
        }
    ]
}

```
Example of the data and the expected results

```javascript
const data = [
    DataEntity.make({ name: 'lilly', otherField: 1 }),
    DataEntity.make({ name: 'willy', otherField: 2  }),
    DataEntity.make({ name: 'billy', otherField: 3  }),
    DataEntity.make({ otherField: 4  }),
]

const results = await processor.run(data);

DataEntity.make({ otherField: 1 }),
DataEntity.make({ otherField: 2  }),
DataEntity.make({ otherField: 3  }),
DataEntity.make({ otherField: 4  }),
```

## Parameters

| Configuration | Description                                                   | Type   | Notes                        |
| ------------- | ------------------------------------------------------------- | ------ | ---------------------------- |
| _op  | Name of operation, it must reflect the exact name of the file | String | required                     |
| field | Name of field to remove from document | required, no default |

