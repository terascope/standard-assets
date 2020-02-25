import { OpConfig } from '@terascope/job-components';

export interface HashRouterConfig extends OpConfig {
    fields: string[];
    buckets: number;
}
