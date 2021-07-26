import promClient from 'prom-client';
import { Application, Request, Response } from 'express';
import { JobMetricAPIConfig } from './interfaces';

const express = require('express');

export async function createExporter(
    jobMetricApiConfig: JobMetricAPIConfig
): Promise<Application> {
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

    return metricServer;
}

export async function shutdownExporter(server: { close: () => Application; }): Promise<void> {
    server.close();
}
export async function deleteMetricFromExporter(name: string): Promise<void> {
    promClient.register.removeSingleMetric(name);
}
