# routed_sender

A processor that routes data according to the `standard:route` metadata attribute and the `apis` setting in the job. It currently supports the [teraslice apis](https://terascope.github.io/teraslice/docs/jobs/configuration#apis) for [kafka](https://github.com/terascope/kafka-assets), [elasticsearch](https://github.com/terascope/elasticsearch-assets), [s3 and file](https://github.com/terascope/file-assets).  This works by providing a routing object with keys that match the metadata key `standard:route`. The value is the connection endpoint from your [terafoundation connectors](https://terascope.github.io/teraslice/docs/configuration/overview#terafoundation-connectors).  This asset bundle provides a few operations to set and manipulate the `standard:route` metadata key. You make also make your own processor to set that key as well.  If a route does not match the configuration, then it will throw an error unless `_dead_letter_action` for the operation is set to `log` or `none`.  You can specify a `*` key route which acts as a catch all for records that don't match anything else and route them to what connection configuration you have specified.  You may also set a `**` route which allows any unmatched records to be dynamically sent to routes indicated by the `standard:route` metadata key itself.

`NOTE: you cannot mix * and ** together, it will throw`


## Usage

### Only route specific keys, ignore non matching routes

Example of a job using the `routed_sender` processor that only defines the connection for the `a` `standard:route`.  The `standard:route` value is set by the [`key_router`](./key_router.md) for this job.

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
            "size": 1000
        }
    ],
    "operations" : [
        {
            "_op": "test-reader"
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
                "a": "someConnection"
            },
            "_dead_letter_action": "none"
        }
    ]
}

```

Output from the example job

```javascript
const data = [
    DataEntity.make({ some: 'data' }, { 'standard:route': 'aasdfsd' }),
    DataEntity.make({ other: 'data' }, { 'standard:route': 'ba7sd' }),
    DataEntity.make({ last: 'data' }, { 'standard:route': 'Azpelsie' }),
]

const results = await process.run(data);

// the router will return all input data for any processors after this one
results === data;

// { some: 'data' }, { last: 'data' } will be sent with connection `someConnection`

// since _dead_letter_action is none, { other: 'data' } will not throw an error and be dropped since it does not match

```

###  Route specific keys, have a catch-all for any non-matching values

Example of a job that that defines the `a` `standard:route` and has a catch all for non-matching `standard:routes`.  The `standard:route` value is set by the [`key_router`](./key_router.md) for this job.

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
            "size": 1000
        }
    ],
    "operations" : [
        {
            "_op": "test-reader"
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
                "a": "someConnection",
                "*": "catchAllConnection"
            }
        }
    ]
}

```

Output from the example job

```javascript
const data = [
    DataEntity.make({ some: 'data' }, { 'standard:route': 'aasdfsd' }),
    DataEntity.make({ other: 'data' }, { 'standard:route': 'ba7sd' }),
    DataEntity.make({ last: 'data' }, { 'standard:route': 'Azpelsie' }),
]

const results = await process.run(data);

// the router will return all input data for any processors after this one
results === data;

// { some: 'data' }, { last: 'data' } will be sent with connection `someConnection`

//  { other: 'data' } will be sent to catchAllConnection

```

###  Dynamically route data

Example of a job dynamically routing data. Since this example is paired with the `elasticsearch_sender_api`, the index specified will be the prefix to the `_key` value.

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
            "index": "dynamic_elastic",
            "size": 1000
        }
    ],
    "operations" : [
        {
            "_op": "test-reader"
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
                "**": "dynamicRouteConnection"
            }
        }
    ]
}

```

Output from the example job

```javascript
const data = [
    DataEntity.make({ some: 'data' }, { 'standard:route': 'aasdfsd' }),
    DataEntity.make({ other: 'data' }, { 'standard:route': 'ba7sd' }),
    DataEntity.make({ last: 'data' }, { 'standard:route': 'Azpelsie' }),
]

const results = await process.run(data);

// the router will return all input data for any processors after this one
results === data;

// { some: 'data' }, { last: 'data' } will be sent to index dynamic_elastic-a

//  { other: 'data' } will be sent to index dynamic_elastic-b

```


## APIS
We provide a few different apis to work the the routed_sender, the elasticsearch_sender_api from [elasticsearch-assets](https://github.com/terascope/elasticsearch-assets), [s3_sender_api and file_sender_api](https://github.com/terascope/file-assets) from file-assets and kafka_sender_api from [kafka-assets](https://github.com/terascope/kafka-assets).

However, you can make your own api processors. The api needs to inherit from [APIFactory](https://terascope.github.io/teraslice/docs/packages/job-components/api/classes/apifactory), and provide a sender that implements a [RouteSenderAPI](https://terascope.github.io/teraslice/docs/packages/job-components/api/interfaces/routesenderapi).


Here is an example of the APIFactory for a File Sender
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
        // this fileSender does not need to close any DB connection or have any other cleanup for the client made, this is where that work is done
    }
}

```

Here is an example of the RouteSenderAPI for a File Sender, this is what the APIFactory returns in the create method

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
        // put your implementation here
    }

    // this is used to make sure route is available, not all senders
    // need to do this so make this noop in those circumstances
    async verify(route?: string): Promise<void> {
        const newPath = path.join(this.path, route);
        await fse.ensureDir(newPath);
    }
}

```


## Parameters

| Configuration | Description | Type |  Notes |
| --------- | -------- | ------ | ------ |
| _op | Name of operation, it must reflect the exact name of the file | String | required |
| size | the maximum number of docs it will take at a time, anything past it will be split up and sent according to the `concurrency` setting | Number | optional, defaults to 10000 |
| concurrency | The number of inflight calls to the api.send allowed | Number | optional, defaults to 10 |
| api_name | The name of the api that will be used | String | required |
| routing | Mapping of `standard:route` metadata to connection names. Routes data whose `standard:route` metadata value matches the object key to the connection specified. The key name can be a comma separated list of prefixes that will map to the same connection | Object | required |
