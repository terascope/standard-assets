import { ESLikeClient as ES, OpConfig } from '@terascope/types';

export interface SampleExactESPercentConfig extends OpConfig {
    connection: string;
    index: string;
    document_id: string;
    window_ms: number;
}

export interface Client {
    get: (query: ES.GetParams, fullResponse?: boolean) => Promise<ES.GetResponse>;
}
