# count_unique

The `count_unique` processor returns a list of unique values and how many times it appears within the slice for any [DataEntity](https://terascope.github.io/teraslice/docs/packages/utils/api/classes/dataentity) or [DataWindow](../entity/data-window.md).

## Usage

### Count the amount of times a given field is shown

Example of a job using the `count_unique` processor

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
            "_op": "count_unique",
            "field": "_key",
            "is_meta_field": true
        }
    ]
}

```
Example of the data and the expected results

```javascript
const data = [
    DataEntity.make({ name: 'lilly', otherField: 1 }, { _key: 1 }),
    DataEntity.make({ name: 'willy', otherField: 2 }, { _key: 2 }),
    DataEntity.make({ name: 'billy', otherField: 3 }, { _key: 1 }),
    DataEntity.make({ name: 'dilly', otherField: 4 }, { _key: 3 }),
    DataEntity.make({ name: 'chilly', otherField: 4 }, { _key: 1 }),
    DataEntity.make({ name: 'silly', otherField: 4 }, { _key: 1 }),
]

const results = await processor.run(data);

DataEntity.make({ count: 4, _key_: 1, }),
DataEntity.make({ count: 1, _key_: 2, }),
DataEntity.make({ count: 1, _key_: 3, }),
```

Example of a Job checking against a regular field, and preserving the last seen fields of said record

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
            "_op": "count_unique",
            "field": "otherField",
            "is_meta_field": false,
            "preserve_fields": ["name"]
        }
    ]
}

```

```javascript
const data = [
    DataEntity.make({ name: 'lilly', otherField: 1 }, { _key: 1 }),
    DataEntity.make({ name: 'willy', otherField: 2 }, { _key: 2 }),
    DataEntity.make({ name: 'billy', otherField: 3 }, { _key: 1 }),
    DataEntity.make({ name: 'dilly', otherField: 4 }, { _key: 3 }),
    DataEntity.make({ name: 'chilly', otherField: 4 }, { _key: 1 }),
    DataEntity.make({ name: 'silly', otherField: 4 }, { _key: 1 }),
]

const results = await processor.run(data);

DataEntity.make({ count: 3, name: 'silly', otherField: 4, }),
DataEntity.make({ count: 1, name: 'billy', otherField: 3, }),
DataEntity.make({ count: 1, name: 'willy' otherField: 2, }),
DataEntity.make({ count: 1, name: 'lilly', otherField: 1, }),

```

## Parameters

| Configuration | Description                                                   | Type   | Notes                        |
| ------------- | ------------------------------------------------------------- | ------ | ---------------------------- |
| _op           | Name of operation, it must reflect the exact name of the file | String | required |
| preserve_fields   | A list of fields whose last seen values are added to the result in addition to the count | optional, defaults to an empty array |
| field    | field to get count on | required, defaults to "_key" |
| is_meta_field  | determines if the "field" parameter is a Metadata field or an actual field on the record| required, defaults to true since _key is a Metadata field |
