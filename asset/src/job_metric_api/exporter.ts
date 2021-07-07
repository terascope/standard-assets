import promClient from 'prom-client';
import { JobMetricAPIConfig } from './interfaces';

const express = require('express');

export default async function createExporter(
    jobMetricApiConfig: JobMetricAPIConfig
): Promise<void> {
    if (jobMetricApiConfig.default_metrics) {
        promClient.collectDefaultMetrics();
    }

    const metricServer = express();

    metricServer.get('/', (_req: any, res: { send: (arg0: string) => void; }) => {
        res.send('See the \'/metrics\' endpoint for the teraslice job metric exporter\n');
    });

    metricServer.get('/metrics', async (_req: any, res: { set: (arg0: string, arg1: string) => void; end: (arg0: string) => void; }) => {
        res.set('Content-Type', promClient.register.contentType);
        res.end(await promClient.register.metrics());
    });
    metricServer.listen(jobMetricApiConfig.port);
}
