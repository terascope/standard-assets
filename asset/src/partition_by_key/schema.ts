import { ConvictSchema } from '@terascope/job-components';
import { PartionByKeyConfig } from './interfaces';

export default class Schema extends ConvictSchema<PartionByKeyConfig> {
    build() {
        return {};
    }
}
