import { BatchProcessor, DataEntity } from '@terascope/job-components';

/**
   Expects an array of data entities and attempts to transform the buffer data to json
   Uses the _dead_letter_queue options to handle parsing errors which are none (ignore), log, throw
   or sends bad docs to a kafka topic specified in the api property of the job.

   see https://terascope.github.io/teraslice/docs/jobs/dead-letter-queue#docsNav
   and https://github.com/terascope/kafka-assets/blob/master/docs/apis/kafka_dead_letter.md for dead letter queue details
 */

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
