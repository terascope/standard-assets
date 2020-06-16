import { WorkerTestHarness, newTestJobConfig } from 'teraslice-test-harness';
import { isEmpty, DataEntity } from '@terascope/job-components';
import path from 'path';
import TestApi from './fixtures/test_api/api';
import RoutedSender from '../asset/src/routed_sender/processor';
import { RoutingExectuion } from '../asset/src/routed_sender/interfaces';

describe('Route Sender', () => {
    const assetDir = path.join(__dirname, '../asset');
    const TestSender = path.join(__dirname, '../test/fixtures/test_api');
    let harness: WorkerTestHarness;

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    async function makeTest(senderConfig = {}) {
        const opConfig = Object.assign({
            _op: 'routed_sender',
            api_name: TestSender
        }, senderConfig);
        const job = newTestJobConfig({
            max_retries: 0,
            apis: [
                {
                    _name: TestSender,
                    some: 'config'
                },
            ],
            operations: [
                {
                    _op: 'test-reader',
                    passthrough_slice: true,
                },
                opConfig
            ],
        });

        harness = new WorkerTestHarness(job, { assetDir });

        await harness.initialize();

        return harness;
    }

    function getRouteData(routing: RoutingExectuion, route: string) {
        const routeApi = routing.get(route);
        if (isEmpty(routeApi)) return false;
        const apiClient = routeApi?.client as unknown as TestApi;
        // @ts-expect-error
        return apiClient.sendArgs[0];
    }

    function getRoutingExecution(test: WorkerTestHarness): RoutingExectuion {
        const processor = test.getOperation<RoutedSender>('routed_sender');
        return processor.routingExectuion;
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

    it('can initialize and send to a single route', async () => {
        const opConfig = {
            routing: { '*': 'default' }
        };
        const data = [{ some: 'data' }, { other: 'data' }];
        const test = await makeTest(opConfig);
        const results = await test.runSlice(data);

        expect(results.length).toEqual(2);

        const routing = getRoutingExecution(test);
        const routeData = getRouteData(routing, '*');
        expect(routeData.length).toEqual(2);
    });

    it('can send to multiple route', async () => {
        const opConfig = {
            routing: {
                '*': 'default',
                a: 'other'
            }
        };
        const data = [
            DataEntity.make({ some: 'data' }, { 'standard:route': 'a' }),
            DataEntity.make({ other: 'data' }, { 'standard:route': 'b' })
        ];

        const test = await makeTest(opConfig);
        const results = await test.runSlice(data);

        expect(results.length).toEqual(2);

        const routing = getRoutingExecution(test);

        const routeDataDefault = getRouteData(routing, '*');
        const routeDataA = getRouteData(routing, 'a');

        expect(routeDataDefault.length).toEqual(1);
        expect(routeDataA.length).toEqual(1);
    });
});
