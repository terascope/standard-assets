# drop_field

This `drop_field_conditional` processor drops a field from a [DataEntity](https://terascope.github.io/teraslice/docs/packages/utils/api/classes/dataentity) or [DataWindow](../entity/data-window.md) based on the specified conditions.

The conditions can be either matching a regex or passing a data-mate [Field Validation](https://terascope.github.io/teraslice/docs/packages/data-mate/overview#Field-Validations) function.  There is also an `invert` option to drop fields that don't match a regex or don't pass the validation function.

## Usage

### Conditionally Drop a field from a document
Here is an example.

Example Job with a regex

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
            "_op": "drop_field_conditional",
            "field": "name",
            "regex": "/?.lly/i"
        }
    ]
}

```
Example of the data and the expected results

```javascript
const data = [
    DataEntity.make({ name: 'lilly', otherField: 1 }),
    DataEntity.make({ name: 'willy', otherField: 2  }),
    DataEntity.make({ name: 'billy', otherField: 3  }),
    DataEntity.make({ name: 'ron', otherField: 4  }),
]

const results = await processor.run(data);

DataEntity.make({ otherField: 1 }),
DataEntity.make({ otherField: 2  }),
DataEntity.make({ otherField: 3  }),
DataEntity.make({ name: 'ron', otherField: 4  }),
```

Example Job with a function

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
            "_op": "drop_field_conditional",
            "field": "name",
            "validation_method": "inNumberRange",
            "validation_args": { "min": 2, "max": 4, }
        }
    ]
}

```
Example of the data and the expected results

```javascript
const data = [
    DataEntity.make({ name: 'lilly', otherField: 1 }),
    DataEntity.make({ name: 'willy', otherField: 2  }),
    DataEntity.make({ name: 'billy', otherField: 3  }),
    DataEntity.make({ name: 'ron', otherField: 4  }),
]

const results = await processor.run(data);

DataEntity.make({ name: 'lilly', otherField: 1 }),
DataEntity.make({ name: 'willy', otherField: 2  }),
DataEntity.make({ name: 'billy' }),
DataEntity.make({ name: 'ron', otherField: 4  }),
```

Example Job with a function and invert true

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
            "_op": "drop_field_conditional",
            "field": "name",
            "validation_method": "inNumberRange",
            "validation_args": { "min": 2, "max": 4, },
            "invert": true
        }
    ]
}

```
Example of the data and the expected results

```javascript
const data = [
    DataEntity.make({ name: 'lilly', otherField: 1 }),
    DataEntity.make({ name: 'willy', otherField: 2  }),
    DataEntity.make({ name: 'billy', otherField: 3  }),
    DataEntity.make({ name: 'ron', otherField: 4  }),
]

const results = await processor.run(data);

DataEntity.make({ name: 'lilly' }),
DataEntity.make({ name: 'willy' }),
DataEntity.make({ name: 'billy', otherField: 3 }),
DataEntity.make({ name: 'ron' }),
```

## Parameters

| Configuration | Description                                                   | Type   | Notes                        |
| ------------- | ------------------------------------------------------------- | ------ | ---------------------------- |
| _op  | Name of operation, it must reflect the exact name of the file | String | required                     |
| field | Name of field to remove from document | required, no default |
| regex | regex value to match to field value | regex must in format `/REGEX/FLAGS`, with beginning and ending `/`.  Flags are optional.  For details see [javascript regex's](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#writing_a_regular_expression_pattern) for more details |
| validation_method | Name of validation method to apply to field value | see [Field Validations](https://terascope.github.io/teraslice/docs/packages/data-mate/overview#field-validations) for list of available functions |
| validation_args | some validations accept args | optional |
| invert | When set to true, the processor drops fields that return `false` from the regex or validation method | defaults to `false` |

