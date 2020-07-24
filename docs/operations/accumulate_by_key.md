
# accumulate_by_key #

Used to gather and accumulate data from a stream, only to return results when a certain amount of slices generating zero results have been reached in which it will return an array of [DataWindow](../entity/data-window.md) with each data-window containing records that have the same `_key` metadata value.

`NOTE`: Be careful as the window can grow rather large if this is not flushed which only happens when there are slices with zero records.


| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| empty_after | How many 0 record slices to require before starting to return the accumulated data | Number | optional, defaults to 10 |
| flush_data_on_shutdown | Option to flush partial data accumulation on unexpected shutdown | Boolean | optional, defaults to false |
| key_field | Field to key docs by | String | optional, defaults to _key |
| batch_return | If true will return arrays of specified batch_size | Boolean | optional, defaults to false |
| batch_size | Size of batches to return | Number | optional, defaults to 1000 |



## Example Job

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
            "_op": "accumulate_by_key",
            "flush_data_on_shutdown": true,
            "empty_after": 10,
        },
        {
            "_op": "noop"
        }
    ],
}

```
