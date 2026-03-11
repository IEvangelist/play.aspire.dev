/**
 * Data-driven resource generation from NuGet packages via api-ripper.
 *
 * This script:
 * 1. Reads configuration from scripts/resource-config.json
 * 2. Fetches package metadata (description, icon, tags) from NuGet API
 * 3. Uses api-ripper to extract API information from each package
 * 4. Infers resource categories from NuGet tags
 * 5. Downloads package icons to src/assets/icons/
 * 6. Generates TypeScript resource definitions in src/data/aspire-resources.ts
 *
 * Usage: node scripts/generate-resources.js
 *
 * Environment variable overrides:
 *   API_RIPPER_PATH  - path to api-ripper clone
 *   ASPIRE_VERSION   - NuGet package version to target
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ──────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────

const CONFIG_PATH = join(__dirname, 'resource-config.json');
if (!existsSync(CONFIG_PATH)) {
  console.error('❌ Configuration file not found: scripts/resource-config.json');
  process.exit(1);
}
const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));

const API_RIPPER_PATH = process.env.API_RIPPER_PATH || config.apiRipperPath;
const VERSION = process.env.ASPIRE_VERSION || config.version;
const OUTPUT_FILE = join(__dirname, '../src/data/aspire-resources.ts');
const ICONS_DIR = join(__dirname, '../src/assets/icons');

// NuGet API endpoints
const NUGET_SEARCH_URL = 'https://azuresearch-usnc.nuget.org/query';
const NUGET_FLAT_CONTAINER = 'https://api.nuget.org/v3-flatcontainer';

// Category inference keywords (from config)
const CATEGORY_KEYWORDS = config.categoryKeywords || {};
const CATEGORY_OVERRIDES = config.categoryOverrides || {};
const CATEGORY_COLORS = config.categoryColors || {};
const COLOR_OVERRIDES = config.colorOverrides || {};

// ──────────────────────────────────────────────
// NuGet API helpers
// ──────────────────────────────────────────────

async function fetchNuGetMetadata(packageId) {
  const url =
    NUGET_SEARCH_URL + '?q=packageid:' + packageId + '&take=1&prerelease=true';

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn('  ⚠ NuGet search failed for ' + packageId + ': HTTP ' + response.status);
      return null;
    }

    const data = await response.json();
    const pkg = data.data?.[0];

    if (!pkg) {
      console.warn('  ⚠ Package not found on NuGet: ' + packageId);
      return null;
    }

    return {
      description: pkg.description || '',
      iconUrl: pkg.iconUrl || null,
      tags: (pkg.tags || []).map((t) => t.toLowerCase()),
      authors: Array.isArray(pkg.authors) ? pkg.authors.join(', ') : pkg.authors || '',
    };
  } catch (error) {
    console.warn('  ⚠ Failed fetching NuGet metadata for ' + packageId + ': ' + error.message);
    return null;
  }
}

/**
 * Download the embedded icon from a NuGet package via the flat container API.
 * Falls back to the iconUrl from NuGet search metadata.
 */
async function downloadIcon(packageId, version, fallbackIconUrl) {
  const lowerId = packageId.toLowerCase();
  const safeName = packageId.replace('Aspire.Hosting.', '').replace(/\./g, '-').toLowerCase();

  // Try flat container icon endpoint first (embedded icon)
  const flatUrl = NUGET_FLAT_CONTAINER + '/' + lowerId + '/' + version + '/icon';
  let result = await tryDownloadIcon(flatUrl, safeName);
  if (result) return result;

  // Fallback to iconUrl from NuGet metadata
  if (fallbackIconUrl) {
    result = await tryDownloadIcon(fallbackIconUrl, safeName);
    if (result) return result;
  }

  console.warn('  ⚠ No icon available for ' + packageId);
  return null;
}

