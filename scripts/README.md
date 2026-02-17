# Resource Generation Scripts

This directory contains scripts for automatically generating Aspire resource definitions from NuGet packages.

## Overview

The Aspire Playground uses a **dual-source** approach for resource data:

1. **Technical Data**: Extracted from NuGet packages using `api-ripper`
2. **Human-Readable Content**: Curated descriptions, icons, colors, and examples

## How It Works

1. **Fetches package versions** from NuGet.org API to get latest stable versions
2. **Downloads .nupkg files** to a local cache (`.nuget-cache/`)
3. **Runs api-ripper** to parse XML documentation and extract extension methods
4. **Extracts `Add*` methods** from `*Extensions` classes that take `IDistributedApplicationBuilder`
5. **Merges with curated metadata** (icons, colors, languages, etc.)
6. **Generates TypeScript** resource definitions with proper icon imports

## Scripts

### `generate-resources.js`

Generates `src/data/aspire-resources.ts` from NuGet packages.

**Prerequisites:**
- api-ripper cloned at `E:\GitHub\api-ripper` and built (`npm run build`)
- Node.js 18+ installed

**Usage:**
```bash
npm run generate-resources
```

**What it does:**
1. Fetches latest versions from NuGet.org
2. Downloads packages to `.nuget-cache/`
3. Uses api-ripper to extract API information
4. Merges with human-curated metadata from `RESOURCE_METADATA`
5. Generates TypeScript definitions with icon imports

## Supported Packages

The script currently analyzes these packages:

- `Aspire.Hosting.PostgreSQL`
- `Aspire.Hosting.SqlServer`
- `Aspire.Hosting.MongoDB`
- `Aspire.Hosting.MySql`
- `Aspire.Hosting.Oracle`
- `Aspire.Hosting.Redis`
- `Aspire.Hosting.Valkey`
- `Aspire.Hosting.Garnet`
- `Aspire.Hosting.RabbitMQ`
- `Aspire.Hosting.Kafka`
- `Aspire.Hosting.Nats`
- `Aspire.Hosting.JavaScript`
- `Aspire.Hosting.Python`
- `CommunityToolkit.Aspire.Hosting.Ollama`

## Adding New Resources

To add a new Aspire resource:

1. Add the NuGet package name to `PACKAGES` array
2. Add metadata to `RESOURCE_METADATA` object:
   ```javascript
   'resourceid': {
     iconImport: 'myIcon',
     iconPath: '../assets/icons/my-icon.png',
     color: '#FF0000',
     category: 'database',
     displayName: 'Display Name',
     description: 'Human-readable description',
     allowsDatabase: false,
     languages: ['C#', 'Python'],
   }
   ```
3. Add the icon file to `src/assets/icons/`
4. Run `npm run generate-resources`

## Resource Categories

- **project**: Application projects (C#, Node.js, Python, etc.)
- **database**: Relational and NoSQL databases
- **cache**: In-memory caching systems
- **messaging**: Message brokers and event streams
- **ai**: AI/ML services
- **compute**: Containers and serverless

## Output Format

The generated `aspire-resources.ts` includes:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (lowercase) |
| `name` | string | Default instance name |
| `displayName` | string | Human-readable name |
| `category` | string | Resource category |
| `icon` | import | Icon asset import |
| `color` | string | Hex color code |
| `description` | string | From API XML docs or curated |
| `package` | string | NuGet package name |
| `hostingMethod` | string | Builder method (e.g., AddPostgres) |
| `languages` | string[] | Supported languages |
| `connectionMethod` | string? | Sub-method (e.g., AddDatabase) |
| `allowsDatabase` | boolean? | Supports database creation |
| `exampleCode` | string | Code example |
| `nugetPackage` | string? | Package with version |

## Cache

Downloaded packages are cached in `.nuget-cache/` directory. Delete this folder to force re-download of all packages.
