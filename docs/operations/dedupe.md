# dedupe

This is helper processor that is used to dedupe an array of records or an array of [DataWindow](../entity/data-window.md) by a given field.

If no field is configured then it will attempt to dedupe based off the `_key` metadata property.

This dedupe processor can also keep track of dates that it is deduping so that the resulting record has either the `oldest` or `newest` date for the field based on how you configure the `adjust_time` parameter.

For this processor to work, the `field` value needs to be set or the `_key` metadata value of the records must be set.

## Usage

### Dedupe records based on a set field
This is an example of deduping records based off a given field

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
             "_op": "dedupe",
             "field": "name"
        }
    ]
}
```

Here is a representation of what the processor will do with the configuration listed in the job above

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
This is an example of deduping records based off the `_key` metadata

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
             "_op": "dedupe"
        }
    ]
}
```

Here is a representation of what the processor will do with the configuration listed in the job above

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


### Dedupe records based on the _key metadata
This is an example of deduping records based off the name field, and will also keep track of the `oldest` date of the `first_seen` field and keep track of the `newest` date of the `last_seen` field and return them on the final deduped record.

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

Here is a representation of what the processor will do with the configuration listed in the job above

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
| field | field to dedupe records on | String | optional, defaults to metadata value set at '_key' |
| adjust_time | Requires an array of objects with `field` and `preference` properties, it will keep track of date values. Preference should be set to `oldest` or `newest`. | Object[] | optional, defaults to [] |
