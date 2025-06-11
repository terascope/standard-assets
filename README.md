# standard-assets

> Teraslice standard processor asset bundle

## Getting Started

This asset bundle requires a running Teraslice cluster. [Documentation](https://terascope.github.io/teraslice/docs/overview/).

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

[https://terascope.github.io/standard-assets/](https://terascope.github.io/standard-assets/)

## Operations

* [accumulate_by_key](./docs/asset/operations/accumulate_by_key)
* [accumulate](./docs/asset/operations/accumulate)
* [add_key](./docs/asset/operations/add_key)
* [add_short_id](./docs/asset/operations/add_short_id)
* [copy_field](./docs/asset/operations/copy_field)
* [copy_metadata_field](./docs/asset/operations/copy_metadata_field)
* [count_by_field](./docs/asset/operations/count_by_field)
* [count_unique](./docs/asset/operations/count_unique)
* [data_generator](./docs/asset/operations/data_generator)
* [data_window_to_array](./docs/asset/operations/data_window_to_array)
* [date_router](./docs/asset/operations/date_router)
* [debug_routes](./docs/asset/operations/debug_routes)
* [dedupe](./docs/asset/operations/dedupe)
* [drop_field_conditional](./docs/asset/operations/drop_field_conditional)
* [drop_field](./docs/asset/operations/drop_field)
* [extraction](./docs/asset/operations/extraction)
* [filter_by_date](./docs/asset/operations/filter_by_date)
* [filter_by_required_fields](./docs/asset/operations/filter_by_required_fields)
* [filter_by_unknown_fields](./docs/asset/operations/filter_by_unknown_fields)
* [filter](./docs/asset/operations/filter)
* [group_by](./docs/asset/operations/group_by)
* [hash_router](./docs/asset/operations/hash_router)
* [json_parser](./docs/asset/operations/json_parser)
* [key_router](./docs/asset/operations/key_router)
* [match](./docs/asset/operations/match)
* [output](./docs/asset/operations/output)
* [post_process](./docs/asset/operations/post_process)
* [remove_empty_fields](./docs/asset/operations/remove_empty_fields)
* [remove_key](./docs/asset/operations/remove_key)
* [routed_sender](./docs/asset/operations/routed_sender)
* [sample_exact_es_percent](./docs/asset/operations/sample_exact_es_percent)
* [sample_exact](./docs/asset/operations/sample_exact)
* [sample_random](./docs/asset/operations/sample_random)
* [selection](./docs/asset/operations/selection)
* [set_field_conditional](./docs/asset/operations/set_field_conditional)
* [set_field](./docs/asset/operations/set_field)
* [set_key](./docs/asset/operations/set_key)
* [sort](./docs/asset/operations/sort)
* [stdout](./docs/asset/operations/stdout)
* [transform](./docs/asset/operations/transform)
* [window](./docs/asset/operations/window)

## Entities

* [data-window](./docs/asset/entity/data-window)

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](./LICENSE) licensed.
