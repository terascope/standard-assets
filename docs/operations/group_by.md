
# group_by #

Used to group records by a field or the _key metadata if no field is specified. It will return an array of [DataWindow](../entity/data-window.md) which is a special data-entity that encloses an array of data-entities.



| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| field | field to group records on | String | optional, defaults to metadata value set at '_key' |

## Usage

```javascript
const opConfig = {
    _op: 'group_by'
};

const data = [
    DataEntity.make({ name: 'chilly' }, { _key: 1 }),
    DataEntity.make({ name: 'willy' }, { _key: 1 }),
    DataEntity.make({ name: 'billy' }, { _key: 2 }),
    DataEntity.make({ name: 'dilly' }, { _key: 3 }),
]

const expectedDataWindows = [
    { dataArray: [{ name: 'chilly' },  { name: 'willy' }] },
    { dataArray: [{ name: 'billy' }] },
    { dataArray: [{ name: 'dilly' }] }
]

processor.run(data)
// returns expectedDataWindows

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
            "_op": "group_by"
        }
    ],
}

```
