import path from 'node:path';
import fs from 'node:fs';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'node:url';
import { debugLogger, get } from '@terascope/core-utils';
import { JobTestHarness, newTestJobConfig, DownloadExternalAsset } from 'teraslice-test-harness';
import { JobConfigParams } from '@terascope/types';
import { TestClientConfig } from '@terascope/job-components';
import { ElasticsearchTestHelpers, Client } from '@terascope/opensearch-client';

const {
    makeClient,
    cleanupIndex,
    config: { TEST_INDEX_PREFIX },
} = ElasticsearchTestHelpers;
// @ts-expect-error
import decompress from 'decompress';

const dirname = path.dirname(fileURLToPath(import.meta.url));

jest.setTimeout(30000);

describe('job regression tests', () => {
    const testAssetPath = path.join(dirname, '../fixtures/someAssetId');
    const opPathName = path.join(dirname, '../../asset/');
    const assetDir = [testAssetPath, opPathName];
    const opensearchConnection = 'default';
    const logger = debugLogger('job-spec');
    const apiSendIndex = `${TEST_INDEX_PREFIX}_send_api_`;

    let harness: JobTestHarness;
    let clients: TestClientConfig[];
    let esClient: Client;

    async function makeTest(
        jobConfig: Partial<JobConfigParams>,
    ): Promise<JobTestHarness> {
        const job = newTestJobConfig(jobConfig);

        harness = new JobTestHarness(job, { assetDir, clients });

        await harness.initialize();

        return harness;
    }

    beforeAll(async () => {
        const assetDownloader = new DownloadExternalAsset(true);

        await assetDownloader.downloadExternalAsset(
            'terascope/elasticsearch-assets',
        );

        const pattern = path.join(
            path.resolve('./test/.cache'),
            'downloads',
            'elasticsearch-v*-bundle.zip',
        );
        const matchingAssets = await Array.fromAsync(fs.promises.glob(pattern));
        const elasticsearchAssetPath = path.join(
            path.resolve('./test/.cache'),
            'downloads',
        );

        await decompress(matchingAssets[0], elasticsearchAssetPath);

        assetDir.push(elasticsearchAssetPath);

        esClient = await makeClient();

        clients = [
            {
                type: 'elasticsearch-next',
                endpoint: 'default',
                createClient: async () => ({
                    client: esClient,
                    logger,
                }),
            },
        ];
    });

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    afterAll(async () => {
        await cleanupIndex(esClient, `${apiSendIndex}*`);
    });

    it('can dynamically route using routed_sender with kafka apis', async () => {
        const recordCount = 2000;
        const test = await makeTest({
            apis: [
                {
                    _name: 'elasticsearch_sender_api',
                    index: apiSendIndex,
                },
            ],
            operations: [
                {
                    _op: 'data_generator',
                    size: recordCount,
                },
                {
                    _op: 'set_key',
                    field: 'uuid',
                },
                {
                    _op: 'hash_router',
                    fields: ['uuid'],
                    partitions: 5,
                },
                {
                    _op: 'routed_sender',
                    _api_name: 'elasticsearch_sender_api',
                    size: 100,
                    concurrency: 5,
                    routing: {
                        '**': opensearchConnection,
                    },
                },
            ],
        });

        await test.runToCompletion();

        await esClient.indices.refresh({ index: `${apiSendIndex}*` });

        const fetchResults = await esClient.search({
            index: `${apiSendIndex}*`,
            size: recordCount,
        });
        const count = get(fetchResults, 'hits.total.value', null);

        expect(count).toEqual(recordCount);
    });
});
