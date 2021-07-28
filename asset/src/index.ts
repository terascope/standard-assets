import Accumulate from '../src/accumulate/processor';
import AccumulateSchema from '../src/accumulate/schema';

import AccumulateByKey from '../src/accumulate_by_key/processor';
import AccumulateByKeySchema from '../src/accumulate_by_key/schema';

import DataGeneratorFetcher from '../src/data_generator/fetcher';
import DataGeneratorSchema from '../src/data_generator/schema';
import DataGeneratorSlicer from '../src/data_generator/slicer';

import DataWindowToArray from '../src/data_window_to_array/processor';
import DataWindowToArraySchema from '../src/data_window_to_array/schema';

import DateRouter from '../src/date_router/processor';
import DateRouterSchema from '../src/date_router/schema';

import Dedupe from '../src/dedupe/processor';
import DedupeSchema from '../src/dedupe/schema';

import Extraction from '../src/extraction/processor';
import ExtractionSchema from '../src/extraction/schema';

import FieldRouter from '../src/field_router/processor';
import FieldRouterSchema from '../src/field_router/schema';

import GroupBy from '../src/group_by/processor';
import GroupBySchema from '../src/group_by/schema';

import HashRouter from '../src/hash_router/processor';
import HashRouterSchema from '../src/hash_router/schema';

import JobMetricApi from '../src/job_metric_api/api';
import JobMetricSchema from '../src/job_metric_api/schema';

import KeyRouter from '../src/key_router/processor';
import KeyRouterSchema from '../src/key_router/schema';

import Match from '../src/match/processor';
import MatchSchema from '../src/match/schema';

import Output from '../src/output/processor';
import OutputSchema from '../src/output/schema';

import PostProcess from '../src/post_process/processor';
import PostProcessSchema from '../src/post_process/schema';

import RemoveKey from '../src/remove_key/processor';
import RemoveKeySchema from '../src/remove_key/schema';

import RoutedSender from '../src/routed_sender/processor';
import RoutedSenderSchema from '../src/routed_sender/schema';

import Selection from '../src/selection/processor';
import SelectionSchema from '../src/selection/schema';

import SetKey from '../src/set_key/processor';
import SetKeySchema from '../src/set_key/schema';

import Sort from '../src/sort/processor';
import SortSchema from '../src/sort/schema';

import Transform from '../src/transform/processor';
import TransformSchema from '../src/transform/schema';

import Window from '../src/window/processor';
import WindowSchema from '../src/window/schema';

export const ASSETS = {
    accumulate: {
        Processor: Accumulate,
        Schema: AccumulateSchema
    },
    accumulate_by_key: {
        Processor: AccumulateByKey,
        Schema: AccumulateByKeySchema
    },
    data_generator: {
        Fetcher: DataGeneratorFetcher,
        Schema: DataGeneratorSchema,
        Slicer: DataGeneratorSlicer
    },
    data_window_to_array: {
        Processor: DataWindowToArray,
        Schema: DataWindowToArraySchema
    },
    date_router: {
        Processor: DateRouter,
        Schema: DateRouterSchema
    },
    dedupe: {
        Processor: Dedupe,
        Schema: DedupeSchema
    },
    extraction: {
        Processor: Extraction,
        Schema: ExtractionSchema
    },
    field_router: {
        Processor: FieldRouter,
        Schema: FieldRouterSchema
    },
    group_by: {
        Processor: GroupBy,
        Schema: GroupBySchema
    },
    hash_router: {
        Processor: HashRouter,
        Schema: HashRouterSchema
    },
    job_metric_api: {
        Api: JobMetricApi,
        Schema: JobMetricSchema
    },

    key_router: {
        Processor: KeyRouter,
        Schema: KeyRouterSchema
    },
    match: {
        Processor: Match,
        Schema: MatchSchema
    },
    output: {
        Processor: Output,
        Schema: OutputSchema
    },
    post_process: {
        Processor: PostProcess,
        Schema: PostProcessSchema
    },
    remove_key: {
        Processor: RemoveKey,
        Schema: RemoveKeySchema
    },
    routed_sender: {
        Processor: RoutedSender,
        Schema: RoutedSenderSchema
    },
    selection: {
        Processor: Selection,
        Schema: SelectionSchema
    },
    set_key: {
        Processor: SetKey,
        Schema: SetKeySchema
    },
    sort: {
        Processor: Sort,
        Schema: SortSchema
    },
    transform: {
        Processor: Transform,
        Schema: TransformSchema
    },
    window: {
        Processor: Window,
        Schema: WindowSchema
    }
};
