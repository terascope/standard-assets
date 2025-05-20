# standard-assets

> Teraslice standard processor asset bundle

## Getting Started

This asset bundle requires a running Teraslice cluster, you can find the documentation [here](https://terascope.github.io/teraslice/docs/overview/).

```bash
# Step 1: make sure you have teraslice-cli installed
yarn global add teraslice-cli

# Step 2:
# teraslice-cli assets deploy <cluster_alias> <asset-name[@version]>
# deploy latest standard-assets to localhost teraslice cluster
teraslice-cli assets deploy localhost terascope/standard-assets
# deploy a specific version to localhost teraslice cluster
teraslice-cli assets deploy localhost terascope/standard-assets@1.3.4
# build from source and deploy to localhost teraslice cluster
teraslice-cli assets deploy localhost --build

```

## Documentation

https://terascope.github.io/standard-assets/

## Operations

* [accumulate_by_key](./docs/operations/accumulate_by_key.md)
* [accumulate](./docs/operations/accumulate.md)
* [add_key](./docs/operations/add_key.md)
* [add_short_id](./docs/operations/add_short_id.md)
* [copy_field](./docs/operations/copy_field.md)
* [copy_metadata_field](./docs/operations/copy_metadata_field.md)
* [count_by_field](./docs/operations/count_by_field.md)
* [count_unique](./docs/operations/count_unique.md)
* [data_generator](./docs/operations/data_generator.md)
* [data_window_to_array](./docs/operations/data_window_to_array.md)
* [date_router](./docs/operations/date_router.md)
* [debug_routes](./docs/operations/debug_routes.md)
* [dedupe](./docs/operations/dedupe.md)
* [drop_field_conditional](./docs/operations/drop_field_conditional.md)
* [drop_field](./docs/operations/drop_field.md)
* [extraction](./docs/operations/extraction.md)
* [filter_by_date](./docs/operations/filter_by_date.md)
* [filter_by_required_fields](./docs/operations/filter_by_required_fields.md)
* [filter_by_unknown_fields](./docs/operations/filter_by_unknown_fields.md)
* [filter](./docs/operations/filter.md)
* [group_by](./docs/operations/group_by.md)
* [hash_router](./docs/operations/hash_router.md)
* [json_parser](./docs/operations/json_parser.md)
* [key_router](./docs/operations/key_router.md)
* [match](./docs/operations/match.md)
* [output](./docs/operations/output.md)
* [post_process](./docs/operations/post_process.md)
* [remove_empty_fields](./docs/operations/remove_empty_fields.md)
* [remove_key](./docs/operations/remove_key.md)
* [routed_sender](./docs/operations/routed_sender.md)
* [sample_exact_es_percent](./docs/operations/sample_exact_es_percent.md)
* [sample_exact](./docs/operations/sample_exact.md)
* [sample_random](./docs/operations/sample_random.md)
* [selection](./docs/operations/selection.md)
* [set_field_conditional](./docs/operations/set_field_conditional.md)
* [set_field](./docs/operations/set_field.md)
* [set_key](./docs/operations/set_key.md)
* [sort](./docs/operations/sort.md)
* [stdout](./docs/operations/stdout.md)
* [transform](./docs/operations/transform.md)
* [window](./docs/operations/window.md)

## Entities

* [data-window](./docs/entity/data-window.md)

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](./LICENSE) licensed.
