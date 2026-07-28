# create_geopoint

The `create_geopoint` processor builds a geo-point object (`{ lat, lon }`) from a latitude and a longitude field on any [DataEntity](https://terascope.github.io/teraslice/docs/packages/utils/api/entities/data-entity/classes/dataentity) or [DataWindow](../entity/data-window.md). The source values are normalized with data-mate's `parseGeoPoint`, so any accepted lat/lon form (numbers or numeric strings) is converted to the `{ lat, lon }` object.

## Usage

### Build a geo-point from a latitude and longitude field

Example of a job using the `create_geopoint` processor

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
            "_op": "create_geopoint",
            "lat_field": "latitude",
            "lon_field": "longitude"
        }
    ]
}

```

Here is a representation of what the processor will do with the configuration listed in the job above

```javascript
const data = [
    DataEntity.make({ latitude: 17.1333, longitude: -61.7833, otherField: 1 }),
    DataEntity.make({ latitude: 'nope', longitude: 'nope', otherField: 2 }),
]

const results = await processor.run(data);

results = [
    { location: { lat: 17.1333, lon: -61.7833 }, otherField: 1 },
    { otherField: 2 },
]
```

When a geo-point cannot be built (a source field is missing or the value is invalid), the `destination_field` is left unset. The source fields are still removed when `delete_source` is `true`, as shown by the second record above.

## Parameters

| Configuration | Description                                                   | Type   | Notes                        |
| ------------- | ------------------------------------------------------------- | ------ | ---------------------------- |
| _op           | Name of operation, it must reflect the exact name of the file | String | required |
| lat_field     | Name of the field containing the latitude value | String | required, no default |
| lon_field     | Name of the field containing the longitude value | String | required, no default |
| destination_field | Name of the field the geo-point object (`{ lat, lon }`) is written to | String | optional, defaults to `location` |
| delete_source | Delete the `lat_field` and `lon_field`, whether or not a geo-point could be built | Boolean | optional, defaults to `true` |
