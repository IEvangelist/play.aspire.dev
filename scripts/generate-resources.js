/**
 * Script to generate resource definitions from NuGet packages using api-ripper
 * 
 * This script:
 * 1. Reads the list of Aspire hosting packages from package-list.json
 * 2. Uses api-ripper to extract API information from each package
 * 3. Generates TypeScript resource definitions in src/data/aspire-resources.ts
 * 
 * Usage: node scripts/generate-resources.js
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_RIPPER_PATH = 'E:\\GitHub\\api-ripper';
const OUTPUT_FILE = join(__dirname, '../src/data/aspire-resources.ts');

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
  'Aspire.Hosting.NodeJs',
  'Aspire.Hosting.Python',
  'Aspire.Hosting.Ollama',
];

const VERSION = '13.0.0';

// Resource metadata mapping (human-curated)
const RESOURCE_METADATA = {
  'PostgreSQL': {
    icon: '🐘',
    color: '#336791',
    category: 'database',
    displayName: 'PostgreSQL',
    description: 'Open-source relational database',
    allowsDatabase: true,
  },
  'SqlServer': {
    icon: '💾',
    color: '#CC2927',
    category: 'database',
    displayName: 'SQL Server',
    description: 'Microsoft SQL Server database',
    allowsDatabase: true,
  },
  'MongoDB': {
    icon: '🍃',
    color: '#47A248',
    category: 'database',
    displayName: 'MongoDB',
    description: 'NoSQL document database',
    allowsDatabase: true,
  },
  'MySql': {
    icon: '🐬',
    color: '#4479A1',
    category: 'database',
    displayName: 'MySQL',
    description: 'Popular open-source relational database',
    allowsDatabase: true,
  },
  'Oracle': {
    icon: '🔶',
    color: '#F80000',
    category: 'database',
    displayName: 'Oracle Database',
    description: 'Enterprise-grade relational database',
    allowsDatabase: true,
  },
  'Redis': {
    icon: '🔴',
    color: '#DC382D',
    category: 'cache',
    displayName: 'Redis',
    description: 'In-memory data structure store',
    allowsDatabase: false,
  },
  'Valkey': {
    icon: '🔵',
    color: '#0E76A8',
    category: 'cache',
    displayName: 'Valkey',
    description: 'Redis-compatible in-memory store',
    allowsDatabase: false,
  },
  'Garnet': {
    icon: '💎',
    color: '#9333EA',
    category: 'cache',
    displayName: 'Garnet',
    description: 'Microsoft\'s Redis-compatible cache',
    allowsDatabase: false,
  },
  'RabbitMQ': {
    icon: '🐰',
    color: '#FF6600',
    category: 'messaging',
    displayName: 'RabbitMQ',
    description: 'Message broker for distributed systems',
    allowsDatabase: false,
  },
  'Kafka': {
    icon: '📨',
    color: '#231F20',
    category: 'messaging',
    displayName: 'Apache Kafka',
    description: 'Distributed event streaming platform',
    allowsDatabase: false,
  },
  'Nats': {
    icon: '📡',
    color: '#34A574',
    category: 'messaging',
    displayName: 'NATS',
    description: 'Cloud-native messaging system',
    allowsDatabase: false,
  },
  'NodeJs': {
    icon: '💚',
    color: '#339933',
    category: 'project',
    displayName: 'Node.js App',
    description: 'JavaScript/TypeScript runtime',
    allowsDatabase: false,
  },
  'Python': {
    icon: '🐍',
    color: '#3776AB',
    category: 'project',
    displayName: 'Python App',
    description: 'Python application hosting',
    allowsDatabase: false,
  },
  'Ollama': {
    icon: '🦙',
    color: '#000000',
    category: 'ai',
    displayName: 'Ollama',
    description: 'Local LLM hosting',
    allowsDatabase: false,
  },
};

function runApiRipper(packageName, version) {
  console.log(`Analyzing ${packageName}@${version}...`);
  
  try {
    const output = execSync(
      `node index.js --package ${packageName} --version ${version} --format json`,
      {
        cwd: API_RIPPER_PATH,
        encoding: 'utf-8',
      }
    );
    
    return JSON.parse(output);
  } catch (error) {
    console.error(`Failed to analyze ${packageName}:`, error.message);
    return null;
  }
}

function extractResourceInfo(apiData, packageName) {
  // Extract extension methods like AddPostgres, AddRedis, etc.
  const methods = apiData?.types?.find(t => t.name === 'IDistributedApplicationBuilder')?.extensionMethods || [];
  
  const addMethods = methods.filter(m => m.name.startsWith('Add'));
  
  return addMethods.map(method => {
    const resourceName = method.name.replace('Add', '');
    const metadata = RESOURCE_METADATA[resourceName] || {
      icon: '📦',
      color: '#888888',
      category: 'compute',
      displayName: resourceName,
      description: `${resourceName} resource`,
      allowsDatabase: false,
    };
    
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
      nugetPackage: `${packageName}@${VERSION}`,
    };
  });
}

function generateExampleCode(resourceName, method) {
  const lowerName = resourceName.toLowerCase();
  
  return `var builder = DistributedApplication.CreateBuilder(args);

var ${lowerName} = builder.Add${resourceName}("${lowerName}");

var api = builder.AddProject<Projects.Api>("api")
    .WithReference(${lowerName});

builder.Build().Run();`;
}

function generateTypeScriptFile(resources) {
  const timestamp = new Date().toISOString();
  
  return `/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * 
 * Generated: ${timestamp}
 * Source: NuGet packages via api-ripper
 * 
 * This file contains Aspire resource definitions extracted from official
 * NuGet packages. To regenerate, run: npm run generate-resources
 */

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

