import { ConvictSchema, OpConfig } from '@terascope/job-components';

// TODO: check check if api name is real and available
export default class Schema extends ConvictSchema<OpConfig> {
    build() {
        return {
            // maybe document its an inbuilt setting?
            _dead_letter_action: {
                doc: 'Dead letter action if the incoming buffer cannot be parsed to JSON, defaults to log',
                default: 'log',
                value: 'required_String'
            }
        };
    }
}
