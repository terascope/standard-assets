import { OpConfig } from '@terascope/job-components';

export interface DataArray {
    _key: string
}

export interface JobMetricExampleConfig extends OpConfig {
    type: string;
}
