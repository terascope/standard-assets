# sample_exact

given an array of JSON documents will return an array containing a shuffled subset of those input documents.  The size of the subset will be the percentage multiplied against the length of the array rounded down.

## Usage

### Reduce and shuffle the returned array

Example of a job using the `sample_exact` processor

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
            "_op": "sample_exact",
            "percent_kept": "50",
        }
    ]
}

```

Example of the data and the expected results

```javascript
const data = [
    DataEntity.make({ name: 'lilly', otherField: 1 }),
    DataEntity.make({ name: 'willy', otherField: 2 }),
    DataEntity.make({ name: 'billy', otherField: 3 }),
    DataEntity.make({ name: 'dilly', otherField: 4 }),
]

const results = await processor.run(data);

results === [
    { name: 'dilly', name_again: 'dilly', otherField: 4  },
    { name: 'willy', name_again: 'willy', otherField: 2  },
]
```

## Parameters

| Configuration | Description                                                   | Type   | Notes                        |
| ------------- | ------------------------------------------------------------- | ------ | ---------------------------- |
| _op           | Name of operation, it must reflect the exact name of the file | String | required |
| percent_kept   | The percentage of documents to be kept from the input. Must be between 0 and 100 | Number | required, defaults to 100 |
