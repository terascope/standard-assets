# remove_key

This processor removes the `_key` metadata value for any [DataEntity](https://terascope.github.io/teraslice/docs/packages/utils/api/classes/dataentity) or [DataWindow](../entity/data-window.md).


## Usage

### Remove the _key of records

Example of a job using the `remove_key` processor

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
            "_op": "remove_key"
        }
    ]
}
```

Output of example job

```javascript
const data = [
    DataEntity.make({ name: 'chilly' }, { _key: 1 }),
]

const results = await processor.run(data);

results[0].getKey() === undefined
```


## Parameters

| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
