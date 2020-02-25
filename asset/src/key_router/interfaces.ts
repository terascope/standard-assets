import { OpConfig } from '@terascope/job-components';

export enum CaseOptions {
    preserve = 'preserve',
    lower = 'lower',
    upper = 'upper'
}

export enum FromOptions {
    beginning = 'beginning',
    end = 'end',
}

export interface KeyRouterConfig extends OpConfig {
    use?: number;
    from?: FromOptions;
    case: CaseOptions;
}
