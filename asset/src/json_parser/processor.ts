import { BatchProcessor, DataEntity } from '@terascope/job-components';

export default class JSONParser extends BatchProcessor {
    // @ts-expect-error TODO: fix this type issue
    onBatch(docArray: DataEntity[]) {
        return docArray.reduce<DataEntity[]>((parsedDocs, doc) => {
            try {
                const dataString = Buffer.from(doc.getRawData()).toString('utf8')
                    .trim();

                const toJson = JSON.parse(dataString);

                parsedDocs.push(DataEntity.make(toJson, doc.getMetadata()));
            // TODO: fix this type issue
            } catch (err: any) {
                this.rejectRecord(doc.getRawData(), err.message);
            }

            return parsedDocs;
        }, []);
    }
}
