# group_by

This processor groups records by a `field` or the `_key` metadata if no field is specified.  It returns an array of [DataWindows](../entity/data-window.md).  This processor requires either the field values or the `_key` metadata value to be set.

## Usage

### Grouping data based off of fields

Example of a job using the `group_by` processor that groups the records by the `name` field

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

Output of the example job

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

Example of a job using the `_key` metadata value

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

Output of the example job

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

| Configuration | Description                                                   | Type   | Notes                                              |
| ------------- | ------------------------------------------------------------- | ------ | -------------------------------------------------- |
| _op           | Name of operation, it must reflect the exact name of the file | String | required                                           |
| field         | field to group records on                                     | String | optional, defaults to `_key` metadata value |
