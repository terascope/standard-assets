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
            time_type: {
                doc: 'Determins if window is based on clock time or event time',
                default: 'event',
                format: ['event', 'clock']
            },
            window_size: {
                doc: 'Size of time window in milliseconds',
                default: 30000,
                format: (value) => {
                    if (!Number.isInteger(value) || value <= 0) {
                        throw new Error('window_size must be an integer greater than 0');
                    }
                }
            },
            window_type: {
                doc: 'Type of window',
                default: 'tumbling',
                format: ['tumbling', 'sliding']
            },
            sliding_window_interval: {
                doc: 'Determines when to start a new window',
                default: 15000,
                format: (value) => {
                    if (!Number.isInteger(value) || value <= 0) {
                        throw new Error('window_size must be an integer greater than 0');
                    }
                }
            },
            event_window_expiration: {
                doc: 'Determines how long to hold event based windows if a pause to incoming data, 0 means no expiration',
                default: 0,
                format: 'Number'
            }
        };
    }
}

module.exports = Schema;