async function tryDownloadIcon(url, safeName) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') || '';
    let ext = '.png';
    if (contentType.includes('svg')) ext = '.svg';
    else if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = '.jpg';

    const filename = safeName + '-icon' + ext;
    const filepath = join(ICONS_DIR, filename);

    const buffer = await response.arrayBuffer();
    writeFileSync(filepath, Buffer.from(buffer));

    console.log('  📥 Icon: ' + filename);
    return filename;
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────
// Category inference from NuGet tags
// ──────────────────────────────────────────────

function inferCategory(packageName, tags) {
  const suffix = packageName.replace('Aspire.Hosting.', '');

  // 1. Explicit override from config
  if (CATEGORY_OVERRIDES[suffix]) return CATEGORY_OVERRIDES[suffix];

  // 2. Match NuGet tags against keyword lists
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (tags.some((tag) => keywords.some((kw) => tag.includes(kw)))) {
      return category;
    }
  }

  // 3. Fallback: match package name suffix against keywords
  const lowerSuffix = suffix.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lowerSuffix.includes(kw))) {
      return category;
    }
  }

  return 'compute';
}

// ──────────────────────────────────────────────
// api-ripper integration
// ──────────────────────────────────────────────

const NUPKG_CACHE_DIR = join(tmpdir(), 'aspire-playground-nupkgs');

/**
 * Download a .nupkg from the NuGet flat container API.
 * Returns the local file path, or null on failure.
 */
async function downloadNupkg(packageId, version) {
  if (!existsSync(NUPKG_CACHE_DIR)) {
    mkdirSync(NUPKG_CACHE_DIR, { recursive: true });
  }

  const lowerId = packageId.toLowerCase();
  const lowerVersion = version.toLowerCase();
  const filename = lowerId + '.' + lowerVersion + '.nupkg';
  const filepath = join(NUPKG_CACHE_DIR, filename);

  // Use cached copy if available
  if (existsSync(filepath)) {
    return filepath;
  }

  const url = NUGET_FLAT_CONTAINER + '/' + lowerId + '/' + lowerVersion + '/' + filename;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn('  ⚠ Failed to download .nupkg: HTTP ' + response.status);
      return null;
    }
    const buffer = await response.arrayBuffer();
    writeFileSync(filepath, Buffer.from(buffer));
    console.log('  📦 Downloaded .nupkg (' + Math.round(buffer.byteLength / 1024) + ' KB)');
    return filepath;
  } catch (error) {
    console.warn('  ⚠ Failed to download .nupkg: ' + error.message);
    return null;
  }
}

/**
 * Run api-ripper on a .nupkg file.
 * Uses: node dist/index.js <path.nupkg> json --eco dotnet
 */
function runApiRipper(nupkgPath) {
  try {
    const cmd = 'node dist/index.js "' + nupkgPath + '" json --eco dotnet';
    const output = execSync(cmd, {
      cwd: API_RIPPER_PATH,
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024, // 50 MB
    });
    return JSON.parse(output);
  } catch (error) {
    console.error('  ❌ api-ripper failed: ' + error.message.split('\n')[0]);
    return null;
  }
}

/**
 * Extract Add* builder extension methods from api-ripper output.
 * api-ripper output format: { assemblies: [{ namespaces: [{ types: [{ methods, ... }] }] }] }
 *
 * Filters out:
 * - Child resource methods (AddDatabase, AddRoute, AddCluster, AddModel) — these are
 *   called on an existing resource, not on the builder.
 * - Duplicate overloads — keeps only the first occurrence of each method name.
 */

// Methods that are child resource builders, not top-level Add* methods
const CHILD_METHODS = new Set([
  'AddDatabase', 'AddRoute', 'AddCluster', 'AddModel',
  'AddDestination', 'AddTransform', 'AddMatch',
]);

