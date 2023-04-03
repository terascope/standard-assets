# drop_field

The `drop_field_conditional` processor drops a field from [DataEntities](https://terascope.github.io/teraslice/docs/packages/utils/api/classes/dataentity) or [DataWindows](../entity/data-window.md) based on the specified conditions.  The conditions can be either a regex or a [Field Validation](https://terascope.github.io/teraslice/docs/packages/data-mate/overview#Field-Validations) function.  There is also an `invert` option to drop fields that don't match a regex or don't pass the validation function.  Only a regex or a validation can be specified, if both are configured the job will throw an error.

## Usage

### Conditionally Drop a field from a document

Example of a job using the `drop_field_conditional` processor and a regex configured

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

Output of example job

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

Example of a job using a [Field Validation](https://terascope.github.io/teraslice/docs/packages/data-mate/overview#Field-Validations) function

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

Output of example job

```javascript
const data = [
    DataEntity.make({ name: 'lilly', otherField: 1 }),
    DataEntity.make({ name: 'willy', otherField: 2 }),
    DataEntity.make({ name: 'billy', otherField: 3 }),
    DataEntity.make({ name: 'ron', otherField: 4 }),
]

const results = await processor.run(data);

DataEntity.make({ name: 'lilly', otherField: 1 }),
DataEntity.make({ name: 'willy', otherField: 2 }),
DataEntity.make({ name: 'billy' }),
DataEntity.make({ name: 'ron', otherField: 4 }),
```

Example Job with a [Field Validation](https://terascope.github.io/teraslice/docs/packages/data-mate/overview#Field-Validations) function and invert set to `true`

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

Output of example job

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
| field | Name of field to remove | required, no default |
| regex | regex value to check with field values | regex must be in format `/REGEX/FLAGS`, with beginning and ending `/`.  Flags are optional.  For more details see [javascript regex's](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#writing_a_regular_expression_pattern) |
| validation_method | Name of validation method to apply to field value | see [Field Validations](https://terascope.github.io/teraslice/docs/packages/data-mate/overview#field-validations) for list of available functions |
| validation_args | some validations require args | optional |
| invert | When set to `true`, the processor drops the value if it doesn't match the regex or if it doesn't pass the validation | defaults to `false` |

