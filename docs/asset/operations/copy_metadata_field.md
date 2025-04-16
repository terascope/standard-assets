# copy_metadata_field

The `copy_metadata_field` processor copies the metadata field value to a destination field for any [DataEntity](https://terascope.github.io/teraslice/docs/packages/utils/api/classes/dataentity) or [DataWindow](../entity/data-window.md).

## Usage

### Copy a field value to another field

Example of a job using the `copy_metadata_field` processor

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
            "_op": "copy_metadata_field",
            "meta_key": "_key",
            "destination": "myField"
        }
    ]
}

```

Example of the data and the expected results

```javascript
const data = [
    DataEntity.make({ name: 'lilly', otherField: 1 }, { _key: 'a1' }),
    DataEntity.make({ name: 'willy', otherField: 2 }, { _key: 'b2' }),
    DataEntity.make({ name: 'billy', otherField: 3 }, { _key: 'c3' }),
    DataEntity.make({ name: 'dilly', otherField: 4 }, { _key: 'd4' }),
]

const results = await processor.run(data);

DataEntity.make({ name: 'lilly', myField: 'a1', otherField: 1 }),
DataEntity.make({ name: 'willy', myField: 'b2', otherField: 2  }),
DataEntity.make({ name: 'billy', myField: 'c3', otherField: 3  }),
DataEntity.make({ name: 'dilly', myField: 'd4', otherField: 4  }),
```

## Parameters

| Configuration | Description                                                   | Type   | Notes                        |
| ------------- | ------------------------------------------------------------- | ------ | ---------------------------- |
| _op           | Name of operation, it must reflect the exact name of the file | String | required |
| meta_key         | Name of metadata field to copy the value from | String | required, defaults to "_key" |
| destination    | Name of field to copy the value to | String | required, no default |
