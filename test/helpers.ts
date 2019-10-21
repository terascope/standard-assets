import { OpTestHarness } from 'teraslice-test-harness';

export function makeTest(Processor: any, Schema: any): OpTestHarness {
    // @ts-ignore
    return new OpTestHarness({ Processor, Schema });
}
