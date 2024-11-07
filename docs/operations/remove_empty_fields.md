# remove_empty_fields

The `remove_empty_fields` processor removes any fields that are considered empty, stings filled with whitespace are considered empty as well.

## Usage

### Remove empty fields

Example of a job using the `remove_empty_fields` processor

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
            "_op": "remove_empty_fields"
        }
    ]
}

```
Example of the data and the expected results

```javascript
const data = [
    DataEntity.make({
        id: 1,
        name: 'joe',
        age: 102.875
    }),
    DataEntity.make({
        id: 2,
        name: '',
        age: 23,
        happy: true,
        field: [],
        field2: {},
        field3: undefined,
        field4: null,
        field5: 'UNDEFINED'
    }),
    DataEntity.make({
        id: 3,
        name: 'bob',
        age: '',
        happy: false,
        field7: ['thing1', 'thing2'],
        field8: { foo: 'bar' }
    }),
    DataEntity.make({
        id: 4,
        name: '         ',
        age: '',
        size: ''
    }),
]

const results = await processor.run(data);

[
    DataEntity.make({
        id: 1,
        name: 'joe',
        age: 102.875
    }),
    DataEntity.make({
        id: 2,
        age: 23,
        happy: true,
        field5: 'UNDEFINED'
    }),
    DataEntity.make({
        id: 3,
        name: 'bob',
        happy: false,
        field7: ['thing1', 'thing2'],
        field8: { foo: 'bar' }
    }),
    DataEntity.make({
        id: 4,
    }),
]
```

## Parameters

| Configuration | Description                                                   | Type   | Notes                        |
| ------------- | ------------------------------------------------------------- | ------ | ---------------------------- |
| _op           | Name of operation, it must reflect the exact name of the file | String | required |
