import { jest } from '@jest/globals';
import 'jest-extended';
import fs from 'node:fs';
import path from 'node:path';
import { ElasticsearchTestHelpers, Client } from '@terascope/opensearch-client';
import TerasliceClient, { Job } from 'teraslice-client-js';
import { DownloadExternalAsset } from 'teraslice-test-harness';
import { ASSET_ZIP_PATH, TERASLICE_HOST } from './config';
import { pDelay } from '@terascope/core-utils';

describe('Standard Assets e2e', () => {
    jest.setTimeout(60 * 1000);

    let terasliceClient: TerasliceClient;
    let searchClient: Client;

    beforeAll(async () => {
        terasliceClient = new TerasliceClient({ host: TERASLICE_HOST });
        searchClient = await ElasticsearchTestHelpers.makeClient();
    });

    describe('asset upload', () => {
        it('should upload the asset bundle', async () => {
            const result = await terasliceClient.assets.upload(
                fs.createReadStream(ASSET_ZIP_PATH)
            );

            expect(result.asset_id).toBeDefined();
        });

        it('should be discoverable on the cluster after upload', async () => {
            const records = await terasliceClient.assets.getAsset('standard');
            expect(records).not.toBeEmpty();
            expect(records[0].name).toBe('standard');
        });
    });

    describe('data_generator → drop_field -> routed_sender', () => {
        let job: Job;

        beforeAll(async () => {
            const assetDownloader = new DownloadExternalAsset(true);
            await assetDownloader.downloadExternalAsset('terascope/elasticsearch-assets');

            const pattern = path.join(path.resolve('./test/.cache'), 'downloads', 'elasticsearch-v*-bundle.zip');
            const matchingAssets = await Array.fromAsync(fs.promises.glob(pattern));
            await terasliceClient.assets.upload(
                fs.createReadStream(matchingAssets[0])
            );
            job = await terasliceClient.jobs.submit({
                name: 'e2e-standard-pipeline',
                lifecycle: 'once',
                workers: 1,
                assets: ['standard', 'elasticsearch'],
                operations: [
                    {
                        _op: 'data_generator',
                        size: 800,
                    },
                    {
                        _op: 'add_key',
                        key_name: '_key',
                        minimum_field_count: 1
                    },
                    {
                        _op: 'drop_field',
                        field: 'userAgent'
                    },
                    {
                        _op: 'key_router',
                        use: 1,
                        from: 'beginning',
                        case: 'lower'
                    },
                    {
                        _op: 'routed_sender',
                        _api_name: 'elasticsearch_sender_api',
                        size: 200,
                        routing: {
                            '**': 'default'
                        }
                    }
                ],
                apis: [
                    {
                        _name: 'elasticsearch_sender_api',
                        index: 'dynamic_routing'
                    }
                ]
            });

            await job.waitForStatus('running');
            await job.waitForStatus('completed');
        });

        it('should be able to successfully process slices', async () => {
            const ex = await job.execution();

            expect(ex._slicer_stats).toBeDefined();
            expect(ex._slicer_stats.processed).toBe(4);
            expect(ex._slicer_stats.failed).toBe(0);
        });

        it('should have an index for each key', async () => {
            const indicesResponse = await searchClient.cat.indices({ index: 'dynamic_routing-*' });
            const indices = (indicesResponse as unknown as string).split('\n').filter((str) => str !== '');
            expect(indices.length).toBe(38);
        });

        it('should have added _key field and dropped userAgent field', async () => {
            let record;
            let attempts = 0;

            // retry search until index is populated or 5 attempts reached
            do {
                attempts++;
                record = await searchClient.search(({ index: 'dynamic_routing-a', size: 1 }));
                await pDelay(500);
            } while (record.hits.hits.length < 1 && attempts < 5);

            expect(record.hits.hits[0]._source).toBeDefined();
            expect(record.hits.hits[0]._source).toContainKey('_key');
            expect(record.hits.hits[0]._source).not.toContainKey('userAgent');
        });
    });
});
