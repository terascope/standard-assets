import 'jest-extended';
import { WorkerTestHarness, newTestJobConfig } from 'teraslice-test-harness';
import { isEmpty, DataEntity, get } from '@terascope/job-components';
import path from 'path';
import TestApi from '../fixtures/someAssetId/test_api/api';
import RoutedSender from '../../asset/src/routed_sender/processor';
import { RoutingExecution } from '../../asset/src/routed_sender/interfaces';

describe('Route Sender', () => {
    let harness: WorkerTestHarness;

    const testAssetPath = path.join(__dirname, '../fixtures/someAssetId');
    const opPathName = path.join(__dirname, '../../asset/');
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

    function getRouteData(routing: RoutingExecution, route: string) {
        const routeApi = routing.get(route);
        if (isEmpty(routeApi)) return false;
        const apiClient = routeApi?.client as unknown as TestApi;
        // @ts-expect-error
        return apiClient.sendArgs[0];
    }

    function getRouteArgs(routing: RoutingExecution, route: string) {
        const routeApi = routing.get(route);
        if (isEmpty(routeApi)) return false;
        const apiClient = routeApi?.client as unknown as TestApi;
        // @ts-expect-error
        return apiClient.routeArgs;
    }

    function getRoutingKeys(routing: RoutingExecution): string[] {
        const results: string[] = [];

        for (const routeConfig of routing.values()) {
            const config = get(routeConfig, 'client.configArgs[1]');
            results.push(config._key);
        }

        return results;
    }

    function getRoutingExecution(test: WorkerTestHarness): RoutingExecution {
        const processor = test.getOperation<RoutedSender>('routed_sender');
        return processor.routingExecution;
    }

    it('will throw if routing is misconfigured', async () => {
        expect.hasAssertions();
        const opConfig = {
            routing: {
                '*': 'default',
                '**': 'default'
            }
        };

        try {
            await makeTest(opConfig);
        } catch (err) {
            expect(err.message).toEqual('routing cannot specify "*" and "**"');
        }
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
            keys.forEach((key) => expect(keyValues.includes(key)).toBeTrue());
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