function extractAddMethods(apiData) {
  if (!apiData) return [];

  const seen = new Set();
  const methods = [];

  function collect(m) {
    if (!m.name?.startsWith('Add')) return;
    if (CHILD_METHODS.has(m.name)) return;
    if (seen.has(m.name)) return;
    seen.add(m.name);
    methods.push(m);
  }

  // Walk assemblies → namespaces → types → methods
  for (const assembly of apiData.assemblies || []) {
    for (const ns of assembly.namespaces || []) {
      for (const type of ns.types || []) {
        for (const m of type.methods || []) {
          collect(m);
        }
      }
    }
  }

  // Also check legacy flat format (types at top level)
  for (const type of apiData.types || []) {
    for (const m of [...(type.extensionMethods || []), ...(type.methods || [])]) {
      collect(m);
    }
  }

  return methods;
}

/**
 * Check if the package exposes an AddDatabase method (database child resource).
 */
function checkAllowsDatabase(apiData) {
  if (!apiData) return false;

  for (const assembly of apiData.assemblies || []) {
    for (const ns of assembly.namespaces || []) {
      for (const type of ns.types || []) {
        for (const m of type.methods || []) {
          if (m.name === 'AddDatabase') return true;
        }
      }
    }
  }

  // Legacy flat format
  for (const type of apiData.types || []) {
    for (const m of [...(type.extensionMethods || []), ...(type.methods || [])]) {
      if (m.name === 'AddDatabase') return true;
    }
  }

  return false;
}

/**
 * Try to extract an XML doc summary from the method metadata.
 */
function extractMethodDescription(method) {
  return method?.summary || method?.documentation?.summary || method?.xmlDoc?.summary || null;
}

// ──────────────────────────────────────────────
// Resource construction
// ──────────────────────────────────────────────

function buildResource({ method, packageName, nugetMeta, iconFile, category, allowsDatabase }) {
  const resourceName = method.name.replace('Add', '');
  const lowerName = resourceName.toLowerCase();

  // Description priority: method XML doc → NuGet package description → fallback
  const rawDescription =
    extractMethodDescription(method) || nugetMeta?.description || (resourceName + ' resource');
  // Take just the first sentence for brevity
  const description = rawDescription.includes('.')
    ? rawDescription.split('.')[0] + '.'
    : rawDescription;

  // Color: explicit override → category default → grey
  const color = COLOR_OVERRIDES[resourceName] || CATEGORY_COLORS[category] || '#888888';

  // Detect connection string parameter
  const hasConnectionString = method.parameters?.some(
    (p) => p.name === 'connectionString' || p.type?.includes('ConnectionString'),
  ) || (method.signature && method.signature.includes('connectionString'));

  return {
    id: lowerName,
    name: lowerName,
    displayName: resourceName,
    category,
    _iconFile: iconFile || null,
    color,
    description,
    package: packageName,
    hostingMethod: method.name,
    languages: ['C#'],
    ...(hasConnectionString && { connectionMethod: 'Connection String' }),
    ...(allowsDatabase && { allowsDatabase: true, connectionMethod: 'AddDatabase' }),
    exampleCode: generateExampleCode(resourceName, allowsDatabase),
    nugetPackage: packageName + '@' + VERSION,
  };
}

function generateExampleCode(resourceName, allowsDatabase) {
  const lowerName = resourceName.toLowerCase();

  if (allowsDatabase) {
    return 'var ' + lowerName + ' = builder.Add' + resourceName + '("' + lowerName + '");\n' +
      'var db = ' + lowerName + '.AddDatabase("mydb");';
  }

  return 'var ' + lowerName + ' = builder.Add' + resourceName + '("' + lowerName + '");';
}

// ──────────────────────────────────────────────
// TypeScript code generation
// ──────────────────────────────────────────────

