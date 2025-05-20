export interface FakeData {
    _key: number;
    name: string;
    age: string;
}

export function makeData(n: number): FakeData[] {
    const bunchesOData = [];

    for (let i = 0; i < n; i++) {
        bunchesOData.push({
            _key: i,
            name: 'name',
            age: 'age'
        });
    }

    return bunchesOData;
}
