'use strict';

const { ConvictSchema } = require('@terascope/job-components');

class Schema extends ConvictSchema {
    build() {
        return {
            time_field: {
                doc: 'field name that holds the time value',
                default: '@timestamp',
                format: 'required_String'
            },
            window_timer_setting: {
                doc: 'Sets window timer to clock time or event time',
                default: 'event',
                format: ['event', 'clock']
            },
            window_length: {
                doc: 'Length of time for each window in milliseconds',
                default: 30000,
                format: (value) => {
                    if (!Number.isInteger(value) || value <= 0) {
                        throw new Error('window_size must be an integer greater than 0');
                    }
                }
            },
            window_type: {
                doc: 'Type of window, tumbling or sliding',
                default: 'tumbling',
                format: ['tumbling', 'sliding']
            },
            sliding_window_interval: {
                doc: 'Determines when to start a new sliding window, in milliseconds',
                default: 0,
                format: (value) => {
                    if (!Number.isInteger(value) || value <= 0) {
                        throw new Error('window_size must be an integer greater than 0');
                    }
                }
            },
            event_window_expiration: {
                doc: 'Determines how long to hold event based windows in milliseconds, 0 means no expiration',
                default: 0,
                format: 'Number'
            }
        };
    }
}

module.exports = Schema;
