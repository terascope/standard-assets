
import { OpConfig } from '@terascope/job-components';

export enum TimeSetting {
    event = 'event',
    clock = 'clock'
}

export enum WindowType {
    tumbling = 'tumbling',
    sliding = 'sliding'
}

export interface WindowConfig extends OpConfig {
    time_field: string;
    window_time_setting: TimeSetting;
    window_length: number;
    window_type: WindowType;
    sliding_window_interval: number;
    event_window_expiration: number;
}
