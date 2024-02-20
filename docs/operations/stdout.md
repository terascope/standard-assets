# stdout

This is primarily used for develop purposes, it console logs the incoming data, it's meant to inspect in between operations or end of outputs.

## Usage

### Log results
Example of a job using the `stdout` processor

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
             "_op": "stdout"
        }
    ]
}
```

## Parameters

| Configuration |Description                                                                                                       | Type     | Notes    |
| ------------- | ----------------------------------------------------------------------------------------------------------------- | -------- | -------- |
| `limit`       | Specify a number > 0 to limit the number of results printed to the console log.  Default is to print all results. | `Number` | optional |

Example configuration

```json
{
    "_op": "stdout",
    "limit": 125
}
```
