# sort

This is a helper processor that is used sort the data by a given field that has numbers or strings as values. This will sort Objects, DataEntities or [DataWindows](../entity/data-window.md).

For this processor to work, the fields specified should have non-nullable defined values that you are sorting

## Usage

### Simple number sorting
This is an example of a simple sort on number values

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
            "_op": "sort",
            "field": "id"
        }
    ]
}

```

Here is a representation of what the processor will do with the configuration listed in the job above

```javascript

const data = [
    {
        id: 2,
        date: '2019-05-03T20:02:00.000Z'
    },
    {
        id: 1,
        date: '2019-05-03T20:01:00.000Z'
    },
    {
        id: 4,
        date: '2019-05-03T20:01:00.000Z'
    },
    {
        id: 3,
        date: '2019-05-03T20:03:00.000Z'
    }
];

const results = await processor.run(data);

results === [
    {
        id: 1,
        date: '2019-05-03T20:01:00.000Z'
    },
    {
        id: 2,
        date: '2019-05-03T20:02:00.000Z'
    },
    {
        id: 3,
        date: '2019-05-03T20:03:00.000Z'
    },
    {
        id: 4,
        date: '2019-05-03T20:01:00.000Z'
    }
]
```

### Simple date sorting
This is an example of a simple sort on date values

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
            "_op": "sort",
            "field": "date"
        }
    ]
}

```

Here is a representation of what the processor will do with the configuration listed in the job above

```javascript

const data = [
    {
        id: 2,
        date: '2019-05-03T20:02:00.000Z'
    },
    {
        id: 1,
        date: '2019-05-03T20:01:00.000Z'
    },
    {
        id: 4,
        date: '2019-05-03T20:01:00.000Z'
    },
    {
        id: 3,
        date: '2019-05-03T20:03:00.000Z'
    }
];

const results = await processor.run(data);

results === [
    {
        id: 1,
        date: '2019-05-03T20:01:00.000Z'
    },
    {
        id: 4,
        date: '2019-05-03T20:01:00.000Z'
    },
    {
        id: 2,
        date: '2019-05-03T20:02:00.000Z'
    },
    {
        id: 3,
        date: '2019-05-03T20:03:00.000Z'
    }
]
```

### Sort DataWindows by descending values
This is an example of a sorting DataWindows by desc

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
            "_op": "sort",
            "field": "id",
            "order": "desc"
        }
    ]
}
```

Here is a representation of what the processor will do with the configuration listed in the job above

```javascript

const data = [
    {
        dataArray: [
            { id: 12 },
            { id: 2 },
            { id: 245 }
        ]
    },
    {
        dataArray: [
            { id: 143 },
            { id: 66321 },
            { id: 83872 }
        ]
    }
]

const results = await processor.run(data);

results === [
    {
        dataArray: [
            { id: 245 },
            { id: 12 },
            { id: 2 },
        ]
    },
    {
        dataArray: [
            { id: 83872 },
            { id: 66321 },
            { id: 143 },
        ]
    }
]
```

## Parameters

| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| field | The field in the input records to use for sorting | String | required |
| order | The order in which it will be sorted (`asc` or `desc`) | String | optional, defaults to `asc` |
