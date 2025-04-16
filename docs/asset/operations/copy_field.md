# copy_field

The `copy_field` processor copies the source field value to a destination field for any [DataEntity](https://terascope.github.io/teraslice/docs/packages/utils/api/entities/data-entity/classes/dataentity) or [DataWindow](../entity/data-window.md).

## Usage

### Copy a field value to another field

Example of a job using the `copy_field` processor

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
            "_op": "copy_field",
            "source": "name",
            "destination": "name_again"
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
    DataEntity.make({ name: 'dilly', otherField: 4  }),
]

const results = await processor.run(data);

DataEntity.make({ name: 'lilly', name_again: 'lilly', otherField: 1 }),
DataEntity.make({ name: 'willy', name_again: 'willy', otherField: 2  }),
DataEntity.make({ name: 'billy', name_again: 'billy', otherField: 3  }),
DataEntity.make({ name: 'dilly', name_again: 'dilly', otherField: 4  }),
```

## Parameters

| Configuration | Description                                                   | Type   | Notes                        |
| ------------- | ------------------------------------------------------------- | ------ | ---------------------------- |
| _op           | Name of operation, it must reflect the exact name of the file | String | required |
| source         | Name of field to copy the value from | String | required, no default |
| destination    | Name of field to copy the value to | String | required, no default |
| delete_source  | Option to delete the source field once the value is copied to the destination field| Boolean | optional, defaults to `false` |
