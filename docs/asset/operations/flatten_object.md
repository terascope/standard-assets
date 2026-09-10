# flatten_object

The `flatten_object` processor collapses nested objects into a single level of keys, joining the key of each level with a delimiter, for any [DataEntity](https://terascope.github.io/teraslice/docs/packages/utils/api/entities/data-entity/classes/dataentity) or [DataWindow](../entity/data-window.md).

By default the whole record is flattened. Set `field` to flatten only certain objects and leave the rest of the record nested.

By default arrays are not descended into, they are copied over as a value. Set `flatten_arrays` to break them apart too. An empty object or array has no leaves to flatten to, so it is always kept as a value.

## Options

| Configuration | Description | Default | Notes |
| --------- | -------- | ------ | ------ |
| field | Which fields to flatten. `"all"` (or `["all"]`) flattens the whole record, otherwise a dot notation path to the object to flatten, or an array of them | `all` | optional |
| delimiter | Separator used to join the keys of nested objects | `.` | optional |
| flatten_arrays | Descend into arrays as well as objects, using the index as a key segment | `false` | optional |
| max_depth | How many levels of nested objects to descend into. Objects below the limit are kept as a value. `0` means no limit | `0` | optional |
| missing_field_action | What to do when a listed field is not found on a record: `throw`, `log`, or `ignore`. Only applies when `field` is not `"all"` | `ignore` | optional |

Notes on `field`:

- A single field can be given as a bare string, several as an array.
- Paths always use dot notation, regardless of what `delimiter` is set to. `delimiter` only affects the keys that get written out.
- Only the object at the path is dissolved. Its keys are merged into its parent prefixed with the field's own name, so the parent stays nested.
- A `*` segment fans out across the elements of an array or the values of an object. `locations[].geo` and `locations[*].geo` are accepted as the same thing.
- A numeric segment targets one element, so `locations[0].geo` only touches the first.
- A path cannot end in a wildcard. There would be no parent to dissolve each match into, so the config is rejected.
- Fields are flattened in the order they are listed.
- A path that resolves to a value that is not an object is left alone. `missing_field_action` applies only when the path does not resolve at all, and with a wildcard it fires only when no match at all was found on the record.

## Usage

### Flatten every nested object in a record

Example of a job using the `flatten_object` processor

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
            "_op": "flatten_object"
        }
    ]
}

```

Example of the data and the expected results

```javascript
const data = [
    DataEntity.make({ name: 'lilly', location: { city: 'Portland', geo: { lat: 45.5, lon: -122.6 } } }),
    DataEntity.make({ name: 'willy', tags: ['a', 'b'], meta: {} }),
]

const results = await processor.run(data);
```

Results:

```json
{
    name: 'lilly',
    'location.city': 'Portland',
    'location.geo.lat': 45.5,
    'location.geo.lon': -122.6
}
{ name: 'willy', tags: ['a', 'b'], meta: {} }
```

### Flatten only certain fields

A field is reached with dot notation, so a nested object can be flattened while its parent stays an object.

```json
{
    "_op": "flatten_object",
    "field": "location.geo"
}
```

```javascript
const data = [
    DataEntity.make({ id: 1, location: { city: 'Portland', geo: { lat: 45.5, lon: -122.6 } } }),
]

const results = await processor.run(data);
```

Results:

```json
{
    id: 1,
    location: { city: 'Portland', 'geo.lat': 45.5, 'geo.lon': -122.6 }
}
```

Several fields are flattened independently of each other.

```json
{
    "_op": "flatten_object",
    "field": ["location.geo", "meta"]
}
```

```javascript
const data = [
    DataEntity.make({
        id: 1,
        location: { city: 'Portland', geo: { lat: 45.5 } },
        meta: { source: { name: 'x' } }
    }),
]

