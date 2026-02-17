/**
 * Script to generate resource definitions from NuGet packages using api-ripper
 * 
 * This script:
 * 1. Downloads NuGet packages from nuget.org
 * 2. Uses api-ripper to extract API information from each package
 * 3. Generates TypeScript resource definitions in src/data/aspire-resources.ts
 * 
 * Usage: node scripts/generate-resources.js [--version X.X.X]
 */

import { execSync, spawnSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_RIPPER_PATH = 'E:\\GitHub\\api-ripper';
const OUTPUT_FILE = join(__dirname, '../src/data/aspire-resources.ts');
const CACHE_DIR = join(__dirname, '../.nuget-cache');

// Aspire hosting packages to analyze
const PACKAGES = [
  'Aspire.Hosting.PostgreSQL',
  'Aspire.Hosting.SqlServer',
  'Aspire.Hosting.MongoDB',
  'Aspire.Hosting.MySql',
  'Aspire.Hosting.Oracle',
  'Aspire.Hosting.Redis',
  'Aspire.Hosting.Valkey',
  'Aspire.Hosting.Garnet',
  'Aspire.Hosting.RabbitMQ',
  'Aspire.Hosting.Kafka',
  'Aspire.Hosting.Nats',
  'Aspire.Hosting.JavaScript',
<<<<<<< Updated upstream
  'Aspire.Hosting.JavaScript',
=======
>>>>>>> Stashed changes
  'Aspire.Hosting.Python',
  'CommunityToolkit.Aspire.Hosting.Ollama',
];

<<<<<<< Updated upstream
// Cache for package versions
const packageVersionCache = new Map();

/**
 * Fetches the latest stable version of a NuGet package from the NuGet API
 * @param {string} packageName - The name of the NuGet package
 * @returns {Promise<string>} - The latest stable version
 */
async function getLatestNuGetVersion(packageName) {
  // Check cache first
  if (packageVersionCache.has(packageName)) {
    return packageVersionCache.get(packageName);
  }

  try {
    const response = await fetch(
      `https://api.nuget.org/v3-flatcontainer/${packageName.toLowerCase()}/index.json`
    );
    
    if (!response.ok) {
      console.warn(`⚠️ Failed to fetch version for ${packageName}: ${response.status}`);
      return '13.0.0'; // Fallback version
    }
    
    const data = await response.json();
    const versions = data.versions || [];
    
    // Filter to stable versions only (no prerelease tags like -preview, -rc, -beta)
    const stableVersions = versions.filter(v => !v.includes('-'));
    
    // Get the latest stable version (last in the sorted array)
    const latestVersion = stableVersions.length > 0 
      ? stableVersions[stableVersions.length - 1] 
      : versions[versions.length - 1]; // Fallback to latest including prerelease
    
    console.log(`📦 ${packageName}: ${latestVersion}`);
    packageVersionCache.set(packageName, latestVersion);
    return latestVersion;
  } catch (error) {
    console.warn(`⚠️ Error fetching version for ${packageName}:`, error.message);
    return '13.0.0'; // Fallback version
  }
}

/**
 * Fetches the download count for a NuGet package
 * @param {string} packageName - The name of the NuGet package
 * @returns {Promise<number>} - Total download count
 */
async function getNuGetDownloadCount(packageName) {
  try {
    const response = await fetch(
      `https://api.nuget.org/v3/registration5-semver1/${packageName.toLowerCase()}/index.json`
    );
    
    if (!response.ok) {
      return 0;
    }
    
    const data = await response.json();
    // The download count is not directly available in this endpoint
    // We'll use the search endpoint instead
    const searchResponse = await fetch(
      `https://api.nuget.org/v3/search?q=packageid:${packageName}&take=1`
    );
    
    if (!searchResponse.ok) {
      return 0;
    }
    
    const searchData = await searchResponse.json();
    const packageData = searchData.data?.[0];
    return packageData?.totalDownloads || 0;
  } catch (error) {
    return 0;
  }
}

// Resource metadata mapping (human-curated)
=======
// Resource metadata mapping (human-curated) - icons use asset imports in output
>>>>>>> Stashed changes
const RESOURCE_METADATA = {
  'postgres': {
    iconImport: 'postgresIcon',
    iconPath: '../assets/icons/postgresql-icon.png',
    color: '#336791',
    category: 'database',
    displayName: 'PostgreSQL',
    description: 'PostgreSQL database server',
    allowsDatabase: true,
    languages: ['C#', 'Python', 'JavaScript', 'Go', 'Java'],
  },
  'sqlserver': {
    iconImport: 'sqlServerIcon',
    iconPath: '../assets/icons/sql-icon.png',
    color: '#CC2927',
    category: 'database',
    displayName: 'SQL Server',
    description: 'Microsoft SQL Server database',
    allowsDatabase: true,
    languages: ['C#', 'Python', 'JavaScript', 'Java'],
  },
  'mongodb': {
    iconImport: 'mongodbIcon',
    iconPath: '../assets/icons/mongodb-icon.png',
    color: '#47A248',
    category: 'database',
    displayName: 'MongoDB',
    description: 'MongoDB NoSQL database',
    allowsDatabase: true,
    languages: ['C#', 'Python', 'JavaScript', 'Go', 'Java'],
  },
  'mysql': {
    iconImport: 'mysqlIcon',
    iconPath: '../assets/icons/mysqlconnector-icon.png',
    color: '#4479A1',
    category: 'database',
    displayName: 'MySQL',
    description: 'MySQL database server',
    allowsDatabase: true,
    languages: ['C#', 'Python', 'JavaScript', 'Go', 'Java'],
  },
  'oracle': {
    iconImport: 'oracleIcon',
    iconPath: '../assets/icons/oracle-icon.svg',
    color: '#F80000',
    category: 'database',
    displayName: 'Oracle Database',
    description: 'Oracle Database server',
    allowsDatabase: true,
    languages: ['C#', 'Java'],
  },
  'redis': {
    iconImport: 'redisIcon',
    iconPath: '../assets/icons/redis-icon.png',
    color: '#DC382D',
    category: 'cache',
    displayName: 'Redis',
    description: 'Redis cache and pub/sub',
    allowsDatabase: false,
    languages: ['C#', 'Python', 'JavaScript', 'Go', 'Java'],
  },
  'valkey': {
    iconImport: 'valkeyIcon',
    iconPath: '../assets/icons/valkey-icon.png',
    color: '#FF6B35',
    category: 'cache',
    displayName: 'Valkey',
    description: 'Valkey cache (Redis fork)',
    allowsDatabase: false,
    languages: ['C#', 'Python', 'JavaScript', 'Go', 'Java'],
  },
  'garnet': {
    iconImport: 'garnetIcon',
    iconPath: '../assets/icons/garnet-icon.png',
    color: '#AA336A',
    category: 'cache',
    displayName: 'Garnet',
    description: 'Microsoft Garnet cache server',
    allowsDatabase: false,
    languages: ['C#', 'Python', 'JavaScript'],
  },
  'rabbitmq': {
    iconImport: 'rabbitmqIcon',
    iconPath: '../assets/icons/rabbitmq-icon.svg',
    color: '#FF6600',
    category: 'messaging',
    displayName: 'RabbitMQ',
    description: 'RabbitMQ message broker',
    allowsDatabase: false,
    languages: ['C#', 'Python', 'JavaScript', 'Go', 'Java'],
  },
  'kafka': {
    iconImport: 'kafkaIcon',
    iconPath: '../assets/icons/apache-kafka-icon.svg',
    color: '#231F20',
    category: 'messaging',
    displayName: 'Apache Kafka',
    description: 'Apache Kafka event streaming',
    allowsDatabase: false,
    languages: ['C#', 'Python', 'JavaScript', 'Go', 'Java'],
  },
  'nats': {
    iconImport: 'natsIcon',
    iconPath: '../assets/icons/nats-icon.png',
    color: '#27AAE1',
    category: 'messaging',
    displayName: 'NATS',
    description: 'NATS messaging system',
    allowsDatabase: false,
    languages: ['C#', 'Python', 'JavaScript', 'Go'],
  },
  'nodeapp': {
    iconImport: 'nodejsIcon',
    iconPath: '../assets/icons/nodejs-icon.png',
    color: '#68A063',
    category: 'project',
    displayName: 'Node.js App',
    description: 'Node.js/Vite application with npm/yarn/pnpm support',
    allowsDatabase: false,
    languages: ['JavaScript', 'TypeScript'],
  },
  'viteapp': {
    iconImport: 'reactIcon',
    iconPath: '../assets/icons/react-icon.svg',
    color: '#646CFF',
    category: 'project',
    displayName: 'Vite App',
    description: 'Vite-powered React, Vue, or Svelte application',
    allowsDatabase: false,
    languages: ['JavaScript', 'TypeScript'],
  },
  'pythonapp': {
    iconImport: 'pythonIcon',
    iconPath: '../assets/icons/python.svg',
    color: '#3776AB',
    category: 'project',
    displayName: 'Python App',
    description: 'Python application with uv, pip, or venv support',
    allowsDatabase: false,
    languages: ['Python'],
  },
  'ollama': {
    iconImport: 'ollamaIcon',
    iconPath: '../assets/icons/ollama-icon.png',
    color: '#000000',
    category: 'ai',
    displayName: 'Ollama',
    description: 'Local LLM with Ollama',
    allowsDatabase: false,
    languages: ['C#', 'Python', 'JavaScript'],
  },
};

// Manual resources (not extracted from NuGet)
const MANUAL_RESOURCES = [
  {
    id: 'dotnet-project',
    name: 'dotnet-project',
    displayName: 'C# Project',
    category: 'project',
    iconImport: 'csharpIcon',
    color: '#512BD4',
    description: 'ASP.NET Core API, Web App, or Worker Service',
    package: 'Aspire.Hosting',
    hostingMethod: 'AddProject',
    languages: ['C#'],
    exampleCode: 'builder.AddProject<Projects.ApiService>("api")',
  },
  {
    id: 'container',
    name: 'container',
    displayName: 'Container',
    category: 'compute',
    iconImport: 'dockerIcon',
    color: '#2496ED',
    description: 'Custom Docker container image',
    package: 'Aspire.Hosting',
    hostingMethod: 'AddContainer',
    languages: ['Any'],
    exampleCode: 'builder.AddContainer("myapp", "myregistry/myapp", "latest")\\n    .WithHttpEndpoint(targetPort: 8080)',
  },
  {
    id: 'openai',
    name: 'openai',
    displayName: 'OpenAI',
    category: 'ai',
    iconImport: 'openaiIcon',
    color: '#10A37F',
    description: 'OpenAI API integration',
    package: 'Aspire.Hosting.Azure',
    hostingMethod: 'AddConnectionString',
    languages: ['C#', 'Python', 'JavaScript'],
    exampleCode: 'var openai = builder.AddConnectionString("openai");',
    nugetPackage: 'Aspire.Azure.AI.OpenAI',
  },
];

/**
 * Fetches the latest stable version of a NuGet package from the NuGet API
 */
async function getLatestNuGetVersion(packageName) {
  try {
    const response = await fetch(
      `https://api.nuget.org/v3-flatcontainer/${packageName.toLowerCase()}/index.json`
    );
    
    if (!response.ok) {
      console.warn(`⚠️ Failed to fetch version for ${packageName}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const versions = data.versions || [];
    
    // Filter to stable versions only (no prerelease tags)
    const stableVersions = versions.filter(v => !v.includes('-'));
    
    return stableVersions.length > 0 
      ? stableVersions[stableVersions.length - 1] 
      : versions[versions.length - 1];
  } catch (error) {
    console.warn(`⚠️ Error fetching version for ${packageName}:`, error.message);
    return null;
  }
}

<<<<<<< Updated upstream
function extractResourceInfo(apiData, packageName, version) {
  // Extract extension methods like AddPostgres, AddRedis, etc.
  const methods = apiData?.types?.find(t => t.name === 'IDistributedApplicationBuilder')?.extensionMethods || [];
=======
/**
 * Downloads a NuGet package to the cache directory
 */
async function downloadNuGetPackage(packageName, version) {
  const cacheFile = join(CACHE_DIR, `${packageName.toLowerCase()}.${version}.nupkg`);
>>>>>>> Stashed changes
  
  // Check if already cached
  if (existsSync(cacheFile)) {
    console.log(`  📦 Using cached ${packageName}@${version}`);
    return cacheFile;
  }
  
  // Ensure cache directory exists
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
  
  const url = `https://api.nuget.org/v3-flatcontainer/${packageName.toLowerCase()}/${version}/${packageName.toLowerCase()}.${version}.nupkg`;
  console.log(`  ⬇️ Downloading ${packageName}@${version}...`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
<<<<<<< Updated upstream
    return {
      id: resourceName.toLowerCase(),
      name: resourceName.toLowerCase(),
      displayName: metadata.displayName,
      category: metadata.category,
      icon: metadata.icon,
      color: metadata.color,
      description: metadata.description,
      package: packageName,
      hostingMethod: 'Container',
      languages: ['C#'],
      connectionMethod: method.parameters?.find(p => p.name === 'connectionString') ? 'Connection String' : undefined,
      allowsDatabase: metadata.allowsDatabase,
      exampleCode: generateExampleCode(resourceName, method),
      nugetPackage: `${packageName}@${version}`,
    };
  });
=======
    const buffer = await response.arrayBuffer();
    writeFileSync(cacheFile, Buffer.from(buffer));
    return cacheFile;
  } catch (error) {
    console.error(`  ❌ Failed to download ${packageName}@${version}: ${error.message}`);
    return null;
  }
>>>>>>> Stashed changes
}

/**
 * Runs api-ripper on a NuGet package and returns parsed JSON
 */
function runApiRipper(nupkgPath) {
  try {
    const result = spawnSync('node', ['dist/index.js', nupkgPath, 'json', '--eco', 'dotnet'], {
      cwd: API_RIPPER_PATH,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });
    
    if (result.error) {
      throw result.error;
    }
    
    if (result.status !== 0) {
      throw new Error(result.stderr || 'Unknown error');
    }
    
    return JSON.parse(result.stdout);
  } catch (error) {
    console.error(`  ❌ api-ripper failed: ${error.message}`);
    return null;
  }
}

/**
 * Extracts Add* extension methods from api-ripper output
 */
function extractExtensionMethods(apiData) {
  const methods = [];
  
  if (!apiData?.assemblies) return methods;
  
  for (const assembly of apiData.assemblies) {
    for (const ns of assembly.namespaces || []) {
      for (const type of ns.types || []) {
        // Look for extension method classes (usually end with Extensions or BuilderExtensions)
        if (type.isStatic || type.name.endsWith('Extensions') || type.name.endsWith('BuilderExtensions')) {
          for (const method of type.methods || []) {
            // Find Add* methods that take IDistributedApplicationBuilder
            if (method.name.startsWith('Add') && method.signature?.includes('IDistributedApplicationBuilder')) {
              methods.push({
                name: method.name,
                signature: method.signature,
                summary: method.summary || '',
                typeName: type.name,
                namespace: ns.name,
              });
            }
          }
        }
      }
    }
  }
  
  return methods;
}

/**
 * Generates a resource ID from a method name
 */
function methodNameToResourceId(methodName) {
  // AddPostgres -> postgres, AddRabbitMQ -> rabbitmq, AddNodeApp -> nodeapp
  return methodName.replace(/^Add/, '').toLowerCase();
}

/**
 * Generates example code from an Add method
 */
function generateExampleCode(methodName, resourceId) {
  const varName = resourceId.replace(/[^a-z0-9]/g, '');
  
  if (methodName === 'AddDatabase') {
    return `var db = ${varName}.AddDatabase("mydb");`;
  }
  
  return `var ${varName} = builder.${methodName}("${varName}");`;
}

/**
 * Generates the TypeScript output file content
 */
function generateTypeScriptFile(resources, sdkVersion) {
  const timestamp = new Date().toISOString();
  
  // Collect unique icon imports
  const iconImports = new Set();
  for (const r of resources) {
    if (r.iconImport) {
      iconImports.add(r.iconImport);
    }
  }
  
  // Map icon imports to paths
  const iconPathMap = {
    postgresIcon: '../assets/icons/postgresql-icon.png',
    sqlServerIcon: '../assets/icons/sql-icon.png',
    mongodbIcon: '../assets/icons/mongodb-icon.png',
    mysqlIcon: '../assets/icons/mysqlconnector-icon.png',
    oracleIcon: '../assets/icons/oracle-icon.svg',
    redisIcon: '../assets/icons/redis-icon.png',
    valkeyIcon: '../assets/icons/valkey-icon.png',
    garnetIcon: '../assets/icons/garnet-icon.png',
    rabbitmqIcon: '../assets/icons/rabbitmq-icon.svg',
    kafkaIcon: '../assets/icons/apache-kafka-icon.svg',
    natsIcon: '../assets/icons/nats-icon.png',
    openaiIcon: '../assets/icons/openai-icon.png',
    ollamaIcon: '../assets/icons/ollama-icon.png',
    nodejsIcon: '../assets/icons/nodejs-icon.png',
    pythonIcon: '../assets/icons/python.svg',
    reactIcon: '../assets/icons/react-icon.svg',
    dockerIcon: '../assets/icons/docker.svg',
    csharpIcon: '../assets/icons/csharp.svg',
  };
  
  const importLines = Array.from(iconImports)
    .filter(imp => iconPathMap[imp])
    .map(imp => `import ${imp} from '${iconPathMap[imp]}';`)
    .join('\n');

  // Build resource array with icon variable references
  const resourcesJson = resources.map(r => {
    const { iconImport, ...rest } = r;
    return { ...rest, icon: `__ICON_${iconImport}__` };
  });

  let resourcesStr = JSON.stringify(resourcesJson, null, 2);
  // Replace icon placeholders with actual variable references
  for (const imp of iconImports) {
    resourcesStr = resourcesStr.replace(new RegExp(`"__ICON_${imp}__"`, 'g'), imp);
  }

  return `/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated from Aspire NuGet packages via api-ripper
 * Generation date: ${timestamp}
 * Aspire SDK version: ${sdkVersion}
 * 
 * To regenerate: npm run generate-resources
 * 
 * This file combines:
 * - Technical API data from Aspire NuGet packages (via api-ripper)
 * - Human-readable descriptions from aspire.dev documentation
 */

// Import icons
${importLines}

export interface AspireResource {
  id: string;
  name: string;
  displayName: string;
  category: 'database' | 'cache' | 'messaging' | 'ai' | 'compute' | 'project';
  icon: string;
  color: string;
  description: string;
  package: string;
  hostingMethod: string;
  languages: string[];
  connectionMethod?: string;
  allowsDatabase?: boolean;
  exampleCode: string;
  nugetPackage?: string;
}

export const aspireResources: AspireResource[] = ${resourcesStr};

export const resourceCategories = [
  { id: 'project', name: 'Apps', icon: '💻', color: '#0078D4' },
  { id: 'database', name: 'Databases', icon: '🗄️', color: '#107C10' },
  { id: 'cache', name: 'Caching', icon: '⚡', color: '#FFB900' },
  { id: 'messaging', name: 'Messaging', icon: '📬', color: '#E74856' },
  { id: 'ai', name: 'AI', icon: '🧠', color: '#00BCF2' },
  { id: 'compute', name: 'Compute', icon: '🔧', color: '#8764B8' },
];
`;
}

async function main() {
  console.log('🚀 Starting resource generation from NuGet packages...\n');
  
  // Check if api-ripper exists
  if (!existsSync(API_RIPPER_PATH)) {
    console.error(`❌ api-ripper not found at ${API_RIPPER_PATH}`);
    console.error('Please clone api-ripper repository');
    process.exit(1);
  }
  
<<<<<<< Updated upstream
  console.log('📡 Fetching latest package versions from NuGet...\n');
  
  // Fetch all versions in parallel
  const versionPromises = PACKAGES.map(async (packageName) => {
    const version = await getLatestNuGetVersion(packageName);
    return { packageName, version };
  });
  
  const packageVersions = await Promise.all(versionPromises);
  const versionMap = new Map(packageVersions.map(pv => [pv.packageName, pv.version]));
  
  // Also fetch versions for manual resource packages
  const manualPackages = ['Aspire.Hosting.AppHost', 'Aspire.Hosting', 'Aspire.Hosting.JavaScript'];
  for (const pkg of manualPackages) {
    if (!versionMap.has(pkg)) {
      versionMap.set(pkg, await getLatestNuGetVersion(pkg));
    }
  }
  
  console.log('\n');
  
  const allResources = [];
  
  for (const packageName of PACKAGES) {
    const version = versionMap.get(packageName);
    const apiData = runApiRipper(packageName, version);
    
    if (apiData) {
      const resources = extractResourceInfo(apiData, packageName, version);
      allResources.push(...resources);
      console.log(`✅ Extracted ${resources.length} resources from ${packageName}@${version}\n`);
    }
  }
  
  // Get versions for manual resources
  const appHostVersion = versionMap.get('Aspire.Hosting.AppHost');
  const hostingVersion = versionMap.get('Aspire.Hosting');
  const jsVersion = versionMap.get('Aspire.Hosting.JavaScript');
  
  // Add manual resources that don't come from NuGet
  const manualResources = [
    {
      id: 'dotnet-project',
      name: 'apiservice',
      displayName: 'C# Project',
      category: 'project',
      icon: '🔷',
      color: '#512BD4',
      description: '.NET API or service project',
      package: 'Aspire.Hosting.AppHost',
      hostingMethod: 'Project Reference',
      languages: ['C#'],
      exampleCode: 'var api = builder.AddProject<Projects.ApiService>("apiservice");',
      nugetPackage: `Aspire.Hosting.AppHost@${appHostVersion}`,
    },
    {
      id: 'vite-app',
      name: 'frontend',
      displayName: 'Vite App',
      category: 'project',
      icon: '⚡',
      color: '#646CFF',
      description: 'Vite-powered frontend application',
      package: 'Aspire.Hosting.JavaScript',
      hostingMethod: 'NPM',
      languages: ['JavaScript', 'TypeScript', 'React', 'Vue'],
      exampleCode: 'var frontend = builder.AddViteApp("frontend", "../frontend")\\n    .WithHttpEndpoint(env: "PORT");',
      nugetPackage: `Aspire.Hosting.JavaScript@${jsVersion}`,
    },
    {
      id: 'container',
      name: 'service',
      displayName: 'Container',
      category: 'compute',
      icon: '🐳',
      color: '#2496ED',
      description: 'Custom Docker container',
      package: 'Aspire.Hosting',
      hostingMethod: 'Container',
      languages: ['Any'],
      exampleCode: 'var service = builder.AddContainer("service", "myregistry/service", "latest")\\n    .WithHttpEndpoint(targetPort: 8080);',
      nugetPackage: `Aspire.Hosting@${hostingVersion}`,
    },
    {
      id: 'openai',
      name: 'openai',
      displayName: 'OpenAI',
      category: 'ai',
      icon: '🧠',
      color: '#10A37F',
      description: 'OpenAI API integration',
      package: 'Aspire.Hosting',
      hostingMethod: 'Connection String',
      languages: ['C#', 'Python', 'JavaScript'],
      connectionMethod: 'API Key',
      exampleCode: 'var openai = builder.AddConnectionString("openai");',
    },
  ];
=======
  // Check if api-ripper is built
  if (!existsSync(join(API_RIPPER_PATH, 'dist', 'index.js'))) {
    console.log('📦 Building api-ripper...');
    try {
      execSync('npm run build', { cwd: API_RIPPER_PATH, stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Failed to build api-ripper');
      process.exit(1);
    }
  }
  
  console.log('📡 Fetching package versions from NuGet...\n');
>>>>>>> Stashed changes
  
  // Fetch versions for all packages
  const packageVersions = new Map();
  let sdkVersion = null;
  
  for (const pkg of PACKAGES) {
    const version = await getLatestNuGetVersion(pkg);
    if (version) {
      packageVersions.set(pkg, version);
      if (!sdkVersion) sdkVersion = version; // Use first version as SDK version
      console.log(`  📦 ${pkg}: ${version}`);
    } else {
      console.warn(`  ⚠️ Could not find version for ${pkg}`);
    }
  }
  
  console.log('\n📥 Downloading and analyzing packages...\n');
  
  const discoveredResources = new Map();
  
  for (const [packageName, version] of packageVersions) {
    console.log(`\n🔍 Processing ${packageName}@${version}...`);
    
    // Download package
    const nupkgPath = await downloadNuGetPackage(packageName, version);
    if (!nupkgPath) continue;
    
    // Run api-ripper
    const apiData = runApiRipper(nupkgPath);
    if (!apiData) continue;
    
    // Extract Add* methods
    const methods = extractExtensionMethods(apiData);
    console.log(`  ✅ Found ${methods.length} extension methods`);
    
    for (const method of methods) {
      const resourceId = methodNameToResourceId(method.name);
      
      // Skip AddDatabase and other sub-methods
      if (method.name === 'AddDatabase') continue;
      
      // Get metadata from our curated list
      const metadata = RESOURCE_METADATA[resourceId];
      if (!metadata) {
        console.log(`  ℹ️ No metadata for ${method.name} (${resourceId})`);
        continue;
      }
      
      // Skip if already processed
      if (discoveredResources.has(resourceId)) continue;
      
      // Use summary from API if available, fallback to curated description
      const description = method.summary?.trim() || metadata.description;
      
      discoveredResources.set(resourceId, {
        id: resourceId,
        name: resourceId,
        displayName: metadata.displayName,
        category: metadata.category,
        iconImport: metadata.iconImport,
        color: metadata.color,
        description: description,
        package: packageName,
        hostingMethod: method.name,
        languages: metadata.languages,
        allowsDatabase: metadata.allowsDatabase,
        connectionMethod: metadata.allowsDatabase ? 'AddDatabase' : undefined,
        exampleCode: generateExampleCode(method.name, resourceId),
        nugetPackage: `${packageName}@${version}`,
      });
      
      console.log(`  ✅ Added ${metadata.displayName} (${method.name})`);
    }
  }
  
  // Add manual resources
  console.log('\n📝 Adding manual resources...');
  for (const manual of MANUAL_RESOURCES) {
    if (!discoveredResources.has(manual.id)) {
      discoveredResources.set(manual.id, manual);
      console.log(`  ✅ Added ${manual.displayName}`);
    }
  }
  
  // Sort resources by category then name
  const sortedResources = Array.from(discoveredResources.values()).sort((a, b) => {
    const categoryOrder = ['project', 'database', 'cache', 'messaging', 'ai', 'compute'];
    const aIdx = categoryOrder.indexOf(a.category);
    const bIdx = categoryOrder.indexOf(b.category);
    if (aIdx !== bIdx) return aIdx - bIdx;
    return a.displayName.localeCompare(b.displayName);
  });
  
  // Generate output
  console.log('\n📝 Generating TypeScript file...');
  const tsContent = generateTypeScriptFile(sortedResources, sdkVersion || '13.0.0');
  
  // Write output file
  const outputDir = dirname(OUTPUT_FILE);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  
  writeFileSync(OUTPUT_FILE, tsContent, 'utf-8');
  
  console.log(`\n✅ Generated ${sortedResources.length} resources`);
  console.log(`📝 Output: ${OUTPUT_FILE}`);
  console.log('\n🎉 Resource generation complete!');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
