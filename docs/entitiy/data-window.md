## DataWindow

A data window is a type of [data-entity](https://terascope.github.io/teraslice/docs/packages/utils/api/classes/dataentity) with the same basic functions and metadata, but holds an array of data enitities on the dataArray property instead of encapsulating a single object.  This is also experimental and could be subject to change.


```javascript
const data = [{ id: 1 }, { id: 2 }, { id: 3 }];

// DataWindow.make will convert an array of objects to an array of data-entities, uses DataEntity.makeArray() under the hood
const dataWindow = DataWindow.make('someKey', data);

// resuling data-window:
{ dataArray: [{ id: 1 }, { id: 2 }, { id: 3 }] }

// DataWindow.make also accepts a single object and creates the internal data array or appends it to the internal data array
const dataWindow = DataWindow.make('someKey', { id: 1 });

// add object to dataArray
dataWindow.set({ id: 4 });

// result:
{ dataArray: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }] }

// retrieve data-entity by position in dataArray
dataWindow.get(1)
// returns
{ id: 2 }

// or retrieve dataArray index number of held data-entity
dataWindow.get({ id: 3 }];
// returns
2

// convert dataArray to an array
dataWindow.asArray() === [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]

// resuling data-window:
{ dataArray: [{ id: 1 }]}

// all data-entity functions are valid data-window functions for example:
dataWindow.getKey();
// returns
'someKey'

```
