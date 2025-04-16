# debug_routes

The `debug_routes` processor helps with debugging and inspecting a slice to see how many records belong to a given route as marked in the metadata key 'standard:route' in [DataEntity](https://terascope.github.io/teraslice/docs/packages/utils/api/classes/dataentity) or [DataWindow](../entity/data-window.md). The key 'standard:route' is used by the routed_sender processor.

## Usage

### Log the number of unique routes to stdout

Example of a job using the `debug_routes` processor

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
            "_op": "debug_routes",
        }
    ]
}

```

Example of the data and the expected results

```javascript
const data = [
    DataEntity.make({ id: 1 }, { _key: '1' , 'standard:route': 'a' }),
    DataEntity.make({ id: 2 }, { _key: '2' , 'standard:route': 'b' }),
    DataEntity.make({ id: 3 }, { _key: '3' , 'standard:route': 'a' }),
    DataEntity.make({ id: 4 }, { _key: '4' , 'standard:route': 'c' }),
    DataEntity.make({ id: 5 }, { _key: '5' , 'standard:route': 'a' }),
    DataEntity.make({ id: 6 }, { _key: '6' , 'standard:route': 'b' }),
]

const results = await processor.run(data);
/* logs to stdout
* "{ a: 3, b: 2, c: 1 }\n"
*/
results === data;
```

## Parameters

| Configuration | Description                                                   | Type   | Notes                        |
| ------------- | ------------------------------------------------------------- | ------ | ---------------------------- |
| _op           | Name of operation, it must reflect the exact name of the file | String | required |
