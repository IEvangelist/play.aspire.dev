import type { Node, Edge } from '@xyflow/react';
import type { AspireNodeData } from '../components/playground/AspireNode';
import { aspireResources, type AspireResource } from '../data/aspire-resources';

export interface DeploymentCommand {
  command: string;
  docsUrl: string;
}

export type AppHostLanguage = 'csharp' | 'typescript';

export interface GeneratedCode {
  appHost: string;
  nugetPackages: string[];
  deploymentOptions: DeploymentCommand[];
  appSettings?: string;
  dockerfile?: string;
  azureManifest?: string;
  aspireConfig?: string;
  language: AppHostLanguage;
}

const SDK_VERSION = '13.1.1';

// Look up the resource definition by its ID
function findResourceDef(resourceType: string): AspireResource | undefined {
  return aspireResources.find(r => r.id === resourceType);
}

// Categories that represent infrastructure (databases, caches, messaging)
// and should get WithLifetime(Persistent) or WaitFor
const INFRASTRUCTURE_CATEGORIES = ['database', 'cache', 'messaging'];

// Resources that need path-based arguments in their builder call
const PATH_BASED_RESOURCES: Record<string, (name: string) => string> = {
  'dotnet-project': (name) => `builder.AddProject<Projects.${capitalize(sanitizeCSharpIdentifier(name))}>("${name}")`,
  'container': (name) => `builder.AddContainer("${name}", "myregistry/${name}", "latest")\n    .WithHttpEndpoint(targetPort: 8080)`,
  'nodeapp': (name) => `builder.AddNodeApp("${name}", "../${name}")`,
  'javascriptapp': (name) => `builder.AddJavaScriptApp("${name}", "../${name}")`,
  'viteapp': (name) => `builder.AddViteApp("${name}", "../${name}")\n    .WithHttpEndpoint(env: "PORT")`,
  'pythonapp': (name) => `builder.AddPythonApp("${name}", "../${name}", "main.py")`,
  'pythonexecutable': (name) => `builder.AddPythonExecutable("${name}", "../${name}", "main.py")`,
  'pythonmodule': (name) => `builder.AddPythonModule("${name}", "../${name}")`,
  'uvicornapp': (name) => `builder.AddUvicornApp("${name}", "../${name}", "main:app")`,
};

function generateResourceCode(
  node: Node<AspireNodeData>,
  nugetPackages: Set<string>,
): string {
  const { resourceType, instanceName, databaseName, persistent } = node.data;
  if (!instanceName) return '';

  const sanitizedInstanceName = sanitizeCSharpIdentifier(instanceName);
  const sanitizedDatabaseName = databaseName ? sanitizeCSharpIdentifier(databaseName) : null;
  const resourceDef = findResourceDef(resourceType);

  let code = '';

  // Use path-based override if it exists, otherwise generate from hostingMethod
  if (PATH_BASED_RESOURCES[resourceType]) {
    code = `var ${sanitizedInstanceName} = ${PATH_BASED_RESOURCES[resourceType](instanceName)}`;
  } else if (resourceDef) {
    code = `var ${sanitizedInstanceName} = builder.${resourceDef.hostingMethod}("${instanceName}")`;
  } else {
    // Unknown resource — best effort using the type as-is
    const method = 'Add' + capitalize(resourceType);
    code = `var ${sanitizedInstanceName} = builder.${method}("${instanceName}")`;
  }

  // Add persistent lifetime for database resources (unless explicitly disabled)
  if (resourceDef && resourceDef.category === 'database' && persistent !== false) {
    code += `\n    .WithLifetime(ContainerLifetime.Persistent)`;
  }

  // Add child database resource if applicable
  if (resourceDef?.allowsDatabase && sanitizedDatabaseName) {
    code += `;\nvar ${sanitizedDatabaseName} = ${sanitizedInstanceName}.${resourceDef.connectionMethod || 'AddDatabase'}("${databaseName}")`;
  }

  // Track NuGet package from resource definition
  if (resourceDef?.nugetPackage) {
    nugetPackages.add(resourceDef.nugetPackage);
  }

  return code;
}

export function generateAppHostCode(nodes: Node<AspireNodeData>[], edges: Edge[], language: AppHostLanguage = 'csharp'): GeneratedCode {
  if (language === 'typescript') {
    return generateTypeScriptAppHost(nodes, edges);
  }
  return generateCSharpAppHost(nodes, edges);
}

