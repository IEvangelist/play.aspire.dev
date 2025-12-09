# Resource Generation Scripts

This directory contains scripts for automatically generating Aspire resource definitions from NuGet packages.

## Overview

The Aspire Playground uses a **dual-source** approach for resource data:

1. **Technical Data**: Extracted from NuGet packages using `api-ripper`
2. **Human-Readable Content**: Curated descriptions, icons, colors, and examples

## Scripts

### `generate-resources.js`

Generates `src/data/aspire-resources.ts` from NuGet packages.

**Prerequisites:**
- api-ripper cloned at `E:\GitHub\api-ripper`
- Node.js installed

**Usage:**
```bash
npm run generate-resources
```

**What it does:**
1. Reads package list from `PACKAGES` array
2. Uses api-ripper to extract API information
3. Merges with human-curated metadata from `RESOURCE_METADATA`
4. Generates TypeScript definitions

## Adding New Resources

To add a new Aspire resource:

1. Add the NuGet package name to `PACKAGES` array
2. Add metadata to `RESOURCE_METADATA` object:
   ```javascript
   'ResourceName': {
     icon: '🎯',
     color: '#FF0000',
     category: 'database',
     displayName: 'Display Name',
     description: 'Human-readable description',
     allowsDatabase: false,
   }
   ```
3. Run `npm run generate-resources`

## Resource Categories

- **project**: Application projects (C#, Node.js, Python, etc.)
- **database**: Relational and NoSQL databases
- **cache**: In-memory caching systems
- **messaging**: Message brokers and event streams
- **ai**: AI/ML services
- **compute**: Containers and serverless

## Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (lowercase) |
| `name` | string | Default instance name |
| `displayName` | string | Human-readable name |
| `category` | string | Resource category |
| `icon` | string | Emoji icon |
| `color` | string | Hex color code |
| `description` | string | Short description |
| `package` | string | NuGet package name |
| `hostingMethod` | string | How resource is hosted |
| `languages` | string[] | Supported languages |
| `connectionMethod` | string? | How to connect |
| `allowsDatabase` | boolean? | Supports database creation |
| `exampleCode` | string | Code example |
| `nugetPackage` | string? | Package with version |

## Future Enhancements

- [ ] Fetch package metadata from NuGet.org API
- [ ] Extract descriptions from XML documentation
- [ ] Auto-generate example code from method signatures
- [ ] Support for custom/community packages
- [ ] Versioned resource definitions
