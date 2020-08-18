
# group_by #

This processor can be used to group records by a `field` or the `_key` metadata if no field is specified.

It will return an array of [DataWindow](../entity/data-window.md) which is a special data-entity that encloses an array of data-entities.

For this processor to work, the field values needs to be set or the `_key` metadata value of the records must be set.

## Usage

### Grouping data based off of fields
Here is an example of returning DataWindows by their `name` field

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
            "_op": "group_by",
            "field": "name"
        }
    ]
}
```

Here is a representation of what the processor will do with the configuration listed in the job above

```javascript
const data = const data = [
    { id: 1, name: 'roy' },
    { id: 2, name: 'roy' },
    { id: 2, name: 'bob' },
    { id: 2, name: 'roy' },
    { id: 3, name: 'bob' },
    { id: 3, name: 'mel' }
]

const results = await processor.run(data)
results === [
    { dataArray: [{ id: 1, name: 'roy' }, { id: 2, name: 'roy' }, { id: 2, name: 'roy' }] },
    { dataArray: [{ id: 2, name: 'bob' }, { id: 3, name: 'bob' }] },
    { dataArray: [{ id: 3, name: 'mel' }] }
]

```

### Grouping data based off of their _key value
By omitting the `field` parameter, we can group by the `_key` metadata value

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
            "_op": "group_by"
        }
    ]
}
```

Here is a representation of what the processor will do with the configuration listed in the job above

```javascript
const data = [
    DataEntity.make({ name: 'chilly' }, { _key: 1 }),
    DataEntity.make({ name: 'billy' }, { _key: 2 }),
    DataEntity.make({ name: 'willy' }, { _key: 1 }),
    DataEntity.make({ name: 'dilly' }, { _key: 3 }),
]

const expectedDataWindows =

const results = await processor.run(data)

results === [
    { dataArray: [{ name: 'chilly' }, { name: 'willy' }] },
    { dataArray: [{ name: 'billy' }] },
    { dataArray: [{ name: 'dilly' }] }
]
```

## Parameters
| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| field | field to group records on | String | optional, defaults to metadata value set at '_key' |
