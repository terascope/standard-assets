# sample_random

Given an array of JSON documents, will return an array containing a subset of those input documents.  It iterates through the array and generates a random number between 1 and 100 for each record, and if the number `<=` probability it is kept. Must be between 0 and 100, with 100 keeping all records and 0 rejecting all records.

## Usage

### Reduce the returned array

Example of a job using the `sample_random` processor

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
            "_op": "sample_random",
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
    { name: 'lilly', otherField: 1 },
    { name: 'billy', otherField: 3 },
]
```

## Parameters

| Configuration | Description                                                   | Type   | Notes                        |
| ------------- | ------------------------------------------------------------- | ------ | ---------------------------- |
| _op           | Name of operation, it must reflect the exact name of the file | String | required |
| probability_to_keep   | The probability of the record being kept. It iterates through the array and generates a random number between 1 and 100, and if the number `<=` probability it is kept. Must be between 0 and 100, with 100 keeping all records and 0 rejecting all records | Number, defaults to 100 | required |
