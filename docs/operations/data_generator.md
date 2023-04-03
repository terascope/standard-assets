# data_generator

A reader like processor that generates sample data. The default data generator creates randomized data fitting the format listed below or it can use a custom schema from the [mocker-data-generator](https://github.com/danibram/mocker-data-generator) package to create custom data.

## Usage

### Generate data

Example of jobs using the `data_generator` processor

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
            "_op": "data_generator",
            "size": 10000
        },
        {
            "_op": "noop"
        }
    ]
}
```

Output of the example job

```javascript
const slice = { count: 1000 }

const results = await fetcher.run(slice);

results.length ==== 1000;

results[0] === {
    "ip": "1.12.146.136",
    "userAgent": "Mozilla/5.0 (Windows NT 5.2; WOW64; rv:8.9) Gecko/20100101 Firefox/8.9.9",
    "url": "https://gabrielle.org",
    "uuid": "408433ff-9495-4d1c-b066-7f9668b168f0",
    "ipv6": "8188:b9ad:d02d:d69e:5ca4:05e2:9aa5:23b0",
    "location": "-25.40587, 56.56418",
    "created": "2016-01-19T13:33:09.356-07:00",
    "bytes": 4850020
}
```

### Generate custom data within a date range
This is an example of using a custom schema to generate records with dates between `2015-08-01T10:33:09.356Z` and `2015-12-30T20:33:09.356Z`

Example Job
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
            "_op": "data_generator",
            "json_schema": "some/path/to/file.js",
            "format": "isoBetween",
            "start": "2015-08-01T10:33:09.356Z",
            "end": "2015-12-30T20:33:09.356Z",
            "date_key": "joinDate"
        },
        {
            "_op": "noop"
        }
    ]
}
```

Example schema located at `some/path/to/file.js`

```javascript
export default const schema = {
    firstName: {
        faker: 'name.firstName'
    },
    lastName: {
        faker: 'name.lastName'
    },
    country: {
        faker: 'address.country'
    }
}
```

Example output from the above job:

```javascript
const slice = { count: 2 }

const results = await fetcher.run(slice);

results.length ==== 2;

results[0] === {
    "firstName": "Chilly",
    "lastName": "Willy",
    "country": "United States",
    "joinDate": "2015-10-10T10:13:09.157Z",
}
```

### Stress Test and persistent mode
In this example job the `data_generator` generates a persistent slice of 10,000 records for all 50 workers until the job is shutdown. This is useful for stress testing systems and down stream processes.

Example Job
```json
{
    "name" : "testing",
    "workers" : 50,
    "slicers" : 1,
    "lifecycle" : "persistent",
    "assets" : [
        "standard"
    ],
    "operations" : [
        {
            "_op": "data_generator",
            "stress_test": true,
            "size": 10000
        },
        {
            "_op": "noop"
        }
    ]
}
```

Example output from the above job:

```javascript
const slice = { count: 1000 }

const results = await fetcher.run(slice);

results.length ==== 1000;

results[0] === {
    "ip": "1.12.146.136",
    "userAgent": "Mozilla/5.0 (Windows NT 5.2; WOW64; rv:8.9) Gecko/20100101 Firefox/8.9.9",
    "url": "https://gabrielle.org",
    "uuid": "408433ff-9495-4d1c-b066-7f9668b168f0",
    "ipv6": "8188:b9ad:d02d:d69e:5ca4:05e2:9aa5:23b0",
    "location": "-25.40587, 56.56418",
    "created": "2016-01-19T13:33:09.356-07:00",
    "bytes": 4850020
}
```

## Parameters

| Configuration | Description | Type | Notes |
| ------------- | ------------| -----| ------|
| _op           | Name of operation, it must reflect the exact name of the file | String  | required |
| size          | If job `lifecycle` is set to `once`, then size is the total number of generated documents. If job `lifecycle` is set to `persistent`, then the generator will constantly stream data in chunks equal to the size | Number | required |
| json_schema   | File path to custom schema | String  | optional, the schema must be exported Node style `module.exports = schema` |
| format        | Format of date in the timestamp field, options are `dateNow`, `utcDate`, `utcBetween`, `isoBetween`.  See advanced configuration section for more details | String  | optional, defaults to `dateNow` |
| start         | Start of date range | String  | optional, only used with format `isoBetween` or `utcBetween`, defaults to Thu Jan 01 1970 00:00:00 GMT-0700 (MST) |
| end           | End of date range | String  | optional, only used with format `isoBetween` or `utcBetween`, defaults to new Date() |
| stress_test   | If set to true, it will send non-unique documents following your schema as fast as possible.  Helpful to determine downstream performance limits or constraints | Boolean | optional, defaults to false |
| date_key      | Name of they date field.  If set, it will remove the `created` field on the default schema. | String  | optional, defaults to created |
| set_id        | Sets an `id` field on each record whose value is formatted according the the option given. The options are `base64url`, `hexadecimal`, `HEXADECIMAL` | String  | optional, it does not set any metadata fields, ie `_key`.  See the `set_key` processor on how to set the `_key` in the metadata. |
| id_start_key  | Set if you would like to force the first part of the `id` to a certain character or set of characters | Sting | optional, must be used in tandem with `set_id`.  `id_start_key` is essentially a regex. If you set it to "a", then the first character of the id will be "a", can also set ranges [a-f] or randomly alternate between b and a if its set to "[ab]" |

## Advanced Configuration

### Description of date formats and time range options

| Format     | Description                                                                             |
| ---------- | --------------------------------------------------------------------------------------- |
| dateNow    | Formats dates in the `ISO8601` specification, ie `2016-01-19T13:48:08.426-07:00`, preserving local time. Values will be the current date and time. |
| isoBetween | Uses the `ISO8601` format, but date and time values are constrained by the `start` and `end` config settings. |
| utcDate    | Formats dates in the `UTC` specification, ie "2016-01-19T20:48:08.426Z". Values will be the current date and time. |
| utcBetween | Uses the `UTC` format, but date and time values are constrained by the `start` and `end` config settings. |


### persistent mode
 The data generator will continually stream data.  In this mode the `size` value applies to the number of documents generated per slice instead of the total number of documents created as it does in `once` mode.
