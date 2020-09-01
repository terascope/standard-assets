# remove_key

This is a helper processor to remove the `_key` metadata value for any [DataEntity](https://terascope.github.io/teraslice/docs/packages/utils/api/classes/dataentity) or [DataWindow](../entity/data-window.md).


## Usage

### Remove the _key of records
Here is an example of using this processor to remove the `_key` metadata value

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
            "_op": "remove_key"
        }
    ]
}
```

Here is a representation of what the processor will do with the configuration listed in the job above

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
