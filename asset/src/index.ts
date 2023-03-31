import Accumulate from './accumulate/processor';
import AccumulateSchema from './accumulate/schema';

import AccumulateByKey from './accumulate_by_key/processor';
import AccumulateByKeySchema from './accumulate_by_key/schema';

import AddKey from './add_key/processor';
import AddKeySchema from './add_key/schema';

import AddShortId from './add_short_id/processor';
import AddShortIdSchema from './add_short_id/schema';

import CopyField from './copy_field/processor';
import CopyFieldSchema from './copy_field/schema';

import DataGeneratorFetcher from './data_generator/fetcher';
import DataGeneratorSchema from './data_generator/schema';
import DataGeneratorSlicer from './data_generator/slicer';

import DataWindowToArray from './data_window_to_array/processor';
import DataWindowToArraySchema from './data_window_to_array/schema';

import DateRouter from './date_router/processor';
import DateRouterSchema from './date_router/schema';

import DebugRoutes from './debug_routes/processor';
import DebugRoutesSchema from './debug_routes/schema';

import Dedupe from './dedupe/processor';
import DedupeSchema from './dedupe/schema';

import DropField from './drop_field/processor';
import DropFieldSchema from './drop_field/schema';

import DropFieldConditional from './drop_field_conditional/processor';
import DropFieldConditionalSchema from './drop_field_conditional/schema';

import Extraction from './extraction/processor';
import ExtractionSchema from './extraction/schema';

import FieldRouter from './field_router/processor';
import FieldRouterSchema from './field_router/schema';

import GroupBy from './group_by/processor';
import GroupBySchema from './group_by/schema';

import HashRouter from './hash_router/processor';
import HashRouterSchema from './hash_router/schema';

import JobMetricApi from './job_metric_api/api';
import JobMetricSchema from './job_metric_api/schema';

import KeyRouter from './key_router/processor';
import KeyRouterSchema from './key_router/schema';

import Match from './match/processor';
import MatchSchema from './match/schema';

import Output from './output/processor';
import OutputSchema from './output/schema';

import PostProcess from './post_process/processor';
import PostProcessSchema from './post_process/schema';

import RemoveKey from './remove_key/processor';
import RemoveKeySchema from './remove_key/schema';

import RoutedSender from './routed_sender/processor';
import RoutedSenderSchema from './routed_sender/schema';

import Selection from './selection/processor';
import SelectionSchema from './selection/schema';

import SetField from './set_field/processor';
import SetFieldSchema from './set_field/schema';

import SetKey from './set_key/processor';
import SetKeySchema from './set_key/schema';

import Sort from './sort/processor';
import SortSchema from './sort/schema';

import Transform from './transform/processor';
import TransformSchema from './transform/schema';

import Window from './window/processor';
import WindowSchema from './window/schema';

export const ASSETS = {
    accumulate: {
        Processor: Accumulate,
        Schema: AccumulateSchema
    },
    accumulate_by_key: {
        Processor: AccumulateByKey,
        Schema: AccumulateByKeySchema
    },
    add_short_id: {
        Processor: AddShortId,
        Schema: AddShortIdSchema
    },
    add_key: {
        Processor: AddKey,
        Schema: AddKeySchema
    },
    copy_field: {
        Processor: CopyField,
        Schema: CopyFieldSchema
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
    debug_routes: {
        Processor: DebugRoutes,
        Schema: DebugRoutesSchema
    },
    dedupe: {
        Processor: Dedupe,
        Schema: DedupeSchema
    },
    drop_field: {
        Processor: DropField,
        Schema: DropFieldSchema
    },
    drop_field_conditional: {
        Processor: DropFieldConditional,
        Schema: DropFieldConditionalSchema
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
    set_field: {
        Processor: SetField,
        Schema: SetFieldSchema
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
