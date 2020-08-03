## DataWindow

A data window is a special type of [data-entites](https://terascope.github.io/teraslice/docs/packages/utils/api/classes/dataentity) that contains a key `dataArray` which holds and array of more data-entites. Used to contain lists of sorts



```javascript
const data = [{ id: 1 }, { id: 2 }, { id: 3 }];

const dataWindow = DataWindow.make('someKey', data);

dataWindow.getKey() === 'someKey';

// data inside dataArray are now also data-entities
dataWindow === { dataArray: [{ id: 1 }, { id: 2 }, { id: 3 }] }

dataWindow.set({ id: 4 });

dataWindow === { dataArray: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }] }

dataWindow.get(1) === { id: 2 }

dataWindow.asArray() === [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]

```