function escapeTs(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

function generateTypeScriptFile(resources, iconImports) {
  const timestamp = new Date().toISOString();

  // Icon import statements
  const importLines = iconImports
    .map(({ varName, path }) => 'import ' + varName + " from '" + path + "';")
    .join('\n');

  // Build resource entries
  const resourceEntries = resources
    .map((r) => {
      const iconValue = r._iconImportVar || "''";
      const lines = [
        "    id: '" + r.id + "',",
        "    name: '" + r.name + "',",
        "    displayName: '" + escapeTs(r.displayName) + "',",
        "    category: '" + r.category + "',",
        '    icon: ' + iconValue + ',',
        "    color: '" + r.color + "',",
        "    description: '" + escapeTs(r.description) + "',",
        "    package: '" + r.package + "',",
        "    hostingMethod: '" + r.hostingMethod + "',",
        '    languages: [' + r.languages.map((l) => "'" + l + "'").join(', ') + '],',
      ];

      if (r.connectionMethod) lines.push("    connectionMethod: '" + r.connectionMethod + "',");
      if (r.allowsDatabase) lines.push('    allowsDatabase: true,');
      lines.push("    exampleCode: '" + escapeTs(r.exampleCode) + "',");
      if (r.nugetPackage) lines.push("    nugetPackage: '" + r.nugetPackage + "',");

      return '  {\n' + lines.join('\n') + '\n  }';
    })
    .join(',\n');

  const header = [
    '/**',
    ' * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY',
    ' *',
    ' * Generated: ' + timestamp,
    ' * Aspire SDK version: ' + VERSION,
    ' * Source: NuGet packages via api-ripper + NuGet API metadata',
    ' *',
    ' * To regenerate: npm run generate-resources',
    ' */',
    '',
  ].join('\n');

  const imports = importLines ? importLines + '\n\n' : '\n';

  const iface = [
    'export interface AspireResource {',
    '  id: string;',
    '  name: string;',
    '  displayName: string;',
    "  category: 'database' | 'cache' | 'messaging' | 'ai' | 'compute' | 'project';",
    '  icon: string;',
    '  color: string;',
    '  description: string;',
    '  package: string;',
    '  hostingMethod: string;',
    '  languages: string[];',
    '  connectionMethod?: string;',
    '  allowsDatabase?: boolean;',
    '  exampleCode: string;',
    '  nugetPackage?: string;',
    '}',
    '',
  ].join('\n');

  const resourceArray =
    'export const aspireResources: AspireResource[] = [\n' + resourceEntries + '\n];\n';

  const categories = [
    '',
    'export const resourceCategories = [',
    "  { id: 'project', name: 'Apps', icon: '💻', color: '#0078D4' },",
    "  { id: 'database', name: 'Databases', icon: '🗄️', color: '#107C10' },",
    "  { id: 'cache', name: 'Caching', icon: '⚡', color: '#FFB900' },",
    "  { id: 'messaging', name: 'Messaging', icon: '📬', color: '#E74856' },",
    "  { id: 'ai', name: 'AI', icon: '🧠', color: '#00BCF2' },",
    "  { id: 'compute', name: 'Compute', icon: '🔧', color: '#8764B8' },",
    '];',
    '',
  ].join('\n');

  return header + imports + iface + resourceArray + categories;
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────

/**
 * When api-ripper is unavailable, infer an Add* method name from the package suffix.
 * e.g. Aspire.Hosting.PostgreSQL → AddPostgreSQL, Aspire.Hosting.SqlServer → AddSqlServer
 */
function inferAddMethodFromPackage(packageName) {
  const suffix = packageName.replace('Aspire.Hosting.', '').replace(/\./g, '');
  return { name: 'Add' + suffix, parameters: [] };
}

async function main() {
  console.log('🚀 Starting data-driven resource generation...\n');
  console.log('  📦 Version: ' + VERSION);
  console.log('  📂 api-ripper: ' + API_RIPPER_PATH);
  console.log('  📝 Output: ' + OUTPUT_FILE + '\n');

  const hasApiRipper = existsSync(API_RIPPER_PATH);
  if (!hasApiRipper) {
    console.warn('⚠ api-ripper not found at ' + API_RIPPER_PATH);
    console.warn('  Falling back to NuGet metadata + inferred method names\n');
  }

  if (!existsSync(ICONS_DIR)) {
    mkdirSync(ICONS_DIR, { recursive: true });
  }

  const allResources = [];
  const iconImports = []; // { varName, path }

  // ── Process each NuGet package ──

  for (const packageName of config.packages) {
    console.log('📦 ' + packageName);

    // 1. Fetch metadata from NuGet API (description, icon, tags)
    const nugetMeta = await fetchNuGetMetadata(packageName);
    const tags = nugetMeta?.tags || [];

    // 2. Download icon from NuGet package
    const iconFile = await downloadIcon(packageName, VERSION, nugetMeta?.iconUrl);

    // 3. Download .nupkg and run api-ripper (if available)
    let apiData = null;
    if (hasApiRipper) {
      const nupkgPath = await downloadNupkg(packageName, VERSION);
      if (nupkgPath) {
        apiData = runApiRipper(nupkgPath);
      }
    }

    // 4. Extract Add* builder methods, or infer from package name
    let addMethods = extractAddMethods(apiData);
    if (addMethods.length === 0) {
      // Infer a single Add* method from the package suffix
      addMethods = [inferAddMethodFromPackage(packageName)];
      console.log('  ℹ Inferred method: ' + addMethods[0].name);
    }

    // 5. Infer category from NuGet tags / package name
    const category = inferCategory(packageName, tags);

    // 6. Check if the package supports child databases
    const allowsDatabase = checkAllowsDatabase(apiData);

    // 7. Register icon import (shared across all methods from this package)
    let iconImportVar = null;
    if (iconFile) {
      const importPath = '../assets/icons/' + iconFile;
      const existing = iconImports.find((i) => i.path === importPath);
      if (existing) {
        iconImportVar = existing.varName;
      } else {
        const safeName = packageName
          .replace('Aspire.Hosting.', '')
          .replace(/\./g, '')
          .toLowerCase();
        iconImportVar = safeName + 'Icon';
        iconImports.push({ varName: iconImportVar, path: importPath });
      }
    }

    // 8. Build a resource entry for each Add* method
    for (const method of addMethods) {
      const resource = buildResource({
        method,
        packageName,
        nugetMeta,
        iconFile,
        category,
        allowsDatabase,
      });

      if (iconImportVar) {
        resource._iconImportVar = iconImportVar;
      }

      allResources.push(resource);
      console.log('  ✅ ' + resource.displayName + ' (' + category + ')');
    }

    console.log('');
  }

  // ── Manual resources from config ──

  if (config.manualResources?.length) {
    console.log('📋 Manual resources:');
    for (const manual of config.manualResources) {
      if (manual.iconFile) {
        const importPath = '../assets/icons/' + manual.iconFile;
        const existing = iconImports.find((i) => i.path === importPath);
        if (existing) {
          manual._iconImportVar = existing.varName;
        } else {
          const varName = manual.id.replace(/[^a-zA-Z]/g, '') + 'Icon';
          manual._iconImportVar = varName;
          iconImports.push({ varName, path: importPath });
        }
      }

      allResources.push(manual);
      console.log('  ✅ ' + manual.displayName + ' (' + manual.category + ')');
    }
    console.log('');
  }

  // ── Sort by category order, then display name ──

  const categoryOrder = ['project', 'database', 'cache', 'messaging', 'ai', 'compute'];
  allResources.sort((a, b) => {
    const catDiff = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
    if (catDiff !== 0) return catDiff;
    return a.displayName.localeCompare(b.displayName);
  });

  // ── Generate TypeScript output ──

  const tsContent = generateTypeScriptFile(allResources, iconImports);

  const outputDir = dirname(OUTPUT_FILE);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  writeFileSync(OUTPUT_FILE, tsContent, 'utf-8');

  console.log('✅ Generated ' + allResources.length + ' resources');
  console.log('📝 Written to: ' + OUTPUT_FILE);
  console.log('🎉 Done!');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
