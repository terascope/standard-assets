# keep_field

The `keep_field` processor keeps only the specified field, or fields, on a [DataEntity](https://terascope.github.io/teraslice/docs/packages/utils/api/entities/data-entity/classes/dataentity) or [DataWindow](../entity/data-window.md) and removes all others. It is the inverse of [drop_field](./drop_field.md).

## Usage

### Keep only the specified field on a document

Example of a job using the `keep_field` processor

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
            "_op": "keep_field",
            "field": "name"
        }
    ]
}

```

Here is a representation of what the processor will do with the configuration listed in the job above

```javascript
const data = [
    DataEntity.make({ name: 'lilly', otherField: 1 }),
    DataEntity.make({ name: 'willy', otherField: 2  }),
    DataEntity.make({ name: 'billy', otherField: 3  }),
    DataEntity.make({ otherField: 4  }),
]

const results = await processor.run(data);

results = [
    { name: 'lilly' },
    { name: 'willy' },
    { name: 'billy' },
    { },
]
```

## Parameters

| Configuration | Description                                                   | Type   | Notes                        |
| ------------- | ------------------------------------------------------------- | ------ | ---------------------------- |
| _op  | Name of operation, it must reflect the exact name of the file | String | required                     |
| field | Name of field, or array of field names, to keep; all other fields are removed | String or String[] | required, no default |
