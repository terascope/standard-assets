
# set_key #

Used to set the _key metadata value for any DataEntity or [DataWindow](../entity/data-window.md) which is a special data-entity that encloses an array of data-entities.



| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| field | Field name of value used to set key | String | optional, defaults to `_id` |



## Usage

```javascript
const opConfig = {
    _op: 'set_key',
};

const data = [
    DataEntity.make({ name: 'chilly', _id: 1 }),
    DataEntity.make({ name: 'willy', _id: 2  }),
    DataEntity.make({ name: 'billy', _id: 3  }),
    DataEntity.make({ name: 'dilly', _id: 4  }),
]

// returns data, but _key is removed

const results = processor.run(data);

resuts[0].getKey() === 1
resuts[1].getKey() === 2
resuts[2].getKey() === 3
resuts[3].getKey() === 4


const opConfig = {
    _op: 'set_key',
    field: 'otherField'
};

const data = [
    DataEntity.make({ name: 'chilly', otherField: 1 }),
    DataEntity.make({ name: 'willy', otherField: 2  }),
    DataEntity.make({ name: 'billy', otherField: 3  }),
    DataEntity.make({ name: 'dilly', otherField: 4  }),
]

// returns data, but _key is removed

const results = processor.run(data);

resuts[0].getKey() === 1
resuts[1].getKey() === 2
resuts[2].getKey() === 3
resuts[3].getKey() === 4

```



## Example Job

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
            "_op": "test-reader",
        },
        {
            "_op": "set_key",
        }
    ],
}

```
