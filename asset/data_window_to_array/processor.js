'use strict';

const { BatchProcessor } = require('@terascope/job-components');

class DataWindowToArray extends BatchProcessor {
    onBatch(dataArray) {
        return dataArray.reduce((allDocs, window) => {
            window.asArray().forEach(doc => allDocs.push(doc));
            return allDocs;
        }, []);
    }
}

module.exports = DataWindowToArray;
