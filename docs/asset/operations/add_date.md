# add_date

The `add_date` processor adds the current time to the configured field for any [DataEntity](https://terascope.github.io/teraslice/docs/packages/utils/api/entities/data-entity/classes/dataentity) or [DataWindow](../entity/data-window.md).

The `format` option controls how the date is written — an ISO 8601 string by default, or epoch seconds/milliseconds as a number, or any [date-fns format string](https://date-fns.org/docs/format). See [Use a different date format](#use-a-different-date-format) for the full list.

The date is generated per record at the time the record is processed, so records in the same slice may have slightly different values.

## Usage

### Add an ISO 8601 processing timestamp to every record

Example of a job using the `add_date` processor

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
            "_op": "add_date",
            "field": "processed_at"
        }
    ]
}

```

Example of the data and the expected results

```javascript
const data = [
    DataEntity.make({ name: 'lilly', otherField: 1 }),
    DataEntity.make({ name: 'willy', otherField: 2  }),
]

const results = await processor.run(data);

DataEntity.make({ name: 'lilly', otherField: 1, processed_at: '2026-09-11T17:04:22.314Z' }),
DataEntity.make({ name: 'willy', otherField: 2, processed_at: '2026-09-11T17:04:22.314Z' }),
```

### Use a different date format

The `format` option accepts any of the following:

| `format` | Example output | Type |
| -------- | -------------- | ---- |
| `iso_8601` (default) | `2026-09-11T17:04:22.314Z` | String |
| `epoch_millis` | `1789664662314` | Number |
| `milliseconds` | `1789664662314` | Number |
| `epoch` | `1789664662` | Number |
| `seconds` | `1789664662` | Number |
| any [date-fns format string](https://date-fns.org/docs/format) | `2026-09-11` for `yyyy-MM-dd` | String |

```json
{
    "_op": "add_date",
    "field": "processed_at",
    "format": "epoch_millis"
}
```

#### date-fns formats and UTC

A date-fns format string renders in **UTC** by default, which matches the `iso_8601` and epoch formats:

```json
{
    "_op": "add_date",
    "field": "processed_at",
    "format": "yyyy-MM-dd HH:mm:ss"
}
```

For the instant `2026-09-11T02:30:00.000Z` this writes `"2026-09-11 02:30:00"` — the UTC wall clock, regardless of the worker's timezone.

Including an `x` or `X` timezone token switches the output to the worker's **local** time, with the offset rendered by the token:

```json
{
    "_op": "add_date",
    "field": "processed_at",
    "format": "yyyy-MM-dd'T'HH:mm:ss.SSSXXX"
}
```

On a worker in `America/Denver` the same instant writes `"2026-09-10T20:30:00.000-06:00"`. That is the same point in time, just expressed in local terms.

> **Note:** the local-time offset is read once when the worker process starts. A long-running worker in a timezone that observes daylight saving will keep using the offset that was in effect at startup, so `x`/`X` output can drift by an hour after a DST transition. Use the default UTC rendering, `iso_8601`, or an epoch format if that matters.

### Overwrite an existing field

By default a record that already has the field is left alone. Set `overwrite` to `true` to always stamp the field.

```json
{
    "_op": "add_date",
    "field": "processed_at",
    "overwrite": true
}
```

## Parameters

| Configuration | Description                                                   | Type   | Notes                        |
| ------------- | ------------------------------------------------------------- | ------ | ---------------------------- |
| _op           | Name of operation, it must reflect the exact name of the file | String | required |
| field         | Name of the field that the date is written to | String | required, no default |
| format        | Output format of the date, either a `DateFormat` or a date-fns format string | String | optional, defaults to `iso_8601` |
| overwrite     | Option to set the field even if it is already on the document | Boolean | optional, defaults to `false` |
