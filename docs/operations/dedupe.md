
# dedupe #

Used to dedupe an array of records or an array of [DataWindow](../entity/data-window.md).

`NOTE`: Be careful as the window can grow rather large if this is not flushed which only happens when there are slices with zero records.


| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| field | field to dedup records on | String | optional, defaults to metadata value set at '_key' |
| adjust_time | Requires and array of objects with field and preference properties, it will keep track of date values. Preference should be oldest of newest. | Object[] | optional, defaults to [] |


## Usage

```typescript

const config = {
    _op: 'dedupe',
    field: 'name'
}

const data = [
    { id: 1, name: 'roy' },
    { id: 2, name: 'roy' },
    { id: 2, name: 'bob' },
    { id: 2, name: 'roy' },
    { id: 3, name: 'bob' },
    { id: 3, name: 'mel' }
]

const expectedResults = [
    { id: 1, name: 'roy' },
    { id: 2, name: 'bob' },
    { id: 3, name: 'mel' }
]

// -----------------

 const opConfig = {
    _op: 'dedupe',
    field: 'name',
    adjust_time: [
        { field: 'first_seen', preference: 'oldest' },
        { field: 'last_seen', preference: 'newest' }
    ]
};

const data = [
    { id: 1, [field]: 'roy', first_seen: '2019-05-07T20:01:00.000Z', last_seen: '2019-05-07T20:01:00.000Z' },
    { id: 1, [field]: 'roy', first_seen: '2019-05-07T20:02:00.000Z', last_seen: '2019-05-07T20:02:00.000Z' },
    { id: 1, [field]: 'roy', first_seen: '2019-05-07T20:04:00.000Z', last_seen: '2019-05-07T20:04:00.000Z' },
    { id: 2, [field]: 'bob', first_seen: '2019-05-07T20:02:00.000Z', last_seen: '2019-05-07T20:02:00.000Z' },
    { id: 1, [field]: 'roy', first_seen: '2019-05-07T20:10:00.000Z', last_seen: '2019-05-07T20:10:00.000Z' },
    { id: 2, [field]: 'bob', first_seen: '2019-05-07T20:04:00.000Z', last_seen: '2019-05-07T20:04:00.000Z' },
    { id: 3, [field]: 'mel', first_seen: '2019-05-07T20:04:00.000Z', last_seen: '2019-05-07T20:04:00.000Z' },
    { id: 1, [field]: 'roy', first_seen: '2019-05-07T19:02:00.000Z', last_seen: '2019-05-07T19:02:00.000Z' },
    { id: 1, [field]: 'roy', first_seen: '2019-05-07T20:08:00.000Z', last_seen: '2019-05-07T20:08:00.000Z' },
    { id: 2, [field]: 'bob', first_seen: '2019-05-07T20:08:00.000Z', last_seen: '2019-05-07T20:08:00.000Z' },
    { id: 3, [field]: 'mel', first_seen: '2019-05-07T20:01:00.000Z', last_seen: '2019-05-07T20:01:00.000Z' },
];

const expectedResults = [
    { id: 1, [field]: 'roy', first_seen: '2019-05-07T19:02:00.000Z', last_seen: '2019-05-07T20:10:00.000Z' },
    { id: 2, [field]: 'bob', first_seen: '2019-05-07T20:02:00.000Z', last_seen: '2019-05-07T20:08:00.000Z' },
    { id: 3, [field]: 'mel', first_seen: '2019-05-07T20:01:00.000Z', last_seen: '2019-05-07T20:04:00.000Z' }
]
```

## Example Job

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
            "_op": "test-reader",
        },
        {
             "_op": "dedupe",
        }
    ],
}

```