const results = await processor.run(data);
```

Results:

```json
{
    id: 1,
    location: { city: 'Portland', 'geo.lat': 45.5 },
    'meta.source.name': 'x'
}
```

### Flatten a field inside every element of an array

Use a `*` segment to fan out across an array. `locations[].geo` and `locations[*].geo` mean the same thing.

```json
{
    "_op": "flatten_object",
    "field": "locations.*.geo"
}
```

```javascript
const data = [
    DataEntity.make({
        id: 1,
        locations: [
            { city: 'Portland', geo: { lat: 45.5, lon: -122.6 } },
            { city: 'Seattle', geo: { lat: 47.6, lon: -122.3 } }
        ]
    }),
]

const results = await processor.run(data);
```

Results:

```json
{
    id: 1,
    locations: [
        { city: 'Portland', 'geo.lat': 45.5, 'geo.lon': -122.6 },
        { city: 'Seattle', 'geo.lat': 47.6, 'geo.lon': -122.3 }
    ]
}
```

Elements without the field are skipped. A wildcard also works over the values of an object, and a path may contain more than one.

To target a single element instead, use its index.

```json
{
    "_op": "flatten_object",
    "field": "locations[0].geo"
}
```

```javascript
const data = [
    DataEntity.make({
        locations: [
            { city: 'Portland', geo: { lat: 45.5 } },
            { city: 'Seattle', geo: { lat: 47.6 } }
        ]
    }),
]

const results = await processor.run(data);
```

Results:

```json
{
    locations: [
        { city: 'Portland', 'geo.lat': 45.5 },
        { city: 'Seattle', geo: { lat: 47.6 } }
    ]
}
```

### Flatten arrays as well as objects

With `flatten_arrays` on, an array is broken apart using each index as a key segment. This applies to the whole record or to a listed field.

```json
{
    "_op": "flatten_object",
    "flatten_arrays": true
}
```

```javascript
const data = [
    DataEntity.make({
        id: 1,
        locations: [
            { city: 'Portland', geo: { lat: 45.5 } },
            { city: 'Seattle', geo: { lat: 47.6 } }
        ]
    }),
]

const results = await processor.run(data);
```

Results:

```json
{
    id: 1,
    'locations.0.city': 'Portland',
    'locations.0.geo.lat': 45.5,
    'locations.1.city': 'Seattle',
    'locations.1.geo.lat': 47.6
}
```

Note that this produces a different set of keys for every record, since the keys depend on how many elements each array holds. A wildcard path is usually the better choice when the array length varies and only a field inside each element needs flattening.

### Flatten with a custom delimiter

```json
{
    "_op": "flatten_object",
    "delimiter": "_"
}
```

```javascript
const data = [
    DataEntity.make({ location: { city: 'Portland' } }),
]

const results = await processor.run(data);
```

Results:

```json
{ location_city: 'Portland' }
```

### Limit how deep it flattens

`max_depth` counts the levels descended into, from the record root when `field` is `"all"`, otherwise from each listed field. Anything below the limit is left nested.

```json
{
    "_op": "flatten_object",
    "max_depth": 1
}
```

```javascript
const data = [
    DataEntity.make({ a: { b: { c: 1 } } }),
]

const results = await processor.run(data);
```

Results:

```json
{ 'a.b': { c: 1 } }
```

With a field the count restarts at that field, so `c` below is one level down from `b`, not from the root.

```json
{
    "_op": "flatten_object",
    "field": "a.b",
    "max_depth": 1
}
```

```javascript
const data = [
    DataEntity.make({ a: { b: { c: { d: 1 } } } }),
]

const results = await processor.run(data);
```

Results:

```json
{ a: { 'b.c': { d: 1 } } }
```

### Handle a missing field

```json
{
    "_op": "flatten_object",
    "field": "location.geo",
    "missing_field_action": "throw"
}
```

A record without `location.geo` throws. Use `log` to emit a warning and pass the record through unchanged, or the default `ignore` to pass it through silently.
