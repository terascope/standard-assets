# rename_field

The `rename_field` processor renames fields on a [DataEntity](https://terascope.github.io/teraslice/docs/packages/utils/api/entities/data-entity/classes/dataentity) or [DataWindow](../entity/data-window.md) according to an explicit `{ oldField: newField }` mapping. Each value is moved to its new field name and the original field is removed.

## Usage

### Rename fields on a document

Example of a job using the `rename_field` processor

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
            "_op": "rename_field",
            "mapping": {
                "STATION": "station",
                "LATITUDE": "latitude",
                "LONGITUDE": "longitude"
            }
        }
    ]
}

```

Output from example job

```javascript
const data = [
    DataEntity.make({ STATION: 'ACW00011647', LATITUDE: 17.1333, LONGITUDE: -61.7833, wind_speed: 0 }),
    DataEntity.make({ STATION: 'ACW00011648', LATITUDE: 40, LONGITUDE: 60, wind_speed: 1.5 }),
]

const results = await processor.run(data);

DataEntity.make({ station: 'ACW00011647', latitude: 17.1333, longitude: -61.7833, wind_speed: 0 }),
DataEntity.make({ station: 'ACW00011648', latitude: 40, longitude: 60, wind_speed: 1.5 }),
```

Fields listed in the mapping that are not present on a record are skipped, and a field mapped to its own name is left unchanged. Values are moved as-is, including falsy values such as `0`, `""`, or `false`.

## Parameters

| Configuration | Description                                                   | Type   | Notes                        |
| ------------- | ------------------------------------------------------------- | ------ | ---------------------------- |
| _op           | Name of operation, it must reflect the exact name of the file | String | required |
| mapping       | Object mapping an existing field name to the new field name it should be renamed to. The original field is removed | Object | required, no default |
