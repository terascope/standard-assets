'use strict';

const { DataEntity } = require('@terascope/utils');
const DataWindow = require('../asset/__lib/data-window');


const joe = DataEntity.make({
    date: new Date(),
    name: 'bob'
});

const bob = {
    date: new Date(),
    name: 'joe'
};

const newArray = [
    {
        date: new Date(),
        name: 'bob'
    },
    {
        date: new Date(),
        name: 'joe'
    }
];


const newWindow = DataWindow.make('key', newArray);
console.log(newWindow);

// const dataWindow = DataWindow.makeWindow('1', [joe, bob]);
// console.log(dataWindow);
