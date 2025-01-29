import { BatchProcessor, DataEntity, parseJSON } from '@terascope/job-components';

export default class JSONParser extends BatchProcessor {
    // @ts-expect-error TODO: fix this type issue
    onBatch(docArray: DataEntity[]) {
        return docArray.reduce<DataEntity[]>((parsedDocs, doc) => {
            try {
                const dataString = Buffer.from(doc.getRawData()).toString('utf8')
                    .trim();

                const toJson = JSON.parse(dataString.replace(/\0/g, ''));

                parsedDocs.push(DataEntity.make(toJson, doc.getMetadata()));
            } catch (err: unknown) {
                this.rejectRecord(doc.getRawData(), err as Error);
            }

            return parsedDocs;
        }, []);
    }
}
