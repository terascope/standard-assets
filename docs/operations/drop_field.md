# drop_field

This `drop_field` processor drops a field from a [DataEntity](https://terascope.github.io/teraslice/docs/packages/utils/api/classes/dataentity) or [DataWindow](../entity/data-window.md).


## Usage

### Drop a field from a document

Example of a job using the `drop_field` processor

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
Output from example job

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
| field | Name of field to remove | required, no default |