function generateCSharpAppHost(nodes: Node<AspireNodeData>[], edges: Edge[]): GeneratedCode {
  const nugetPackages = new Set<string>();
  const resourceDeclarations: string[] = [];

  // Sort nodes by dependencies (topological sort)
  const sortedNodes = topologicalSort(nodes, edges);

  // Generate resource declarations
  sortedNodes.forEach(node => {
    const { instanceName, envVars, ports, volumes, replicas } = node.data;
    if (!instanceName) return;

    let code = generateResourceCode(node, nugetPackages);
    if (!code) return;

    // Add environment variables
    if (envVars && envVars.length > 0) {
      envVars.forEach(env => {
        if (env.key && env.value) {
          code += `\n    .WithEnvironment("${env.key}", "${env.value}")`;
        }
      });
    }

    // Add port mappings
    if (ports && ports.length > 0) {
      ports.forEach(port => {
        if (port.container) {
          code += `\n    .WithHttpEndpoint(${port.host ? `port: ${port.host}, ` : ''}targetPort: ${port.container})`;
        }
      });
    }

    // Add volume mounts
    if (volumes && volumes.length > 0) {
      volumes.forEach(volume => {
        if (volume.source && volume.target) {
          code += `\n    .WithBindMount("${volume.source}", "${volume.target}")`;
        }
      });
    }

    // Add replicas
    if (replicas && replicas > 1) {
      code += `\n    .WithReplicas(${replicas})`;
    }

    // Add references from incoming edges (this node depends on source nodes)
    const deps = edges.filter(e => e.target === node.id);
    if (deps.length > 0) {
      const sourceNodes = deps.map(dep => nodes.find(n => n.id === dep.source)).filter(Boolean);
      sourceNodes.forEach(sourceNode => {
        const sourceName = sourceNode!.data.databaseName || sourceNode!.data.instanceName;
        if (sourceName) {
          code += `\n    .WithReference(${sanitizeCSharpIdentifier(sourceName)})`;
        }
      });

      // Add WaitFor for infrastructure dependencies (databases, caches, messaging)
      const infraDeps = sourceNodes.filter(n => {
        const def = findResourceDef(n!.data.resourceType);
        return def && INFRASTRUCTURE_CATEGORIES.includes(def.category);
      });
      infraDeps.forEach(infraNode => {
        const infraName = infraNode!.data.databaseName || infraNode!.data.instanceName;
        if (infraName) {
          code += `\n    .WaitFor(${sanitizeCSharpIdentifier(infraName)})`;
        }
      });
    }

    resourceDeclarations.push(code + ';');
  });

  // Build the header with SDK and package directives
  const packageDirectives = Array.from(nugetPackages)
    .sort()
    .map(pkg => `#:package ${pkg}`)
    .join('\n');

  const header = packageDirectives
    ? `#:sdk Aspire.AppHost.Sdk@${SDK_VERSION}\n${packageDirectives}\n`
    : `#:sdk Aspire.AppHost.Sdk@${SDK_VERSION}\n`;

  const appHost = `${header}
var builder = DistributedApplication.CreateBuilder(args);

${resourceDeclarations.join('\n\n')}

builder.Build().Run();`;

  const deploymentOptions: DeploymentCommand[] = [
    { command: 'aspire run', docsUrl: 'https://aspire.dev/reference/cli/commands/aspire-run/' },
    { command: 'aspire publish', docsUrl: 'https://aspire.dev/reference/cli/commands/aspire-publish/' },
    { command: 'aspire deploy', docsUrl: 'https://aspire.dev/reference/cli/commands/aspire-deploy/' },
    { command: 'aspire deploy --environment staging', docsUrl: 'https://aspire.dev/reference/cli/commands/aspire-deploy/' },
    { command: 'aspire do build', docsUrl: 'https://aspire.dev/reference/cli/commands/aspire-do/' },
  ];

  return {
    appHost,
    nugetPackages: Array.from(nugetPackages),
    deploymentOptions,
    appSettings: generateAppSettings(nodes),
    dockerfile: generateDockerfile(nodes),
    azureManifest: generateAzureManifest(nodes, edges),
    language: 'csharp',
  };
}

