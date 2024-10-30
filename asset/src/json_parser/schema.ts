import { ConvictSchema, OpConfig } from '@terascope/job-components';

export default class Schema extends ConvictSchema<OpConfig> {
    build() {
        return {
            // maybe document its an inbuilt setting?
            _dead_letter_action: {
                doc: 'action to take if a doc can not be transformed to JSON; accepts none, throw, log, or an api name',
                default: 'log',
                value: 'required_String'
            }
        };
    }
}
