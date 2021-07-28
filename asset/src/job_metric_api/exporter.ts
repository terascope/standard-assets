import promClient from 'prom-client';
import { Request, Response } from 'express';
import { JobMetricAPIConfig } from './interfaces';

const express = require('express');

export type CloseExporter = () => void;

export async function createExporter(
    jobMetricApiConfig: JobMetricAPIConfig
): Promise<CloseExporter> {
    if (jobMetricApiConfig.default_metrics) {
        promClient.collectDefaultMetrics();
    }

    const app = express();
    app.get('/', async (_req: Request, res: Response) => {
        res.status(404).send('See the \'/metrics\' endpoint for the teraslice job metric exporter\n');
    });

    app.get('/metrics', async (_req: Request, res: Response) => {
        res.set('Content-Type', promClient.register.contentType);
        res.end(await promClient.register.metrics());
    });
    const metricServer = app.listen(jobMetricApiConfig.port);

    return function close(): void {
        metricServer.close();
    };
}

export async function shutdownExporter(close: CloseExporter): Promise<void> {
    close();
}
export async function deleteMetricFromExporter(name: string): Promise<void> {
    promClient.register.removeSingleMetric(name);
}
