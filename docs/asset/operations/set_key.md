# set_key

The `set_key` processor is used to set the `_key` metadata value for any [DataEntity](https://terascope.github.io/teraslice/docs/packages/utils/api/classes/dataentity) or [DataWindow](../entity/data-window.md).

## Usage

### Set the _key metadata from a field value

Example of a job that uses `set_key` processor

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
            "_op": "set_key",
            "field": "otherField"
        }
    ]
}

```

Output of example job

```javascript
const data = [
    DataEntity.make({ name: 'chilly', otherField: 1 }),
    DataEntity.make({ name: 'willy', otherField: 2  }),
    DataEntity.make({ name: 'billy', otherField: 3  }),
    DataEntity.make({ name: 'dilly', otherField: 4  }),
]

const results = await processor.run(data);

results[0].getKey() === 1
results[1].getKey() === 2
results[2].getKey() === 3
results[3].getKey() === 4
```

## Parameters

| Configuration | Description                                                   | Type   | Notes                        |
| ------------- | ------------------------------------------------------------- | ------ | ---------------------------- |
| _op           | Name of operation, it must reflect the exact name of the file | String | required                     |
| field         | Field name of value used to set key                           | String | optional, defaults to `_key` |