function generateAppSettings(nodes: Node<AspireNodeData>[]): string {
  const settings: Record<string, unknown> = {
    Logging: {
      LogLevel: {
        Default: 'Information',
        'Microsoft.AspNetCore': 'Warning',
      },
    },
    AllowedHosts: '*',
    ConnectionStrings: {} as Record<string, string>,
  };

  const connStrings = settings.ConnectionStrings as Record<string, string>;

  nodes.forEach(node => {
    const { resourceType, instanceName, databaseName } = node.data;
    const def = findResourceDef(resourceType);
    if (!def || !instanceName) return;

    // Databases get connection strings keyed by database name (or instance)
    if (def.category === 'database') {
      const name = databaseName || instanceName;
      connStrings[name] = `{${name}.connectionString}`;
    }
    // Caches and messaging get connection strings keyed by instance name
    if (def.category === 'cache' || def.category === 'messaging') {
      connStrings[instanceName] = `{${instanceName}.connectionString}`;
    }
  });

  return JSON.stringify(settings, null, 2);
}

function generateDockerfile(nodes: Node<AspireNodeData>[]): string {
  const hasContainers = nodes.some(n => n.data.resourceType === 'container');

  if (!hasContainers) {
    return `# Example Dockerfile for Aspire API projects
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["YourProject.csproj", "./"]
RUN dotnet restore "YourProject.csproj"
COPY . .
RUN dotnet build "YourProject.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "YourProject.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "YourProject.dll"]`;
  }

  return `# Dockerfile for custom container
FROM alpine:latest
WORKDIR /app
COPY . .
EXPOSE 8080
CMD ["./start.sh"]`;
}

function generateAzureManifest(nodes: Node<AspireNodeData>[], _edges: Edge[]): string {
  const containerApps: Record<string, unknown>[] = [];

  nodes.forEach(node => {
    const { instanceName, envVars, replicas } = node.data;
    const def = findResourceDef(node.data.resourceType);
    if (!def || !instanceName) return;

    // Only project-type and container resources become container apps
    if (def.category !== 'project' && node.data.resourceType !== 'container') return;

    const app: Record<string, unknown> = {
      name: instanceName,
      properties: {
        configuration: {
          activeRevisionsMode: 'Single',
          ingress: { external: true, targetPort: 8080, transport: 'http' },
          registries: [],
        },
        template: {
          containers: [
            {
              name: instanceName,
              image: `myregistry.azurecr.io/${instanceName}:latest`,
              resources: { cpu: 0.5, memory: '1Gi' },
              ...(envVars && envVars.length > 0
                ? { env: envVars.map(env => ({ name: env.key, value: env.value })) }
                : {}),
            },
          ],
          scale: { minReplicas: 1, maxReplicas: replicas || 10 },
        },
      },
    };

    containerApps.push(app);
  });

  return JSON.stringify({ containerApps }, null, 2);
}

// ──────────────────────────────────────────────
// TypeScript AppHost code generation
// ──────────────────────────────────────────────

// Convert a C# PascalCase hosting method like "AddPostgres" to camelCase "addPostgres"
function toCamelCase(method: string): string {
  return method.charAt(0).toLowerCase() + method.slice(1);
}

// TypeScript path-based resource builders (camelCase, await-based)
const TS_PATH_BASED_RESOURCES: Record<string, (name: string) => string> = {
  'dotnet-project': (name) => `await builder.addProject("${name}", "../${sanitizeTsIdentifier(name)}/${capitalize(sanitizeTsIdentifier(name))}.csproj", "https")`,
  'container': (name) => `await builder.addContainer("${name}", "myregistry/${name}", "latest")\n    .withHttpEndpoint({ targetPort: 8080 })`,
  'nodeapp': (name) => `await builder.addNodeApp("${name}", "../${name}", "server.js")\n    .withNpm()`,
  'javascriptapp': (name) => `await builder.addJavaScriptApp("${name}", "../${name}")`,
  'viteapp': (name) => `await builder.addViteApp("${name}", "../${name}")\n    .withHttpEndpoint({ env: "PORT" })`,
  'pythonapp': (name) => `await builder.addPythonApp("${name}", "../${name}", "main.py")`,
  'pythonexecutable': (name) => `await builder.addPythonExecutable("${name}", "../${name}", "main.py")`,
  'pythonmodule': (name) => `await builder.addPythonModule("${name}", "../${name}")`,
  'uvicornapp': (name) => `await builder.addUvicornApp("${name}", "../${name}", "main:app")\n    .withUv()`,
};

