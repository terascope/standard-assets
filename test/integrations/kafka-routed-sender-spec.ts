import path from 'node:path';
import fs from 'node:fs';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'node:url';
import { debugLogger, times } from '@terascope/core-utils';
import { JobTestHarness, newTestJobConfig, DownloadExternalAsset } from 'teraslice-test-harness';
import { JobConfigParams, Logger } from '@terascope/types';
import { TestClientConfig } from '@terascope/job-components';
import {
    createClient as createKafkaClient, makeAdminClient, KafkaAdminResult,
} from 'terafoundation_kafka_connector';
// @ts-expect-error
import decompress from 'decompress';

const dirname = path.dirname(fileURLToPath(import.meta.url));

jest.setTimeout(30000);

describe('job regression tests', () => {
    const testAssetPath = path.join(dirname, '../fixtures/someAssetId');
    const opPathName = path.join(dirname, '../../asset/');
    const assetDir = [testAssetPath, opPathName];
    const kafkaConnection = 'default';
    const logger = debugLogger('job-spec');
    const kafkaTopicName = 'ts-v3-8-0-nodev24-15-0-1778091897172-test3-datagen';

    const topicList = times(5, (i) => `${kafkaTopicName}-${i}`);

    let harness: JobTestHarness;
    let kafkaAssetPath = '';

    // kafka should be in charge of this but does not export this
    const {
        KAFKA_HOSTNAME = 'localhost',
        KAFKA_PORT = '49094',
        KAFKA_BROKER,
        KAFKA_BROKERS = KAFKA_BROKER ?? `${KAFKA_HOSTNAME}:${KAFKA_PORT}`,
        ENCRYPT_KAFKA,
        CERT_PATH = '',
    } = process.env;

    const kafkaBrokers: string[] = KAFKA_BROKERS.split(',').map((s) => s.trim());
    const encryptKafka = ENCRYPT_KAFKA === 'true';

    const connectorConfig = {
        brokers: kafkaBrokers,
        ...(encryptKafka
            ? {
                security_protocol: 'ssl' as const,
                ssl_ca_location: path.join(CERT_PATH, 'CAs/rootCA.pem'),
                ssl_certificate_location: path.join(CERT_PATH, 'kafka-keypair.pem'),
                ssl_key_location: path.join(CERT_PATH, 'kafka-keypair.pem'),
            }
            : {})
    };

    const clientConfig: TestClientConfig = {
        type: 'kafka',
        config: {
            ...connectorConfig
        },
        async createClient(config: any, loggerInput: Logger, settings: any) {
            return createKafkaClient(config, loggerInput, settings);
        }
    };

    let adminClient: KafkaAdminResult['client'];

    const clients = [clientConfig];

    let consumerClient: any;

    async function getOffset(
        topic: string, partition: number
    ): Promise<{ lowOffset: number; highOffset: number }> {
        return new Promise((resolve, reject) => {
            consumerClient.queryWatermarkOffsets(
                topic,
                partition,
                10000,
                (err: any, offsets: any) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(offsets);
                });
        });
    }

    beforeAll(async () => {
        const assetDownloader = new DownloadExternalAsset(true);

        await assetDownloader.downloadExternalAsset('terascope/kafka-assets');

        const pattern = path.join(path.resolve('./test/.cache'), 'downloads', 'kafka-v*-bundle.zip');
        const matchingAssets = await Array.fromAsync(fs.promises.glob(pattern));
        kafkaAssetPath = path.join(path.resolve('./test/.cache'), 'downloads');

        await decompress(matchingAssets[0], kafkaAssetPath);

        assetDir.push(kafkaAssetPath);

        const config = {
            type: 'kafka',
            endpoint: 'default',
            brokers: kafkaBrokers,
            rdkafka_options: {
                'log.connection.close': false,
                'socket.timeout.ms': 10000,
                'metadata.request.timeout.ms': 15000,
                'socket.connection.setup.timeout.ms': 10000,
            }
        } as any;
        const { client } = await makeAdminClient(config, logger);

        adminClient = client;

        const consumerConfig = {
            ...config,
            options: {
                type: 'consumer',
                group: 'test-group',
            }
        };

        const stuff = await createKafkaClient(consumerConfig, logger, { options: { type: 'consumer', group: 'test-group' } });
        consumerClient = stuff.client;
        // await connectClient(consumerClient);

        await Promise.all(topicList.map(
            (topic) => {
                return new Promise<void>((resolve, reject) => {
                    adminClient.createTopic(
                        { topic, num_partitions: 1, replication_factor: 1 },
                        (err: any) => {
                            if (err) {
                                reject(err);
                            } else resolve();
                        });
                });
            }
        )
        );
    });

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    async function makeTest(jobConfig: Partial<JobConfigParams>): Promise<JobTestHarness> {
        const job = newTestJobConfig(jobConfig);

        harness = new JobTestHarness(job, { assetDir, clients });

        await harness.initialize();

        return harness;
    }

    it('can dynamically route using routed_sender with kafka apis', async () => {
        const recordCount = 2000;
        const test = await makeTest({
            apis: [
                {
                    _name: 'kafka_sender_api',
                    create: true,
                    topic: kafkaTopicName,
                    rdkafka_options: {
                        'allow.auto.create.topics': false,
                    },
                    _connection: kafkaConnection,
                    size: 10000
                }
            ],
            operations: [
                {
                    _op: 'data_generator',
                    size: recordCount
                },
                {
                    _op: 'set_key',
                    field: 'uuid',
                    topic: kafkaTopicName
                },
                {
                    _op: 'hash_router',
                    fields: [
                        'uuid'
                    ],
                    partitions: 5
                },
                {
                    _op: 'routed_sender',
                    _api_name: 'kafka_sender_api',
                    size: 100,
                    concurrency: 5,
                    routing: {
                        '**': kafkaConnection
                    }
                }
            ],
        });

        await test.runToCompletion();

        const topicResults = await Promise.all(
            topicList.map((topic) => getOffset(topic, 0))
        );

        const foundCount = topicResults.reduce<number>((acc: number, offsets: any) => {
            const high = offsets.highOffset;
            const low = offsets.lowOffset;
            return acc + (high - low);
        }, 0);

        expect(foundCount).toEqual(recordCount);
    });
});
