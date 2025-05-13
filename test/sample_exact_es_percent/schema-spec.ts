import { WorkerTestHarness } from 'teraslice-test-harness';
import { debugLogger, OpConfig, TestClientConfig } from '@terascope/job-components';

describe('sample_exact_es_percent schema', () => {
    let harness: WorkerTestHarness;
    const name = 'sample_exact_es_percent';
    const logger = debugLogger('test-logger');

    const clients: TestClientConfig[] = [
        {
            type: 'elasticsearch-next',
            endpoint: 'default',
            createClient: async () => ({
                client: {
                    get: () => {
                        return { _source: { percent: '50' }, found: true };
                    }
                },
                logger
            }),
        },
    ];

    async function makeSchema(config: Record<string, any> = {}): Promise<OpConfig> {
        const opConfig = Object.assign({}, { _op: name }, config);

        harness = WorkerTestHarness.testProcessor(opConfig, { clients });

        await harness.initialize();

        const validConfig = harness.executionContext.config.operations.find(
            (testConfig) => testConfig._op === name
        );

        return validConfig as OpConfig;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('should expect to be properly configured', async () => {
        await expect(makeSchema({})).toReject();

        // test connection config
        // These actually fail on job config because the
        // connection doesn't exist, not on schema validation
        await expect(makeSchema({ connection: 1234, index: 'my-index', document_id: 'abc123' })).rejects
            .toThrow('Validation failed for job config');
        await expect(makeSchema({ connection: ['some stuff'], index: 'my-index', document_id: 'abc123' })).rejects
            .toThrow('Validation failed for job config');
        await expect(makeSchema({ connection: {}, index: 'my-index', document_id: 'abc123' })).rejects
            .toThrow('Validation failed for job config');

        // test index config
        await expect(makeSchema({ index: 1234, document_id: 'abc123' })).rejects
            .toThrow('index: must be of type string: value was 1234');
        await expect(makeSchema({ index: ['some stuff'], document_id: 'abc123' })).rejects
            .toThrow('index: must be of type string: value was ["some stuff"]');
        await expect(makeSchema({ index: {}, document_id: 'abc123' })).rejects
            .toThrow('index: must be of type string: value was {}');
        await expect(makeSchema({ index: null, document_id: 'abc123' })).rejects
            .toThrow('index: must be of type string');
        await expect(makeSchema({ index: '', document_id: 'abc123' })).rejects
            .toThrow('index: must not be an empty string');
        await expect(makeSchema({ index: 'ContainsUpperCase', document_id: 'abc123' })).rejects
            .toThrow('index: must be lowercase: value was "ContainsUpperCase"');

        // // test document_id config
        await expect(makeSchema({ document_id: 1234, index: 'my-index' })).rejects
            .toThrow('document_id: must be a non-empty string: value was 1234');
        await expect(makeSchema({ document_id: ['some stuff'], index: 'my-index' })).rejects
            .toThrow('document_id: must be a non-empty string: value was ["some stuff"]');
        await expect(makeSchema({ document_id: {}, index: 'my-index' })).rejects
            .toThrow('document_id: must be a non-empty string: value was {}');
        await expect(makeSchema({ document_id: null, index: 'my-index' })).rejects
            .toThrow('document_id: must be a non-empty string');
        await expect(makeSchema({ document_id: '', index: 'my-index' })).rejects
            .toThrow('document_id: must be a non-empty string');

        // // test window_ms config
        await expect(makeSchema({ window_ms: 'string', index: 'my-index', document_id: 'abc123' })).rejects
            .toThrow('window_ms: must be a number between 100 and 3,600,000 milliseconds (1 hour).');
        await expect(makeSchema({ window_ms: ['some stuff'], index: 'my-index', document_id: 'abc123' })).rejects
            .toThrow('window_ms: must be a number between 100 and 3,600,000 milliseconds (1 hour).: value was ["some stuff"]');
        await expect(makeSchema({ window_ms: {}, index: 'my-index', document_id: 'abc123' })).rejects
            .toThrow('window_ms: must be a number between 100 and 3,600,000 milliseconds (1 hour).: value was {}');
        await expect(makeSchema({ window_ms: 99, index: 'my-index', document_id: 'abc123' })).rejects
            .toThrow('window_ms: must be a number between 100 and 3,600,000 milliseconds (1 hour).: value was 99');
        await expect(makeSchema({ window_ms: 3600001, index: 'my-index', document_id: 'abc123' })).rejects
            .toThrow('window_ms: must be a number between 100 and 3,600,000 milliseconds (1 hour).: value was 3600001');

        await expect(makeSchema({ connection: 'default', index: 'my-index', document_id: 'abc123', window_ms: 10000 })).toResolve();
    });
});
