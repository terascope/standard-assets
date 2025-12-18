# count_by_field

> Teraslice processor to count a field using prometheus metrics.

## Parameters

|  Configuration   | Description                 |  Type   | Default          | Notes     |
|------------------|-----------------------------|---------|------------------|-----------|
| _op              | Name of operation           | String  | n/a              | required  |
| collect_metrics  | enable metric collection    | Boolean | false            |           |
| field            | Field to count              | String  | null             | required  |

## Usage

### Count Field in records based on a set field

This is an example of counting a field in a record based off a given field

#### Example Job

```json
{
    "name": "metric-count-by-field-example",
    "lifecycle": "persistent",
    "workers": 30,
    "slicers": 1,
    "assets": [
        "standard:0.21.0",
        "kafka:3.2.4"
    ],
    "prom_metrics_enabled": true,
    "prom_metrics_port": 3333,
    "prom_metrics_add_default": false,
    "external_ports": [
        {
            "name": "metrics",
            "port": 3333
        }
    ],
    "labels": {
        "scrape-target": "true"
    },
    "apis": [
        {
            "name": "kafka_reader_api",
            "topic": "test_topic_1",
            "connection": "kafka_test1",
            "group": "temp#metric-count-field-r1",
            "size": 50000,
            "wait": 5000
        }
    ],
    "operations": [
        {
            "_op": "kafka_reader",
            "_api_name": "kafka_reader_api"
        },
        {
            "_op": "count_by_field",
            "field": "test_id",
            "collect_metrics": true
        },
        {
            "_op": "noop"
        }
    ]
}
```

**NOTE:** `prom_metrics_enabled` must be set to true, either in the job or in the `terafoundation` config, for the metrics to be exported.

### Example Metrics

`curl` /metrics end point to view metrics

```bash
curl -sS  127.0.0.1:3333/metrics
# HELP teraslice_job_count_by_field_count_total count_by_field field: test_id count
# TYPE teraslice_job_count_by_field_count_total counter
teraslice_job_count_by_field_count_total{test_id="1200",field="test_id",op_name="count_by_field",ex_id="a9999999-aaaa-9999-aaaa-99999999990",job_id="b9999999-bbbb-9999-bbbb-9999999999",job_name="metric-count-by-field-example",name="teraslice-test1",pod_name="ts-wkr-metric-count-by-field-example-bbbb"} 5002
teraslice_job_count_by_field_count_total{test_id="1201",field="test_id",op_name="count_by_field",ex_id="a9999999-aaaa-9999-aaaa-99999999990",job_id="b9999999-bbbb-9999-bbbb-9999999999",job_name="metric-count-by-field-example",name="teraslice-test1",pod_name="ts-wkr-metric-count-by-field-example-bbbb"} 5200
teraslice_job_count_by_field_count_total{test_id="1202",field="test_id",op_name="count_by_field",ex_id="a9999999-aaaa-9999-aaaa-99999999990",job_id="b9999999-bbbb-9999-bbbb-9999999999",job_name="metric-count-by-field-example",name="teraslice-test1",pod_name="ts-wkr-metric-count-by-field-example-bbbb"} 4896
teraslice_job_count_by_field_count_total{test_id="1203",field="test_id",op_name="count_by_field",ex_id="a9999999-aaaa-9999-aaaa-99999999990",job_id="b9999999-bbbb-9999-bbbb-9999999999",job_name="metric-count-by-field-example",name="teraslice-test1",pod_name="ts-wkr-metric-count-by-field-example-bbbb"} 5103
```
