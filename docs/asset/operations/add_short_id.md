# add_short_id

The `add_short_id` processor adds a unique short id to a [DataEntity](https://terascope.github.io/teraslice/docs/packages/utils/api/entities/data-entity/classes/dataentity) or [DataWindow](../entity/data-window.md).  Useful for when a UUID is overkill.

## Usage

### Add a unique id to a record

Example of a job using the `add_short_id` processor

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
            "_op": "add_short_id",
            "field": "short_id",
            "dictionary": "alphanum",
            "length": 8
        }
    ]
}
```

Here is a representation of what the processor will do with the configuration listed in the job above

```javascript
const data = [
    DataEntity.make({ name: 'chilly' }),
]

const results = await processor.run(data);

results = [{ name: 'chilly', short_id: 'de12Ed98' }]
```

## Parameters

| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| name | Name of field that will store unique id value | string | required |
| length | Length of id | number | defaults to 6 |
| dictionary | Types of characters to use in the string | one of  'number', 'alpha', 'alpha_lower', 'alpha_upper', 'alphanum', 'alphanum_lower', 'alphanum_upper', 'hex' | defaults to 'alphanum' |
