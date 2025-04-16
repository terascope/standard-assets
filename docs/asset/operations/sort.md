# sort

The `sort` processor sorts the data by a given field that has numbers, dates, or strings as values. This will sort [DataEntity](https://terascope.github.io/teraslice/docs/packages/utils/api/entities/data-entity/classes/dataentity) or [DataWindows](../entity/data-window.md).

## Usage

### Simple number sorting

Example of a job that uses the `sort` processor sorting on number values

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

Output of example job

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

Example of a job that uses the `sort` processor sorting on date values

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

Output of example job

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

Example of a job sorting on DataWindows by desc

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

Output of example job

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
