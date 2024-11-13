# filter

Drops docs if the field value meets the criteria provided by filter_by, field, and value. Filter_by field can be a strict match, regex match, or within an ip range using cidr notation. If invert is true then processor returns objects whose value meets the criteria. Criteria value can be a single item or an array of items.

## Usage

### Filter out record by value matching

Example of a job using the `filter` processor

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
            "_op": "filter",
            "field": "name",
            "value": "bob"
        }
    ]
}

```
Example of the data and the expected results

```javascript
const data = [
    { _key: 0, ip: '28.127.246.12', name: 'francis' },
    { _key: 1, ip: '28.127.246.232', name: 'joseph' },
    { _key: 2, ip: '28.127.246.244', name: 'Johnson' },
    { _key: 3, ip: '4.17.23.6', name: 'bob' },
    { _key: 4, ip: '4.17.14.18', name: 'greg' },
];

const results = await processor.run(data);

results === [
    { _key: 0, ip: '28.127.246.12', name: 'francis' },
    { _key: 1, ip: '28.127.246.232', name: 'joseph' },
    { _key: 2, ip: '28.127.246.244', name: 'Johnson' },
    { _key: 4, ip: '4.17.14.18', name: 'greg' },
]
```

### Filter by value matching inverted (only keep record that matches)

Example of a job using the `filter` processor

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
            "_op": "filter",
            "field": "name",
            "value": "bob",
            "invert": true
        }
    ]
}

```
Example of the data and the expected results

```javascript
const data = [
    { _key: 0, ip: '28.127.246.12', name: 'francis' },
    { _key: 1, ip: '28.127.246.232', name: 'joseph' },
    { _key: 2, ip: '28.127.246.244', name: 'Johnson' },
    { _key: 3, ip: '4.17.23.6', name: 'bob' },
    { _key: 4, ip: '4.17.14.18', name: 'greg' },
];

const results = await processor.run(data);

results === [
    { _key: 3, ip: '4.17.23.6', name: 'bob' },
]
```

### Filter by regex

Example of a job using the `filter` processor

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
            "_op": "filter",
            "field": "name",
            "value": "/^jo.*/i",
            "filter_by": "regex"
        }
    ]
}

```
Example of the data and the expected results

```javascript
const data = [
    { _key: 0, ip: '28.127.246.12', name: 'francis' },
    { _key: 1, ip: '28.127.246.232', name: 'joseph' },
    { _key: 2, ip: '28.127.246.244', name: 'Johnson' },
    { _key: 3, ip: '4.17.23.6', name: 'bob' },
    { _key: 4, ip: '4.17.14.18', name: 'greg' },
];

const results = await processor.run(data);

results === [
    { _key: 0, ip: '28.127.246.12', name: 'francis' },
    { _key: 3, ip: '4.17.23.6', name: 'bob' },
    { _key: 4, ip: '4.17.14.18', name: 'greg' },
]
```

### Filter by ip_range

Example of a job using the `filter` processor

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
            "_op": "filter",
            "field": "ip",
            "value": "28.127.246.0/26",
            "filter_by": "ip_range"
        }
    ]
}

```
Example of the data and the expected results

```javascript
const data = [
    { _key: 0, ip: '28.127.246.12', name: 'francis' },
    { _key: 1, ip: '28.127.246.232', name: 'joseph' },
    { _key: 2, ip: '28.127.246.244', name: 'Johnson' },
    { _key: 3, ip: '4.17.23.6', name: 'bob' },
    { _key: 4, ip: '4.17.14.18', name: 'greg' },
];

const results = await processor.run(data);

results === [
    { _key: 1, ip: '28.127.246.232', name: 'joseph' },
    { _key: 2, ip: '28.127.246.244', name: 'Johnson' },
    { _key: 3, ip: '4.17.23.6', name: 'bob' },
    { _key: 4, ip: '4.17.14.18', name: 'greg' },
]
```

## Parameters

| Configuration | Description                                                   | Type   | Notes                        |
| ------------- | ------------------------------------------------------------- | ------ | ---------------------------- |
| _op           | Name of operation, it must reflect the exact name of the file | String | required |
| field         | Field to filter on | required, no default |
| value    | Value that is compared with document field value | required, no default |
| invert  | Set to true to return documents that match filter rules | optional, defaults to `false` |
| array_index  | Specify array field index to filter on | optional, defaults to `false` |
| filter_by  | Filter function options are: match, regex, ip_range, validator or size | optional, defaults to `match` |
| validation_function  | DataMate validation function to apply to a field | optional |
| validation_function_args  | Required Validator function args | optional|
| filtered_to_dead_letter_queue  | Filtered docs are sent to the kafka dead letter queue | optional, defaults to `false` |
| exception_rules  | Expects an array of objects, ie: [{ field: FIELD NAME, value: STRING or REGEX, regex: BOOLEAN }]. The value property can be a string or a regex, but if it is a regex it must be in format /REGEX/Flags and the regex property should be set to true. | optional, defaults to `null` |
