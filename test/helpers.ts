import { OpTestHarness } from 'teraslice-test-harness';

export function makeTest(Processor: unknown, Schema: unknown): OpTestHarness {
    return new OpTestHarness({
        Processor: Processor as any,
        Schema: Schema as any,
    });
}
