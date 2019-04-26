'use strict';

const _ = require('lodash');

module.exports = {
    sortFunction: (field, order) => {
        const sortDescending = (a, b) => {
            if (_.get(a, field) === _.get(b, field)) return 0;
            return (_.get(a, field) < _.get(b, field) ? 1 : -1);
        };

        // Default to ascending
        let sort = (a, b) => {
            if (_.get(a, field) === _.get(b, field)) return 0;
            return (_.get(a, field) > _.get(b, field) ? 1 : -1);
        };

        if (order === 'desc') sort = sortDescending;

        return sort;
    }
};
