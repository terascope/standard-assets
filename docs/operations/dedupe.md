# dedupe

The `dedupe` processor is used to dedupe an array of [DataEntities](https://terascope.github.io/teraslice/docs/packages/utils/api/classes/dataentity) or an array of [DataWindows](../entity/data-window.md) by a given field.  If no field is configured then it will attempt to dedupe based off the `_key` metadata property.  This processor can also track dates of duplicate records so that the resulting unique record has either the `oldest` or `newest` date for the date field based on the `adjust_time` parameter. 

## Usage

### Dedupe records based on a field

Example of a job using the `dedupe` processor
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
             "_op": "dedupe",
             "field": "name"
        }
    ]
}
```

Output from example job

```javascript
const data = [
    { id: 1, name: 'roy' },
    { id: 2, name: 'roy' },
    { id: 2, name: 'bob' },
    { id: 2, name: 'roy' },
    { id: 3, name: 'bob' },
    { id: 3, name: 'mel' }
]

const results = await processor.run(data);

results === [
    { id: 1, name: 'roy' },
    { id: 2, name: 'bob' },
    { id: 3, name: 'mel' }
];
```

### Dedupe records based on the _key metadata

Example of a job using the `_key` in the metadata
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
             "_op": "dedupe"
        }
    ]
}
```

Output from example job

```javascript
const data = [
    DataEntity.make({ id: 1, name: 'roy' }, { _key: 1 }),
    DataEntity.make({ id: 2, name: 'roy' }, { _key: 2 }),
    DataEntity.make({ id: 2, name: 'bob' }, { _key: 2 }),
    DataEntity.make({ id: 2, name: 'roy' }, { _key: 2 }),
    DataEntity.make({ id: 3, name: 'bob' }, { _key: 3 }),
    DataEntity.make({ id: 3, name: 'mel' }, { _key: 3 }),
];

const results = await processor.run(data);

results === [
    { id: 1, name: 'roy' },
    { id: 2, name: 'roy' },
    { id: 3, name: 'bob' }
];
```


### Dedupe records and track time

Example of a job using the `dedupe` processor and tracking the `oldest` date of the `first_seen` field as well as the `newest` date of the `last_seen` field.
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
            "_op": "dedupe",
            "field": "name",
            "adjust_time": [
                { "field": "first_seen", "preference": "oldest" },
                { "field": "last_seen", "preference": "newest" }
            ]
        }
    ]
}
```

Output of example job

```javascript
const data = [
    {
        id: 1,
        name: 'roy',
        first_seen: '2019-05-07T20:01:00.000Z',
        last_seen: '2019-05-07T20:01:00.000Z'
    },
    {
        id: 1,
        name: 'roy',
        first_seen: '2019-05-07T20:02:00.000Z',
        last_seen: '2019-05-07T20:02:00.000Z'
    },
    {
        id: 1,
        name: 'roy',
        first_seen: '2019-05-07T20:04:00.000Z',
        last_seen: '2019-05-07T20:04:00.000Z'
    },
    {
        id: 2,
        name: 'bob',
        first_seen: '2019-05-07T20:02:00.000Z',
        last_seen: '2019-05-07T20:02:00.000Z'
    },
    {
        id: 1,
        name: 'roy',
        first_seen: '2019-05-07T20:10:00.000Z',
        last_seen: '2019-05-07T20:10:00.000Z'
    },
    {
        id: 2,
        name: 'bob',
        first_seen: '2019-05-07T20:04:00.000Z',
        last_seen: '2019-05-07T20:04:00.000Z'
    },
    {
        id: 3,
        name: 'mel',
        first_seen: '2019-05-07T20:04:00.000Z',
        last_seen: '2019-05-07T20:04:00.000Z'
        },
    {
        id: 1,
        name: 'roy',
        first_seen: '2019-05-07T19:02:00.000Z',
        last_seen: '2019-05-07T19:02:00.000Z'
    },
    {
        id: 1,
        name: 'roy',
        first_seen: '2019-05-07T20:08:00.000Z',
        last_seen: '2019-05-07T20:08:00.000Z'
    },
    {
        id: 2,
        name: 'bob',
        first_seen: '2019-05-07T20:08:00.000Z',
        last_seen: '2019-05-07T20:08:00.000Z'
    },
    {
        id: 3,
        name: 'mel',
        first_seen: '2019-05-07T20:01:00.000Z',
        last_seen: '2019-05-07T20:01:00.000Z'
    }
];

const results = await processor.run(data);

results === [
    {
        id: 1,
        name: 'roy',
        first_seen: '2019-05-07T19:02:00.000Z',
        last_seen: '2019-05-07T20:10:00.000Z'
    },
    {
        id: 2,
        name: 'bob',
        first_seen: '2019-05-07T20:02:00.000Z',
        last_seen: '2019-05-07T20:08:00.000Z'
    },
    {
        id: 3,
        name: 'mel',
        first_seen: '2019-05-07T20:01:00.000Z',
        last_seen: '2019-05-07T20:04:00.000Z'
    }
]
```

## Parameters

| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| field | field to dedupe records on | String | optional, defaults to `_key` metadata value |
| adjust_time | Requires an array of objects with `field` and `preference` properties. Preference should be set to `oldest` or `newest`. | Array of Objects | optional, defaults to [] |
