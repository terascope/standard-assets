# filter_by_unknown_fields

The `filter_by_unknown_fields` processor filters documents based on whether a record has extra unknown fields.

## Usage

### Filtering records to only include known fields

Example of a job using the `filter_by_unknown_fields` processor

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
            "_op": "filter_by_unknown_fields",
            "known_fields": ["name", "age", "height"]
        }
    ]
}

```

Example of the data and the expected results

```javascript
const data = [
    { name: 'joe', age: 32, height: 100 },
    { name: 'mel', age: 20, height: 200 },
    { name: 'tim', age: 33, height: 150, year: 2022 },
    { name: 'red', age: 38, height: 120 },
    { name: 'frey', age: 48, height: 125 }
];

const results = await processor.run(data);

results === const data = [
    { name: 'joe', age: 32, height: 100 },
    { name: 'mel', age: 20, height: 200 },
    { name: 'red', age: 38, height: 120 },
    { name: 'frey', age: 48, height: 125 }
];
```

### Filtering records to find those with unknown fields

Example of a job using the `filter_by_unknown_fields` processor

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
            "_op": "filter_by_unknown_fields",
            "known_fields": ["name", "age", "height"],
            "invert": true
        }
    ]
}

```

Example of the data and the expected results

```javascript
const data = [
    { name: 'joe', age: 32, height: 100 },
    { name: 'mel', age: 20, height: 200 },
    { name: 'tim', age: 33, height: 150, year: 2022 },
    { name: 'red', age: 38, height: 120 },
    { name: 'frey', age: 48, height: 125 }
];

const results = await processor.run(data);

results === const data = [
       { name: 'tim', age: 33, height: 150, year: 2022 },
];
```

## Parameters

| Configuration | Description                                                   | Type   | Notes                        |
| ------------- | ------------------------------------------------------------- | ------ | ---------------------------- |
| _op           | Name of operation, it must reflect the exact name of the file | String | required |
| known_fields   | A list of known fields on the record | Array\<String> | required, no default |
| invert  | Set invert to True to return records with unknown fields | Boolean | optional, defaults to false |
