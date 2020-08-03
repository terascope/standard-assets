
# routed_sender #

A processor that uses apis to route data by the `standard:route` metadata attribute to different destinations. This currently only supports a single type of api (kafka, elasticsearch, s3, file) for now.

This works by providing a routing object with keys that match the metadata key `standard:route`. The value is the connection endpoint from your [terafoundation connectors](https://terascope.github.io/teraslice/docs/configuration/overview#terafoundation-connectors). This asset bundle provides a few operations to set and manipulate the `standard:route` metadata key. You make also make your own processor to set that key as well.

If a route does not match the configuration, then it will throw unless the `_dead_letter_action` for the operation is set to something else like `log` or `none`.

You can specify a `*` key route which acts as a catch all for records that don't match anything else and route them to what connection configuration you have specified.

You may also set a `**` route which allows any unmatched records to be dynamically sent to routes indicated by the `standard:route` metadata key itself.

`NOTE: you cannot mix * and ** together, it will throw`


| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| size | the maximum number of docs it will take at a time, anything past it will be split up and sent according to the `concurrency` setting | Number | optional, defaults to 500 |
| concurrency | The number of inflight calls to the api.send allowed | Number | optional, defaults to 10 |
| api_name | The name of the api that will be used | String | required |
| routing | Mapping of `standard:route` metadata to connection names. Routes data to multiple clusters based on the incoming key. The key name can be a comma separated list of prefixes that will map to the same connection | Object | required |


## Usage

```javascript
const RoutedSenderConfig = {
    _op: "routed_sender',
    api_name": 'elasticsearch_sender_api',
    routing: {
        'a,A': 'someConnection'
    },
    _dead_letter_action: 'none'
}

const data = [
    DataEntity.make({ some: 'data' }, { _key: 'aasdfsd' }),
    DataEntity.make({ other: 'data' }, { _key: 'ba7sd' }),
    DataEntity.make({ last: 'data' }, { _key: 'Azpelsie' }),
]

// is used with this operator to set `standard:route`

{
    "_op": "key_router",
    "use": 1,
    "from": "beginning",
    "case": "lower"
},

// { some: 'data' }, { last: 'data' } will be sent with conenction `someConnection`

// since _dead_letter_action is none, { other: 'data' } will not throw and be dropped since it does not match



const RoutedSenderConfig = {
    _op: "routed_sender',
    api_name": 'elasticsearch_sender_api',
    routing: {
        'a,A': 'someConnection',
        '*': 'catchAllConnection',
    },
    _dead_letter_action: 'none'
}

const data = [
    DataEntity.make({ some: 'data' }, { _key: 'aasdfsd' }),
    DataEntity.make({ other: 'data' }, { _key: 'ba7sd' }),
    DataEntity.make({ last: 'data' }, { _key: 'Azpelsie' }),
]

// is used with this operator to set `standard:route`

{
    "_op": "key_router",
    "use": 1,
    "from": "beginning",
    "case": "lower"
},

// { some: 'data' }, { last: 'data' } will be sent with conenction `someConnection`

//  { other: 'data' } will be sent to catchAllConnection


const RoutedSenderConfig = {
    _op: "routed_sender',
    api_name": 'elasticsearch_sender_api',
    routing: {
        'a,A': 'someConnection'
    },
    _dead_letter_action: 'none'
}

const data = [
    DataEntity.make({ some: 'data' }, { _key: 'aasdfsd' }),
    DataEntity.make({ other: 'data' }, { _key: 'ba7sd' }),
    DataEntity.make({ last: 'data' }, { _key: 'Azpelsie' }),
]

// is used with this operator to set `standard:route`

{
    "_op": "key_router",
    "use": 1,
    "from": "beginning",
    "case": "lower"
},

// { some: 'data' }, { last: 'data' } will be sent with conenction `someConnection`

// since _dead_letter_action is none, { other: 'data' } will not throw and be dropped since it does not match


 const apiConfig = {
    "_name": "elasticsearch_sender_api",
    "create": true,
    "index": "dynamic_elastic"
}

const RoutedSenderConfig = {
    _op: "routed_sender',
    api_name": 'elasticsearch_sender_api',
    routing: {
        '**': 'default',
    },
    _dead_letter_action: 'none'
}

const data = [
    DataEntity.make({ some: 'data' }, { _key: 'aasdfsd' }),
    DataEntity.make({ other: 'data' }, { _key: 'ba7sd' }),
    DataEntity.make({ last: 'data' }, { _key: 'Azpelsie' }),
]

// is used with this operator to set `standard:route`

{
    "_op": "key_router",
    "use": 1,
    "from": "beginning",
    "case": "lower"
},

// { some: 'data' }, { last: 'data' } will be sent to route dynamic_elastic-a

//  { other: 'data' } will be sent to dynamic_elastic-b


```



## Example Job

```json
{
    "name" : "testing",
    "workers" : 1,
    "slicers" : 1,
    "lifecycle" : "once",
    "assets" : [
        "standard",
        "elasticsearch"
    ],
    "apis": [
         {
            "_name": "elasticsearch_sender_api",
            "index": "other_index",
            "size": 1000,
            "index": true
        },
    ]
    "operations" : [
        {
            "_op": "data_generator",
            "size": 10000
        },
        {
            "_op": "key_router",
            "use": 1,
            "from": "beginning",
            "case": "lower"
        },
        {
            "_op": "routed_sender",
            "api_name": "elasticsearch_sender_api",
            "routing": {
                "**": "default"
            }
        }
    ],
}

```


## APIS
We provide a few different apis to work the the routed_sender, the elasticsearch_sender_api from [elasticsearch-assets](https://github.com/terascope/elasticsearch-assets), [s3_sender_api and file_sender_api](https://github.com/terascope/file-assets) from file-assets and kafka_sender_api from [kafka-assets](https://github.com/terascope/kafka-assets).

However you are not limited to these api's alone, you can make your own. This api needs to inherit from [APIFactory](https://terascope.github.io/teraslice/docs/packages/job-components/api/classes/apifactory) from job-components, and provide a sender that implements a [RouteSenderAPI](https://terascope.github.io/teraslice/docs/packages/job-components/api/interfaces/routesenderapi) from job-components.


```typescript
// file_sender_api/api.ts
// this is an example of a file sender APIFactory
import {
    APIFactory, AnyObject, isNil, isString, getTypeOf
} from '@terascope/job-components';
import FileSender from './sender';
import { FileSenderAPIConfig } from './interfaces';

export default class FileSenderApi extends APIFactory<FileSender, FileSenderAPIConfig> {
    async create(
        _name: string, overrideConfigs: Partial<FileSenderAPIConfig>
    ):Promise<{ client: FileSender, config: FileSenderAPIConfig }> {
        const config = Object.assign({}, this.apiConfig, overrideConfigs)
        const client = new FileSender(config, this.logger);
        return { client, config };
    }

    async remove(_name: string): Promise<void> {
        // this fileSender does not need to close any DB connecection or have any other cleanup for the client made, this is where that work is done
    }
}

```


```typescript
// file_sender_api/sender.ts
import {
    RouteSenderAPI,
    DataEntity,
    Logger,
    TSError,
    pMap
} from '@terascope/job-components';
import fse from 'fs-extra';
import ChunkedSender from '../__lib/chunked-file-sender';
import { FileSenderAPIConfig } from './interfaces';
import { FileSenderType } from '../__lib/interfaces';
import path from 'path';

export default class FileSender implements RouteSenderAPI {
    logger: Logger;
    concurrency: number;


    // this method is used to send records
    async send(records: DataEntity[]): Promise<void> {
        // put your implmentation here
    }

    // this is used to make sure route is available, not all senders
    // need to do this so make this noop in those circumstances
    async verify(route?: string): Promise<void> {
        const newPath = path.join(this.path, route);
        await fse.ensureDir(newPath);
    }
}

```
