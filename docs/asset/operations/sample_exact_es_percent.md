# sample_exact_es_percent

Given an array of JSON documents, this processor will return an array containing a shuffled subset of those input documents. The size of the subset will be determined by the `percentage` value stored in an Elasticsearch record multiplied against the length of the array rounded down. The `percentage` will be retrieved every `window_ms` milliseconds by getting the document with `document_id` found within the `index` in the Elasticsearch specified by the `connection` as specified in the config.

## Usage

In this example we want to retrieve the percentage from the document with _id `abc123` in index `my-index` at the terafoundation connection named `elasticsearch7`.

### Example of a job using the `sample_exact_es_percent` processor

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

### Example sample index creation

Create an index with 1 shard, 2 replicas, and a single text property called `percent`.

```sh
curl -X PUT "http://localhost:9200/my-index" -H 'Content-Type: application/json' -d'
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 2
  },
  "mappings": {
    "properties": {
      "percent": {
        "type": "text"
      }
    }
  }
}'
```

### Example document creation

```sh
curl -X POST 'localhost:9200/my-index/_doc/abc123' -H 'Content-Type:application/json' -d '
{
  "percent": 50
}
'
```

### Review the document

```sh
curl -X GET 'localhost:9200/my-index/_doc/abc123' | jq
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

### Example of the data and the expected results

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
