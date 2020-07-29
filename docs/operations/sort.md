
# sort #

Used sort the data by a given field that has numbers or strings as values. This will sort Objects, DataEntites or [DataWindow](../entity/data-window.md) which is a special data-entity that encloses an array of data-entities.



| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| field | The field in the input records to use for sorting | String | required |
| order | The order in which it will be sorted (`asc` or `desc`) | String | optional, defaults to `asc` |


## Usage

```javascript

// sort by number
const opConfig = {
    _op: 'sort',
    field: 'id'
};

const dateData = [
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

// returns data, but _key is removed

const results = processor.run(data);

resuts === [
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


// sort by string
const opConfig = {
    _op: 'sort',
    field: 'date'
};

// returns data, but _key is removed

const results = processor.run(data);

resuts === [
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


// sort by number, desc on data-windows
const opConfig = {
    _op: 'sort',
    field: 'id',
    order: 'desc'
};

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

const results = processor.run(data);

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
            "_op": "sort",
            "field": "someField"
        }
    ],
}

```
