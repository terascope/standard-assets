
# remove_key #

Used to remove the _key metadata value for any DataEntity or [DataWindow](../entity/data-window.md) which is a special data-entity that encloses an array of data-entities.



| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |



## Usage

```javascript
const opConfig = {
    _op: 'remove_key',
};

const data = [
    DataEntity.make({ name: 'chilly' }, { _key: 1 }),
    DataEntity.make({ name: 'willy' }, { _key: 2 }),
    DataEntity.make({ name: 'billy' }, { _key: 3 }),
    DataEntity.make({ name: 'dilly' }, { _key: 4 }),
]

// returns data, but _key is removed

const results = processor.run(data);

resuts[0].getKey() === undefined

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
            "_op": "remove_key",
        }
    ],
}

```
