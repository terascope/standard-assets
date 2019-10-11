
import { DataEntity } from '@terascope/job-components';

export default class Tag {
    static cardinality = 'one-to-one';

    constructor(operationConfig: any) {
        // @ts-ignore
        this.operationConfig = operationConfig;
    }

    run(doc: DataEntity) {
        doc.wasTagged = true;
        return doc;
    }
}
