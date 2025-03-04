import { OpConfig } from '@terascope/types';
import { WatcherConfig } from 'ts-transforms';

export enum NotifyType {
    matcher = 'matcher', extraction = 'extraction'
}

export interface PhaseConfig extends WatcherConfig, OpConfig {
    plugins?: string[];
}

export interface SelectorTypes {
    [field: string]: string;
}
