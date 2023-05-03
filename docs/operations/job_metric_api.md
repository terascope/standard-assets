# Job Metric API

> Teraslice processor to export job metrics

## Parameters

|  Configuration   | Description                                |  Type   | Default  | Notes     |
|------------------|--------------------------------------------|---------|----------|-----------|
| _op              | Name of operation                          | String  | n/a      | required  |
| port             | Port used by exporter                      | Number  | 3333     |           |
| default_metrics  | include prom-client default node metrics   | Boolean | True     |           |

## Usage

### Setup metric api and metric, add to `initialize()`

Naming conventions for metrics <https://prometheus.io/docs/practices/naming/>

Create variable with the op name

```javascript
this.opName = 'mt_example'
```

Call the createAPI function

```javascript
this.metrics = await this.createAPI(this.opConfig.metric_api_name);
```

Note: To make the metrics collection optional add a `collect_metrics` variable to the processor schema, so you could do this:

```javascript
if (this.opConfig.collect_metrics) {
   this.metrics = await this.createAPI(this.opConfig.metric_api_name);
}
```

Create `gauge` metric called `mt_example_cache_hits_misses_total`

```javascript
if (! await this.metrics.addMetric(`${this.opName}_cache_hits_total`) {
  await this.metrics.addMetric(`${this.opName}_cache_hits_total`, `${this.opName} state storage cache hits`, ['op_name'], 'gauge');
}
```

### Set Metric Value

To set a metric to a specific value

```javascript
this.metrics.set(`${this.opName}_cache_hits`, [this.opName], 10);
```

### Increment/Decrement Metric

```javascript
// increment by 1
this.metrics.inc(`${this.opName}_cache_hits_total`, [this.opName]);
// increment by 10
this.metrics.inc(`${this.opName}_cache_hits_total`, [this.opName], 10);
// decrement by 1
this.metrics.dec(`${this.opName}_cache_hits_total`, [this.opName]);
// decrement by 10
this.metrics.dec(`${this.opName}_cache_hits_total`, [this.opName], 10);
```

### Job Example

```json
{
    "name": "metric-usage-example",
    "assets": [
        "standard:0.21.0",
        "mt_example",
    ],
    "apis": [
        {
            "_name": "job_metric_api",
        }
    ],
    "external_ports": [
        {
            "name": "metrics",
            "port": 3333
        }
    ],
    "labels": {
        "scrape-target": "true"
    },
    "lifecycle": "once",
    "workers": 1,
    "operations": [
        {
            "_op": "mt_example",
            "metric_api_name": "job_metric_api"
        },
        {
            "_op": "noop"
        }
    ]
}
```
