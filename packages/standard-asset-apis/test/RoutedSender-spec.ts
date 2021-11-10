import { DataEntity, pDelay, RouteSenderAPI } from '@terascope/utils';
import 'jest-extended';
import {
    RoutedSender
} from '../src';

describe('RoutedSender', () => {
    it('should be able to route records', async () => {
        const send = jest.fn();
        const verify = jest.fn();

        const sender = new RoutedSender({
            '**': 'default'
        }, {
            batchSize: 10,
            async createRouteSenderAPI(route, connection) {
                if (route !== '**') {
                    throw new Error('Expected route to equal "**"');
                }
                if (connection !== 'default') {
                    throw new Error('Expected connection to equal "default"');
                }
                await pDelay(10);
                return { send, verify } as RouteSenderAPI;
            },
            rejectRecord(record, error) {
                throw error;
            }
        });

        await sender.route([
            new DataEntity({ foo: 1 }, { 'standard:route': 'foo1' }),
            new DataEntity({ foo: 2 }, { 'standard:route': 'foo2' }),
        ]);
        expect(sender.queuedRecordCount).toBe(2);
        expect(sender.hasQueuedRecords).toBeTrue();

        await sender.send();

        expect(sender.queuedRecordCount).toBe(0);
        expect(sender.hasQueuedRecords).toBeFalse();

        expect(send).toHaveBeenCalledTimes(1);
        expect(verify).toHaveBeenCalledTimes(2);
        expect(verify).toHaveBeenNthCalledWith(1, 'foo1');
        expect(verify).toHaveBeenNthCalledWith(2, 'foo2');
    });

    it('should be able to route records in multiple batches', async () => {
        const send = jest.fn();
        const verify = jest.fn();

        const sender = new RoutedSender({
            '**': 'default'
        }, {
            batchSize: 2,
            async createRouteSenderAPI(route, connection) {
                if (route !== '**') {
                    throw new Error('Expected route to equal "**"');
                }
                if (connection !== 'default') {
                    throw new Error('Expected connection to equal "default"');
                }
                await pDelay(10);
                return { send, verify } as RouteSenderAPI;
            },
            rejectRecord(record, error) {
                throw error;
            }
        });

        await sender.route([
            new DataEntity({ foo: 1 }, { 'standard:route': 'foo1' }),
            new DataEntity({ foo: 2 }, { 'standard:route': 'foo2' }),
            new DataEntity({ foo: 3 }, { 'standard:route': 'foo1' }),
            new DataEntity({ foo: 4 }, { 'standard:route': 'foo2' }),
        ]);
        expect(sender.queuedRecordCount).toBe(4);
        expect(sender.hasQueuedRecords).toBeTrue();

        await sender.send();

        expect(sender.queuedRecordCount).toBe(0);
        expect(sender.hasQueuedRecords).toBeFalse();

        expect(send).toHaveBeenCalledTimes(2);
        expect(verify).toHaveBeenCalledTimes(2);
        expect(verify).toHaveBeenNthCalledWith(1, 'foo1');
        expect(verify).toHaveBeenNthCalledWith(2, 'foo2');
    });

    it('should be able to route records in multiple batches with a minPerBatch set to 2', async () => {
        const send = jest.fn();
        const verify = jest.fn();

        const sender = new RoutedSender({
            '**': 'default'
        }, {
            batchSize: 2,
            async createRouteSenderAPI(route, connection) {
                if (route !== '**') {
                    throw new Error('Expected route to equal "**"');
                }
                if (connection !== 'default') {
                    throw new Error('Expected connection to equal "default"');
                }
                await pDelay(10);
                return { send, verify } as RouteSenderAPI;
            },
            rejectRecord(record, error) {
                throw error;
            }
        });

        await sender.route([
            new DataEntity({ foo: 1 }, { 'standard:route': 'foo1' }),
            new DataEntity({ foo: 2 }, { 'standard:route': 'foo2' }),
        ]);
        expect(sender.queuedRecordCount).toBe(2);
        expect(sender.hasQueuedRecords).toBeTrue();

        await sender.send(2);

        expect(sender.queuedRecordCount).toBe(2);
        expect(sender.hasQueuedRecords).toBeTrue();

        await sender.route([
            new DataEntity({ foo: 3 }, { 'standard:route': 'foo1' }),
            new DataEntity({ foo: 4 }, { 'standard:route': 'foo2' }),
        ]);

        expect(sender.queuedRecordCount).toBe(4);
        expect(sender.hasQueuedRecords).toBeTrue();

        await sender.send();

        expect(sender.queuedRecordCount).toBe(0);
        expect(sender.hasQueuedRecords).toBeFalse();

        expect(send).toHaveBeenCalledTimes(2);
        expect(verify).toHaveBeenCalledTimes(2);
        expect(verify).toHaveBeenNthCalledWith(1, 'foo1');
        expect(verify).toHaveBeenNthCalledWith(2, 'foo2');
    });

    it('should be able to route records to multiple backends in multiple batches', async () => {
        const send = jest.fn();
        const verify = jest.fn();

        const sender = new RoutedSender({
            'foo1,foo2': 'foo',
            bar: 'bar',
            '*': 'default'
        }, {
            batchSize: 2,
            async createRouteSenderAPI(route, connection) {
                if (route === 'foo1' || route === 'foo2') {
                    if (connection !== 'foo') {
                        throw new Error(`Expected connection to equal "foo" for route "${route}"`);
                    }
                } else if (route === 'bar') {
                    if (connection !== 'bar') {
                        throw new Error(`Expected connection to equal "bar" for route "${route}"`);
                    }
                } else if (route === '*') {
                    if (connection !== 'default') {
                        throw new Error(`Expected connection to equal "default" for route "${route}"`);
                    }
                } else {
                    throw new Error(`Invalid combination of route:${route} connection:${connection}`);
                }
                await pDelay(10);
                return { send, verify } as RouteSenderAPI;
            },
            rejectRecord(record, error) {
                throw error;
            }
        });

        await sender.route([
            new DataEntity({ foo: 1 }, { 'standard:route': 'foo1' }),
            new DataEntity({ bar: 2 }, { 'standard:route': 'bar' }),
            new DataEntity({ foobar: 1 }, { 'standard:route': 'foobar' }),
            new DataEntity({ foo: 2 }, { 'standard:route': 'foo2' }),
            new DataEntity({ foobar: 2 }, { 'standard:route': 'foobar' }),
            new DataEntity({ foo: 3 }, { 'standard:route': 'foo1' }),
            new DataEntity({ bar: 1 }, { 'standard:route': 'bar' }),
        ]);

        expect(sender.queuedRecordCount).toBe(7);
        expect(sender.hasQueuedRecords).toBeTrue();

        await sender.send();

        expect(sender.queuedRecordCount).toBe(0);
        expect(sender.hasQueuedRecords).toBeFalse();

        expect(send).toHaveBeenCalledTimes(4);
        expect(verify).toHaveBeenCalledTimes(0);
    });

    it('should be able to use the hooks', async () => {
        const send = jest.fn();
        const verify = jest.fn();

        const batchStartHook = jest.fn();
        const batchEndHook = jest.fn();
        const dataRouteHook = jest.fn();
        const storageRouteHook = jest.fn();

        const sender = new RoutedSender({
            '**': 'default'
        }, {
            batchSize: 2,
            storageRouteHook,
            dataRouteHook,
            batchStartHook,
            batchEndHook,
            async createRouteSenderAPI(route, connection) {
                if (route !== '**') {
                    throw new Error('Expected route to equal "**"');
                }
                if (connection !== 'default') {
                    throw new Error('Expected connection to equal "default"');
                }
                await pDelay(10);
                return { send, verify } as RouteSenderAPI;
            },
            rejectRecord(record, error) {
                throw error;
            }
        });

        await sender.route([
            new DataEntity({ foo: 1 }, { 'standard:route': 'foo1' }),
            new DataEntity({ foo: 2 }, { 'standard:route': 'foo2' }),
            new DataEntity({ foo: 3 }, { 'standard:route': 'foo1' }),
            new DataEntity({ foo: 4 }, { 'standard:route': 'foo2' }),
        ]);

        expect(sender.queuedRecordCount).toBe(4);
        expect(sender.hasQueuedRecords).toBeTrue();

        await sender.send();

        expect(sender.queuedRecordCount).toBe(0);
        expect(sender.hasQueuedRecords).toBeFalse();

        expect(send).toHaveBeenCalledTimes(2);

        expect(verify).toHaveBeenCalledTimes(2);
        expect(verify).toHaveBeenNthCalledWith(1, 'foo1');
        expect(verify).toHaveBeenNthCalledWith(2, 'foo2');

        expect(batchStartHook).toHaveBeenCalledTimes(2);
        expect(batchStartHook).toHaveBeenNthCalledWith(1, 1, '**', 2);
        expect(batchStartHook).toHaveBeenNthCalledWith(2, 2, '**', 2);

        expect(batchEndHook).toHaveBeenCalledTimes(2);
        expect(batchEndHook).toHaveBeenNthCalledWith(1, 1, '**');
        expect(batchEndHook).toHaveBeenNthCalledWith(2, 2, '**');

        expect(dataRouteHook).toHaveBeenCalledTimes(4);
        expect(storageRouteHook).toHaveBeenCalledTimes(4);
    });
});
