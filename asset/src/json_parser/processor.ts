import { BatchProcessor, DataEntity, parseJSON } from '@terascope/job-components';

export default class JSONParser extends BatchProcessor {
    // @ts-expect-error TODO: fix this type issue
    onBatch(docArray: DataEntity[]) {
        return docArray.reduce<DataEntity[]>((parsedDocs, doc) => {
            try {
                parsedDocs.push(
                    DataEntity.make(
                        parseJSON(doc.getRawData()),
                        doc.getMetadata()
                    )
                );
            } catch (err: unknown) {
                this.rejectRecord(doc.getRawData(), err as Error);
            }

            return parsedDocs;
        }, []);
    }
}
