import { BaseSchema } from '@terascope/job-components';

export default class Schema extends BaseSchema<Record<string, any>> {
    build(): Record<string, any> {
        return {
            size: {
                doc: 'size parameter',
                format: 'Number',
                default: 100
            },
        };
    }
}
