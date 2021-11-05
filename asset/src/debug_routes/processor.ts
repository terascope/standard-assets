import {
    BatchProcessor,
    DataEntity,
} from '@terascope/job-components';
import { inspect } from 'util';

export default class DebugRoutesProcessor extends BatchProcessor {
    async onBatch(records: DataEntity[]): Promise<DataEntity[]> {
        /**
         * This is a hash map of the router to the record count
        */
        const routes: Record<string, number> = {};

        for (const record of records) {
            const route = record.getMetadata('standard:route') ?? '<unknown>';
            routes[route] ??= 0;
            routes[route]++;
        }

        process.stdout.write(`${inspect(routes)}\n`);

        return records;
    }
}
