# Resource Generation Scripts

This directory contains scripts for automatically generating Aspire resource definitions from NuGet packages.

## Overview

The generation pipeline is fully **data-driven**:

1. **Configuration** — `resource-config.json` declares packages, version, and category inference rules
2. **NuGet API** — descriptions, icons, and tags are fetched from NuGet.org at generation time
3. **api-ripper** — `Add*` extension methods, parameters, and XML doc comments are extracted from each package
4. **Category inference** — NuGet tags are matched against configurable keyword lists
5. **Icon download** — package icons are pulled from the NuGet flat container and saved to `src/assets/icons/`

No hardcoded metadata is needed — everything flows from the packages themselves.

## Files

| File | Purpose |
|------|--------|
| `generate-resources.js` | Main generation script |
| `resource-config.json` | Package list, version, category keywords, color/category overrides, manual resources |

## Usage

```bash
npm run generate-resources
```

### Environment variable overrides

| Variable | Default | Description |
|----------|---------|------------|
| `API_RIPPER_PATH` | Value from `resource-config.json` | Path to api-ripper clone |
| `ASPIRE_VERSION` | Value from `resource-config.json` | NuGet package version to target |

## Adding New Resources

1. Add the NuGet package name to the `packages` array in `resource-config.json`
2. Run `npm run generate-resources`

That's it — the script will fetch the description, icon, and tags from NuGet, extract the API methods via api-ripper, and infer the category automatically.

If automatic category detection doesn't work for a package, add an entry to `categoryOverrides`:

```json
"categoryOverrides": {
  "MyNewThing": "messaging"
}
```

For resources that don't come from a NuGet package (e.g. generic container, C# project), add them to the `manualResources` array in the config.

## Configuration Reference (`resource-config.json`)

| Key | Type | Description |
|-----|------|------------|
| `version` | string | Aspire SDK / NuGet package version |
| `apiRipperPath` | string | Path to api-ripper (overridden by `API_RIPPER_PATH` env var) |
| `packages` | string[] | NuGet packages to process |
| `categoryKeywords` | object | Maps category names to arrays of tag keywords for inference |
| `categoryOverrides` | object | Package suffix → explicit category (bypasses inference) |
| `categoryColors` | object | Default hex color per category |
| `colorOverrides` | object | Resource name → explicit hex color |
| `manualResources` | array | Resources defined directly in config (not from NuGet) |

## Resource Categories

- **project** — Application projects (C#, Node.js, Python, etc.)
- **database** — Relational and NoSQL databases
- **cache** — In-memory caching systems
- **messaging** — Message brokers and event streams
- **ai** — AI/ML services
- **compute** — Containers, proxies, and infrastructure

## Future Enhancements

- [ ] Support for custom/community packages
- [ ] Versioned resource definitions
- [ ] Parallel NuGet API + api-ripper execution
