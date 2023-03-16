# add_key

This is a helper processor that adds a deterministic key derived from the properties of the [DataEntity](https://terascope.github.io/teraslice/docs/packages/utils/api/classes/dataentity) or items in a [DataWindow](../entity/data-window.md).  It adds the key to both the incoming document and its metadata. Used for indexing or re-indexing data. 


## Usage

### Add a deterministic key to a record
Here is an example of this processor with a typical configuration

Example Job

```json
{
    "name" : "testing",
    "workers" : 1,
    "lifecycle" : "persistent",
    "assets" : [
        "standard"
    ],
    "operations" : [
        {
            "_op": "test-reader"
        },
        {
            "_op": "add_key",
            "key_name": "_key",
            "key_fields": [
                "name",
                "age"
            ],
            "minimum_field_count": 1,
            "hash_algorithm": "md5"
        }
    ]
}
```

The output from the example job

```javascript
const data = [
    DataEntity.make({ name: 'joe', age: 34 }),
]

const results = await processor.run(data);

results = [{ name: 'joe', age: 34, _key: '42mFPfdm-kTh7Q_2E_VjvQ' }]
```


## Parameters

| Configuration | Description | Type |  Notes |
| ------------- | ----------- | ---- | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| key_name | Name of field that will store the key value, this applies to the document and its metadata | String | defaults to `_key` |
| key_fields | List of fields whose values will be used to create the key, if left blank then all the fields will be used | Array of Strings | defaults to an empty array |
| invert_key_fields | If set to true the processor will use the fields not listed in `key_fields` to create the key | Boolean | defaults to `false` |
| hash_algorithm | Algorithm used to hash the field values | Valid options md4, md5, sha1, sha256, sha512, and whirlpool | defaults to `md5` |
| minimum_field_count | The number of fields required to make the key. Fields that are empty or undefined are excluded from the key values. If the minimum count is not met for a record then it will not be returned by the processor | Number | defaults to `0` |
| preserve_original_key | Copies the incoming records metadata `_key` value to `_original_key`, can be useful when re-indexing a data set | Boolean | defaults to `false` |
| delete_original | Copies the metadata `_key` to `_delete_id` in the metadata.  This allows a teraslice job to index data with a new key while deleting records by their old key in one pass, must be paired with the elasticsearch-assets bulk_sender | Boolean | defaults to `false` |
| truncate_location | Geo-point fields whose value should be truncated for keying purposes.  Supports the geo-point formats listed here https://www.elastic.co/guide/en/elasticsearch/reference/current/geo-point.html. It does not alter the value in the incoming document | String Array | defaults to an empty array | 
| truncate_location_places | The number of digits to keep after the decimal for the lat, lon values of a geo-point if truncate_location is true | Number | defaults to `4` | 
