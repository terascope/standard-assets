# json_parser

The `json_parser` processor attempts to transform the buffer data to json
   Uses the _dead_letter_queue options to handle parsing errors which are none (ignore), log, throw or sends bad docs to a kafka topic specified in the api property of the job.
   see <https://terascope.github.io/teraslice/docs/jobs/dead-letter-queue#docsNav>
   and <https://github.com/terascope/kafka-assets/blob/master/docs/apis/kafka_dead_letter.md> for dead letter queue details

## Usage

### JSON Parse raw records

Example of a job using the `json_parser` processor

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
            "_op": "json_parser",
            "source": "name",
            "destination": "name_again"
        }
    ]
}

```

Example of the data and the expected results

```javascript
const data = [
    DataEntity.make({}, { _key: '1' }),
    DataEntity.make({}, { _key: '2' }),
    DataEntity.make({}, { _key: '3' }),
];

data[0].setRawData(Buffer.from(JSON.stringify({ id: 1 }), 'utf-8'));
data[1].setRawData(Buffer.from(JSON.stringify({ id: 2 }), 'utf-8'));
data[2].setRawData(Buffer.from(JSON.stringify({ id: 3 }), 'utf-8'));

const results = await processor.run(data);
[
    DataEntity.make({ id: 1 });
    DataEntity.make({ id: 2 });
    DataEntity.make({ id: 3 });
]
```

## Parameters

| Configuration | Description                                                   | Type   | Notes                        |
| ------------- | ------------------------------------------------------------- | ------ | ---------------------------- |
| _op           | Name of operation, it must reflect the exact name of the file | String | required |
| _dead_letter_action | action to take if a doc can not be transformed to JSON; accepts none, throw, log, or an api name | String | required, defaults to 'log' |