function generateTsResourceCode(
  node: Node<AspireNodeData>,
  npmPackages: Set<string>,
): string {
  const { resourceType, instanceName, databaseName, persistent } = node.data;
  if (!instanceName) return '';

  const tsVarName = sanitizeTsIdentifier(instanceName);
  const tsDatabaseName = databaseName ? sanitizeTsIdentifier(databaseName) : null;
  const resourceDef = findResourceDef(resourceType);

  let code = '';

  if (TS_PATH_BASED_RESOURCES[resourceType]) {
    code = `const ${tsVarName} = ${TS_PATH_BASED_RESOURCES[resourceType](instanceName)}`;
  } else if (resourceDef) {
    const tsMethod = toCamelCase(resourceDef.hostingMethod);
    code = `const ${tsVarName} = await builder.${tsMethod}("${instanceName}")`;
  } else {
    const method = toCamelCase('Add' + capitalize(resourceType));
    code = `const ${tsVarName} = await builder.${method}("${instanceName}")`;
  }

  // Add persistent lifetime for database resources
  if (resourceDef && resourceDef.category === 'database' && persistent !== false) {
    code += `\n    .withLifetime("persistent")`;
  }

  // Add child database resource
  if (resourceDef?.allowsDatabase && tsDatabaseName) {
    const tsConnMethod = toCamelCase(resourceDef.connectionMethod || 'AddDatabase');
    code += `;\nconst ${tsDatabaseName} = ${tsVarName}.${tsConnMethod}("${databaseName}")`;
  }

  // Track npm package (same as NuGet name for reference)
  if (resourceDef?.nugetPackage) {
    npmPackages.add(resourceDef.nugetPackage);
  }

  return code;
}

function generateTypeScriptAppHost(nodes: Node<AspireNodeData>[], edges: Edge[]): GeneratedCode {
  const npmPackages = new Set<string>();
  const resourceDeclarations: string[] = [];

  const sortedNodes = topologicalSort(nodes, edges);

  sortedNodes.forEach(node => {
    const { instanceName, envVars, ports, volumes, replicas } = node.data;
    if (!instanceName) return;

    let code = generateTsResourceCode(node, npmPackages);
    if (!code) return;

    // Environment variables
    if (envVars && envVars.length > 0) {
      envVars.forEach(env => {
        if (env.key && env.value) {
          code += `\n    .withEnvironment("${env.key}", "${env.value}")`;
        }
      });
    }

    // Port mappings
    if (ports && ports.length > 0) {
      ports.forEach(port => {
        if (port.container) {
          const opts: string[] = [];
          if (port.host) opts.push(`port: ${port.host}`);
          opts.push(`targetPort: ${port.container}`);
          code += `\n    .withHttpEndpoint({ ${opts.join(', ')} })`;
        }
      });
    }

    // Volume mounts
    if (volumes && volumes.length > 0) {
      volumes.forEach(volume => {
        if (volume.source && volume.target) {
          code += `\n    .withBindMount("${volume.source}", "${volume.target}")`;
        }
      });
    }

    // Replicas
    if (replicas && replicas > 1) {
      code += `\n    .withReplicas(${replicas})`;
    }

    // References from incoming edges
    const deps = edges.filter(e => e.target === node.id);
    if (deps.length > 0) {
      const sourceNodes = deps.map(dep => nodes.find(n => n.id === dep.source)).filter(Boolean);
      sourceNodes.forEach(sourceNode => {
        const sourceName = sourceNode!.data.databaseName || sourceNode!.data.instanceName;
        if (sourceName) {
          code += `\n    .withReference(${sanitizeTsIdentifier(sourceName)})`;
        }
      });

      // WaitFor for infrastructure dependencies
      const infraDeps = sourceNodes.filter(n => {
        const def = findResourceDef(n!.data.resourceType);
        return def && INFRASTRUCTURE_CATEGORIES.includes(def.category);
      });
      infraDeps.forEach(infraNode => {
        const infraName = infraNode!.data.databaseName || infraNode!.data.instanceName;
        if (infraName) {
          code += `\n    .waitFor(${sanitizeTsIdentifier(infraName)})`;
        }
      });
    }

    resourceDeclarations.push(code + ';');
  });

  // Build the packages comment (aspire add commands instead of NuGet)
  const packageComments = Array.from(npmPackages)
    .sort()
    .map(pkg => `// aspire add ${pkg.replace(/Aspire\.Hosting\./i, '').replace(/@.*$/, '').toLowerCase()}`)
    .join('\n');

  const header = packageComments
    ? `// Aspire TypeScript AppHost\n// For more information, see: https://aspire.dev\n${packageComments}\n`
    : `// Aspire TypeScript AppHost\n// For more information, see: https://aspire.dev\n`;

  const appHost = `${header}
import { createBuilder } from './.modules/aspire.js';

const builder = await createBuilder();

${resourceDeclarations.join('\n\n')}

await builder.build().run();`;

  const deploymentOptions: DeploymentCommand[] = [
    { command: 'aspire run', docsUrl: 'https://aspire.dev/reference/cli/commands/aspire-run/' },
    { command: 'aspire publish', docsUrl: 'https://aspire.dev/reference/cli/commands/aspire-publish/' },
    { command: 'aspire deploy', docsUrl: 'https://aspire.dev/reference/cli/commands/aspire-deploy/' },
    { command: 'aspire deploy --environment staging', docsUrl: 'https://aspire.dev/reference/cli/commands/aspire-deploy/' },
    { command: 'aspire do build', docsUrl: 'https://aspire.dev/reference/cli/commands/aspire-do/' },
  ];

  return {
    appHost,
    nugetPackages: Array.from(npmPackages),
    deploymentOptions,
    appSettings: generateAppSettings(nodes),
    dockerfile: generateDockerfile(nodes),
    azureManifest: generateAzureManifest(nodes, edges),
    aspireConfig: generateAspireConfig(npmPackages),
    language: 'typescript',
  };
}

