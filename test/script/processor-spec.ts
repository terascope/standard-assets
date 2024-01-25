import { WorkerTestHarness } from 'teraslice-test-harness';
import { AnyObject } from '@terascope/job-components';
import path from 'node:path';
import { ESLikeData, arrayData, simpleData } from './data';

// scripts don't seem to work
// eslint-disable-next-line jest/no-disabled-tests
xdescribe('script processor', () => {
    let harness: WorkerTestHarness;
    const assetPath = path.join(path.join(__dirname, './test_scripts'));

    async function makeTest(config: AnyObject = {}) {
        const _op = {
            _op: 'script',
        };
        const opConfig = Object.assign({}, _op, config);
        harness = WorkerTestHarness.testProcessor(opConfig);

        await harness.initialize();

        return harness;
    }

    afterEach(async () => {
        if (harness) {
            await harness.shutdown();
        }
    });

    it('script runs when specified via path without asset bundle', async () => {
        const data: any[] = [];

        const test = await makeTest({
            command: `${assetPath}/test_script.py`
        });

        const results = await test.runSlice(data);

        expect(results).toEqual(data);
    });

    it('data out is empty when input is empty', async () => {
        const data: any[] = [];

        const test = await makeTest({
            command: 'test_script.py',
            args: [''],
            options: {},
            asset: 'test_script'
        });

        const results = await test.runSlice(data);

        expect(results).toEqual(data);
    });

    it('optional config items (args and options) do not cause an error', async () => {
        const data: any[] = [];

        const test = await makeTest({
            command: 'test_script.py',
            asset: 'test_script'
        });

        const results = await test.runSlice(data);

        expect(results).toEqual(data);
    });

    it('data out is the same as data in (simple)', async () => {
        const test = await makeTest({
            command: 'test_script.py',
            args: [''],
            options: {},
            asset: 'test_script'
        });

        const results = await test.runSlice(simpleData);

        expect(results).toEqual(simpleData);
    });

    it('data out is the same as data in (arrayLike)', async () => {
        const test = await makeTest({
            command: 'test_script.py',
            args: [''],
            options: {},
            asset: 'test_script'
        });

        const results = await test.runSlice(arrayData);

        expect(results).toEqual(arrayData);
    });

    it('data out is the same as data in (esLike)', async () => {
        const test = await makeTest({
            command: 'test_script.py',
            args: [''],
            options: {},
            asset: 'test_script'
        });

        const results = await test.runSlice(ESLikeData);

        expect(results).toEqual(ESLikeData);
    });

    it('data out size is one less than data in (simple)', async () => {
        const test = await makeTest({
            command: 'test_script_delete_record.py',
            args: [],
            options: {},
            asset: 'test_script'
        });

        const results = await test.runSlice(simpleData.slice());

        expect(results.length).toEqual(simpleData.length - 1);
    });

    it('arguments get passed to script', async () => {
        const test = await makeTest({
            command: 'test_script_delete_record.py',
            args: ['2'],
            options: {},
            asset: 'test_script'
        });

        const results = await test.runSlice(simpleData.slice());

        expect(results.length).toEqual(simpleData.length - 2);
    });

    it('named args get passed to script', async () => {
        const test = await makeTest({
            command: 'test_script_delete_record_options.py',
            args: ['--delete=3'],
            options: {},
            asset: 'test_script'
        });

        const results = await test.runSlice(simpleData.slice());

        expect(results.length).toEqual(simpleData.length - 3);
    });

    it('handles error when script does not exist', async () => {
        expect.hasAssertions();
        const data: any[] = [];

        const test = await makeTest({
            command: 'test_script_x.py',
            args: [''],
            options: {},
            asset: 'test_script'
        });
        try {
            await test.runSlice(data);
        } catch (error: any) {
            expect(error.code).toEqual('ENOENT');
            expect(error.errno).toEqual('ENOENT');
            expect(error.syscall).toEqual(`spawn ${assetPath}/test_script_x.py`);
        }
    });

    it('handles error when script has an error', async () => {
        expect.hasAssertions();
        const data: any[] = [];

        const test = await makeTest({
            command: 'test_script_with_error.py',
            args: [''],
            options: {},
            asset: 'test_script'
        });

        try {
            await test.runSlice(data);
        } catch (error: any) {
            const errorLines = error.toString().split('\n');
            expect(errorLines[0].trim()).toEqual('Traceback (most recent call last):');
            expect(errorLines[1].trim()).toEqual(
                `File "${assetPath}/test_script_with_error.py", line 5, in <module>`
            );
            expect(errorLines[2].trim()).toEqual('json_data = json.loads(json_string)');
            expect(errorLines[3].trim()).toEqual("NameError: name 'json' is not defined");
        }
    });

    it('handles error when script does not have exec permissions', async () => {
        expect.hasAssertions();
        const data: any[] = [];

        const test = await makeTest({
            command: 'test_script_with_no_exec.py',
            args: [''],
            options: {},
            asset: 'test_script'
        });

        try {
            await test.runSlice(data);
        } catch (error: any) {
            expect(error.code).toEqual('ENOENT');
            expect(error.errno).toEqual('ENOENT');
            expect(error.syscall).toEqual(`spawn ${assetPath}/test_script_with_no_exec.py`);
        }
    });
});
