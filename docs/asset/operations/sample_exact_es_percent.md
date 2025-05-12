# sample_exact_es_percent

Given an array of JSON documents will return an array containing a shuffled subset of those input documents. The size of the subset will be the percentage stored in an elasticsearch record multiplied against the length of the array rounded down. Percentage will be recalculated every `window_ms` milliseconds by querying the elasticsearch located at `connection` for the document with `document_id` found within the `index` specified in the config.

## Usage

### Reduce and shuffle the returned array

Example of a job using the `sample_exact_es_percent` processor

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
            "_op": "sample_exact_es_percent",
            "connection": "elasticsearch7",
            "index": "my-index",
            "document_id": "abc123",
            "window_ms": 300000
        }
    ]
}

```

Example of the document

```sh
curl localhost:9200/my-index/_doc/abc123 | jq
{
  "_index": "my-index",
  "_id": "abc123",
  "_version": 1,
  "_seq_no": 0,
  "_primary_term": 1,
  "found": true,
  "_source": {
    "percent": 50
  }
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
| connection    | Name of the elasticsearch connection to use to find index size | String | defaults to `default` |
| index         | Name of the index that holds the percentage document | String | required |
| document_id   | `_id` of the document holding the percentage of docs to keep | String | required |
| window_ms     | The time in milliseconds between queries to elasticsearch. Must be between 100 and 3_600_000 (1 hour) | Number | defaults to 300_000ms (5 minutes) | 
