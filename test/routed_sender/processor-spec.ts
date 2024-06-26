/* eslint-disable @typescript-eslint/naming-convention */
import 'jest-extended';
import { WorkerTestHarness, newTestJobConfig } from 'teraslice-test-harness';
import {
    isEmpty, DataEntity, get, RouteSenderAPI
} from '@terascope/job-components';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import TestApi from '../fixtures/someAssetId/test_api/api.js';
import RoutedSender from '../../asset/src/routed_sender/processor.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Route Sender', () => {
    let harness: WorkerTestHarness;

    const testAssetPath = path.join(dirname, '../fixtures/someAssetId');
    const opPathName = path.join(dirname, '../../asset/');
    const assetDir = [testAssetPath, opPathName];
    const apiName = 'test_api';

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    async function makeTest(senderConfig = {}) {
        const opConfig = Object.assign({
            _op: 'routed_sender',
            api_name: apiName
        }, senderConfig);
        const job = newTestJobConfig({
            max_retries: 0,
            apis: [
                {
                    _name: apiName,
                    some: 'config'
                },
            ],
            operations: [
                {
                    _op: 'test-reader',
                    passthrough_slice: true,
                },
                {
                    _op: 'key_router',
                    use: 1,
                    from: 'beginning'
                },
                opConfig
            ],
        });

        harness = new WorkerTestHarness(job, { assetDir });

        await harness.initialize();

        return harness;
    }

    function getRouteData(senders: Map<string, RouteSenderAPI>, route: string) {
        const sender = senders.get(route);
        if (isEmpty(sender)) return false;

        const apiClient = sender as unknown as TestApi;
        // @ts-expect-error
        return apiClient.sendArgs[0];
    }

    function getRouteArgs(senders: Map<string, RouteSenderAPI>, route: string) {
        const sender = senders.get(route);
        if (isEmpty(sender)) return false;

        const apiClient = sender as unknown as TestApi;
        // @ts-expect-error
        return apiClient.routeArgs;
    }

    function getRoutingKeys(senders: Map<string, RouteSenderAPI>): string[] {
        const results: string[] = [];

        for (const sender of senders.values()) {
            const config = get(sender, 'configArgs[1]');
            results.push((config as any)._key);
        }

        return results;
    }

    function getRoutingExecution(test: WorkerTestHarness): Map<string, RouteSenderAPI> {
        const processor = test.getOperation<RoutedSender>('routed_sender');
        return processor.routedSender.senders;
    }

    it('will throw if routing is misconfigured', async () => {
        const opConfig = {
            routing: {
                '*': 'default',
                '**': 'default'
            }
        };

        await expect(makeTest(opConfig)).rejects.toThrowError('routing cannot specify "*" and "**"');
    });

    it('will not throw if routing is misconfigured part 2', async () => {
        const opConfig = {
            routing: {
                '**': 'default'
            }
        };

        const test = await makeTest(opConfig);
        expect(test).toBeDefined();
    });

    it('can initialize and send to a single route', async () => {
        const opConfig = {
            routing: { '*': 'default' }
        };
        const data = [
            DataEntity.make({ some: 'data' }, { _key: 'aasdfsd' }),
            DataEntity.make({ other: 'data' }, { _key: 'ba7sd' })
        ];
        const test = await makeTest(opConfig);
        const results = await test.runSlice(data);

        expect(results).toBeArrayOfSize(2);

        const routing = getRoutingExecution(test);
        const routeData = getRouteData(routing, '*');
        expect(routeData).toBeArrayOfSize(2);
    });

    it('can send to multiple route', async () => {
        const opConfig = {
            routing: {
                '*': 'default',
                'a,A': 'other'
            }
        };
        const data = [
            DataEntity.make({ some: 'data' }, { _key: 'aasdfsd' }),
            DataEntity.make({ other: 'data' }, { _key: 'ba7sd' }),
            DataEntity.make({ last: 'data' }, { _key: 'Aasdfsd' }),
        ];

        const test = await makeTest(opConfig);
        const results = await test.runSlice(data);

        expect(results).toBeArrayOfSize(3);

        const routing = getRoutingExecution(test);
        const keyValues = getRoutingKeys(routing);

        const routeDataDefault = getRouteData(routing, '*');
        const routeDataMinorA = getRouteData(routing, 'a');
        const routeDataCapitalA = getRouteData(routing, 'A');

        expect(routeDataDefault).toBeArrayOfSize(1);
        expect(routeDataMinorA).toBeArrayOfSize(1);
        expect(routeDataCapitalA).toBeArrayOfSize(1);

        // this tests to make sure that the _key is being propagated correctly on the config
        for (const opKey of Object.keys(opConfig.routing)) {
            const keys = opKey.split(',').map((key) => key.trim());
            expect(keyValues).toContainValues(keys);
        }
    });

    it('can be sent dynamically route', async () => {
        const opConfig = {
            routing: {
                '**': 'default',
            }
        };
        const data = [
            DataEntity.make({ some: 'data' }, { _key: 'aasdfsd' }),
            DataEntity.make({ other: 'data' }, { _key: 'ba7sd' }),
            DataEntity.make({ last: 'data' }, { _key: 'Aasdfsd' }),
        ];

        const test = await makeTest(opConfig);
        const results = await test.runSlice(data);

        expect(results).toBeArrayOfSize(3);

        const routing = getRoutingExecution(test);
        const keyValues = getRoutingKeys(routing);

        const dynamicRouting = getRouteData(routing, '**');
        const routes = getRouteArgs(routing, '**');

        expect(dynamicRouting).toBeArrayOfSize(3);
        expect(routes).toContain('a');
        expect(routes).toContain('b');
        expect(routes).toContain('A');

        expect(keyValues).toEqual(['**']);
    });
});
