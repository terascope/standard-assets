# filter_by_required_fields

The `filter_by_required_fields` processor copies the source field value to a destination field for any [DataEntity](https://terascope.github.io/teraslice/docs/packages/utils/api/classes/dataentity) or [DataWindow](../entity/data-window.md).

## Usage

### Find Records that have all three fields with non-nullish values

Example of a job using the `filter_by_required_fields` processor

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
            "_op": "filter_by_required_fields",
            "required_fields": ["age", "name", "size"],
            "filter_type": "AND"
        }
    ]
}

```
Example of the data and the expected results

```javascript
 const data = [
    {
        age: 20,
        name: 'bob1',
        size: 10
    },
    {
        name: 'bob2',
        size: 11
    },
    {
        age: 21,
        size: 12
    },
    {
        age: 22,
        name: 'bob3',
    },
    {
        goop: true
    },
    {
        age: undefined,
        name: 'bob4',
        size: 13
    },
    {
        age: 23,
        name: 'NA',
        size: 14
    },
    {
        age: 24,
        name: 'bob5',
        size: ''
    },
    {
        age: 25,
        name: 'bob6',
        size: null
    },
    {
        age: 26,
        name: 'bob7',
        size: 15
    }
];

const results = await processor.run(data);

results === [
    { age: 20, name: 'bob1', size: 10 },
    { age: 26, name: 'bob7', size: 15 }
]
```

### Find Records that neither have

Example of a job using the `filter_by_required_fields` processor

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
            "_op": "filter_by_required_fields",
            "required_fields": ["age", "size"],
            "filter_type": "OR",
            "invert": true
        }
    ]
}

```
Example of the data and the expected results

```javascript
const data = [
    { age: 20, name: 'bob1', size: 10 },
    { name: 'bob2' },
    {
        age: 21,
        size: 12
    },
    {
        age: 22,
        name: 'bob3',
    },
    {
        goop: true,
        name: 'bob',
        date: 'sometime'
    },
    {
        age: 25,
        name: 'bob6',
        size: null
    },
    {
        age: null,
        name: 'bob7',
        size: null
    }
];

const results = await processor.run(data);

results === [
    { name: 'bob2' },
    { goop: true, name: 'bob', date: 'sometime' },
    { age: null, name: 'bob7', size: null }
]
```

## Parameters

| Configuration | Description                                                   | Type   | Notes                        |
| ------------- | ------------------------------------------------------------- | ------ | ---------------------------- |
| _op           | Name of operation, it must reflect the exact name of the file | String | required |
| required_fields | Array of fields that must be present and have a non-null value | required, no default |
| filter_type   | AND or OR, if AND then every field is required, if OR just one of the fields | required, defaults to AND |
| invert  | Set to True to Invert the selection and return records with required fields, defaults to `false` |
