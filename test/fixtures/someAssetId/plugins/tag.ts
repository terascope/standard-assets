import { DataEntity } from '@terascope/core-utils';

export default class Tag {
    static cardinality = 'one-to-one';

    constructor(operationConfig: unknown) {
        // @ts-expect-error
        this.operationConfig = operationConfig;
    }

    run(doc: DataEntity): DataEntity {
        doc.wasTagged = true;
        return doc;
    }
}
