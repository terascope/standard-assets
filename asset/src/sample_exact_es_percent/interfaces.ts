import { OpConfig } from '@terascope/types';

export interface SampleExactESPercentConfig extends OpConfig {
    connection: string;
    index: string;
    document_id: string;
    window_ms: number;
}
