import Accumulate from './accumulate/processor.js';
import AccumulateSchema from './accumulate/schema.js';

import AccumulateByKey from './accumulate_by_key/processor.js';
import AccumulateByKeySchema from './accumulate_by_key/schema.js';

import AddKey from './add_key/processor.js';
import AddKeySchema from './add_key/schema.js';

import AddShortId from './add_short_id/processor.js';
import AddShortIdSchema from './add_short_id/schema.js';

import CopyField from './copy_field/processor.js';
import CopyFieldSchema from './copy_field/schema.js';

import CopyMetadataField from './copy_metadata_field/processor.js';
import CopyMetadataFieldSchema from './copy_metadata_field/schema.js';

import CountByField from './count_by_field/processor.js';
import CountByFieldSchema from './count_by_field/schema.js';

import CountUnique from './count_unique/processor.js';
import CountUniqueSchema from './count_unique/schema.js';

import DataGeneratorFetcher from './data_generator/fetcher.js';
import DataGeneratorSchema from './data_generator/schema.js';
import DataGeneratorSlicer from './data_generator/slicer.js';

import DataWindowToArray from './data_window_to_array/processor.js';
import DataWindowToArraySchema from './data_window_to_array/schema.js';

import DateGuard from './date_guard/processor.js';
import DateGuardSchema from './date_guard/schema.js';

import DateRouter from './date_router/processor.js';
import DateRouterSchema from './date_router/schema.js';

import DebugRoutes from './debug_routes/processor.js';
import DebugRoutesSchema from './debug_routes/schema.js';

import Dedupe from './dedupe/processor.js';
import DedupeSchema from './dedupe/schema.js';

import DropField from './drop_field/processor.js';
import DropFieldSchema from './drop_field/schema.js';

import DropFieldConditional from './drop_field_conditional/processor.js';
import DropFieldConditionalSchema from './drop_field_conditional/schema.js';

import Extraction from './extraction/processor.js';
import ExtractionSchema from './extraction/schema.js';

import FieldRouter from './field_router/processor.js';
import FieldRouterSchema from './field_router/schema.js';

import Filter from './filter/processor.js';
import FilterSchema from './filter/schema.js';

import FilterByRequiredFields from './filter_by_required_fields/processor.js';
import FilterByRequiredFieldsSchema from './filter_by_required_fields/schema.js';

import FilterByUnknownFields from './filter_by_unknown_fields/processor.js';
import FilterByUnknownFieldsSchema from './filter_by_unknown_fields/schema.js';

import GroupBy from './group_by/processor.js';
import GroupBySchema from './group_by/schema.js';

import HashRouter from './hash_router/processor.js';
import HashRouterSchema from './hash_router/schema.js';

import JSONParser from './json_parser/processor.js';
import JSONParserSchema from './json_parser/schema.js';

import KeyRouter from './key_router/processor.js';
import KeyRouterSchema from './key_router/schema.js';

import Match from './match/processor.js';
import MatchSchema from './match/schema.js';

import Output from './output/processor.js';
import OutputSchema from './output/schema.js';

import PostProcess from './post_process/processor.js';
import PostProcessSchema from './post_process/schema.js';

import RemoveEmptyFields from './remove_empty_fields/processor.js';
import RemoveEmptyFieldsSchema from './remove_empty_fields/schema.js';

import RemoveKey from './remove_key/processor.js';
import RemoveKeySchema from './remove_key/schema.js';

import RoutedSender from './routed_sender/processor.js';
import RoutedSenderSchema from './routed_sender/schema.js';

import Sample from './sample/processor.js';
import SampleSchema from './sample/schema.js';

import Selection from './selection/processor.js';
import SelectionSchema from './selection/schema.js';

import SetField from './set_field/processor.js';
import SetFieldSchema from './set_field/schema.js';

import SetFieldConditional from './set_field_conditional/processor.js';
import SetFieldConditionalSchema from './set_field_conditional/schema.js';

import SetKey from './set_key/processor.js';
import SetKeySchema from './set_key/schema.js';

import Sort from './sort/processor.js';
import SortSchema from './sort/schema.js';

import Stdout from './stdout/processor.js';
import StdoutSchema from './stdout/schema.js';

import Transform from './transform/processor.js';
import TransformSchema from './transform/schema.js';

import Window from './window/processor.js';
import WindowSchema from './window/schema.js';

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
    copy_metadata_field: {
        Processor: CopyMetadataField,
        Schema: CopyMetadataFieldSchema
    },
    count_by_field: {
        Processor: CountByField,
        Schema: CountByFieldSchema
    },
    count_unique: {
        Processor: CountUnique,
        Schema: CountUniqueSchema
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
    date_guard: {
        Processor: DateGuard,
        Schema: DateGuardSchema
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
    filter: {
        Processor: Filter,
        Schema: FilterSchema
    },
    filter_by_required_fields: {
        Processor: FilterByRequiredFields,
        Schema: FilterByRequiredFieldsSchema
    },
    filter_by_unknown_fields: {
        Processor: FilterByUnknownFields,
        Schema: FilterByUnknownFieldsSchema
    },
    group_by: {
        Processor: GroupBy,
        Schema: GroupBySchema
    },
    hash_router: {
        Processor: HashRouter,
        Schema: HashRouterSchema
    },
    json_parser: {
        Processor: JSONParser,
        Schema: JSONParserSchema
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
    remove_empty_fields: {
        Processor: RemoveEmptyFields,
        Schema: RemoveEmptyFieldsSchema
    },
    remove_key: {
        Processor: RemoveKey,
        Schema: RemoveKeySchema
    },
    routed_sender: {
        Processor: RoutedSender,
        Schema: RoutedSenderSchema
    },
    sample: {
        Processor: Sample,
        Schema: SampleSchema
    },
    selection: {
        Processor: Selection,
        Schema: SelectionSchema
    },
    set_field: {
        Processor: SetField,
        Schema: SetFieldSchema
    },
    set_field_conditional: {
        Processor: SetFieldConditional,
        Schema: SetFieldConditionalSchema
    },
    set_key: {
        Processor: SetKey,
        Schema: SetKeySchema
    },
    sort: {
        Processor: Sort,
        Schema: SortSchema
    },
    stdout: {
        Processor: Stdout,
        Schema: StdoutSchema
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