export const aspireResources: AspireResource[] = ${JSON.stringify(resources, null, 2)};

export const resourceCategories = [
  { id: 'project', label: 'Projects' },
  { id: 'database', label: 'Databases' },
  { id: 'cache', label: 'Cache' },
  { id: 'messaging', label: 'Messaging' },
  { id: 'ai', label: 'AI' },
  { id: 'compute', label: 'Compute' },
];
`;
}

async function main() {
  console.log('🚀 Starting resource generation from NuGet packages...\n');
  
  // Check if api-ripper exists
  if (!existsSync(API_RIPPER_PATH)) {
    console.error(`❌ api-ripper not found at ${API_RIPPER_PATH}`);
    console.error('Please clone api-ripper: git clone https://github.com/yourorg/api-ripper');
    process.exit(1);
  }
  
  const allResources = [];
  
  for (const packageName of PACKAGES) {
    const apiData = runApiRipper(packageName, VERSION);
    
    if (apiData) {
      const resources = extractResourceInfo(apiData, packageName);
      allResources.push(...resources);
      console.log(`✅ Extracted ${resources.length} resources from ${packageName}\n`);
    }
  }
  
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
      nugetPackage: 'Aspire.Hosting.AppHost@13.0.0',
    },
    {
      id: 'vite-app',
      name: 'frontend',
      displayName: 'Vite App',
      category: 'project',
      icon: '⚡',
      color: '#646CFF',
      description: 'Vite-powered frontend application',
      package: 'Aspire.Hosting.NodeJs',
      hostingMethod: 'NPM',
      languages: ['JavaScript', 'TypeScript', 'React', 'Vue'],
      exampleCode: 'var frontend = builder.AddViteApp("frontend", "../frontend")\\n    .WithHttpEndpoint(env: "PORT");',
      nugetPackage: 'Aspire.Hosting.NodeJs@13.0.0',
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
      nugetPackage: 'Aspire.Hosting@13.0.0',
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
  
  allResources.push(...manualResources);
  
  // Sort resources
  allResources.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.displayName.localeCompare(b.displayName);
  });
  
  // Generate TypeScript file
  const tsContent = generateTypeScriptFile(allResources);
  
  // Ensure directory exists
  const outputDir = dirname(OUTPUT_FILE);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  
  writeFileSync(OUTPUT_FILE, tsContent, 'utf-8');
  
  console.log(`\n✅ Generated ${allResources.length} resources`);
  console.log(`📝 Output: ${OUTPUT_FILE}`);
  console.log('\n🎉 Resource generation complete!');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