function generateAspireConfig(packages: Set<string>): string {
  const pkgEntries: Record<string, string> = {
    'Aspire.Hosting.JavaScript': SDK_VERSION,
  };
  packages.forEach(pkg => {
    const [name, version] = pkg.split('@');
    if (name && name !== 'Aspire.Hosting.JavaScript') {
      pkgEntries[name] = version || SDK_VERSION;
    }
  });

  const config = {
    appHost: {
      path: 'apphost.ts',
      language: 'typescript/nodejs',
    },
    packages: pkgEntries,
    profiles: {
      https: {
        applicationUrl: 'https://localhost:17127;http://localhost:15118',
        environmentVariables: {
          ASPIRE_DASHBOARD_OTLP_ENDPOINT_URL: 'https://localhost:21169',
          ASPIRE_RESOURCE_SERVICE_ENDPOINT_URL: 'https://localhost:22260',
        },
      },
    },
  };

  return JSON.stringify(config, null, 2);
}

function sanitizeTsIdentifier(name: string): string {
  let sanitized = name.replace(/[^a-zA-Z0-9]/g, ' ');
  sanitized = sanitized
    .split(' ')
    .filter(word => word.length > 0)
    .map((word, index) => {
      if (index === 0) {
        return word.charAt(0).toLowerCase() + word.slice(1).toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
  if (/^[0-9]/.test(sanitized)) sanitized = 'n' + sanitized;
  if (!sanitized) sanitized = 'resource';
  return sanitized;
}

function topologicalSort(nodes: Node<AspireNodeData>[], edges: Edge[]): Node<AspireNodeData>[] {
  const graph = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  nodes.forEach(node => {
    graph.set(node.id, []);
    inDegree.set(node.id, 0);
  });

  edges.forEach(edge => {
    graph.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });

  const queue: string[] = [];
  const result: Node<AspireNodeData>[] = [];

  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) queue.push(nodeId);
  });

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const node = nodes.find(n => n.id === nodeId);
    if (node) result.push(node);

    graph.get(nodeId)?.forEach(neighbor => {
      const newDegree = inDegree.get(neighbor)! - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    });
  }

  return result;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function sanitizeCSharpIdentifier(name: string): string {
  let sanitized = name.replace(/[^a-zA-Z0-9]/g, ' ');

  sanitized = sanitized
    .split(' ')
    .filter(word => word.length > 0)
    .map((word, index) => {
      if (index === 0) {
        return word.charAt(0).toLowerCase() + word.slice(1).toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');

  if (/^[0-9]/.test(sanitized)) sanitized = 'n' + sanitized;
  if (!sanitized) sanitized = 'resource';

  return sanitized;
}
