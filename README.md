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

## Operations

* [accumulate](./docs/operations/accumulate.md)
* [accumulate_by_key](./docs/operations/accumulate_by_key.md)
* [window](./docs/operations/window.md)
* [data_window_to_array](./docs/operations/data_window_to_array.md)

* [data_generator](./docs/operations/data_generator.md)
* [dedupe](./docs/operations/dedupe.md)
* [group_by](./docs/operations/group_by.md)
* [remove_key](./docs/operations/remove_key.md)
* [set_key](./docs/operations/set_key.md)
* [sort](./docs/operations/sort.md)

* [date_router](./docs/operations/date_router.md)
* [hash_router](./docs/operations/hash_router.md)
* [field_router](./docs/operations/field_router.md)
* [key_router](./docs/operations/key_router.md)

* [routed_sender](./docs/operations/routed_sender.md)

* [selection](./docs/operations/selection.md)
* [extraction](./docs/operations/extraction.md)
* [post_process](./docs/operations/post_process.md)
* [output](./docs/operations/output.md)

* [match](./docs/operations/match.md)
* [transform](./docs/operations/transform.md)

## Entities

* [data-window](./docs/entity/data-window.md)

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](./LICENSE) licensed.
