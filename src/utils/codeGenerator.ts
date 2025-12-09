import type { Node, Edge } from '@xyflow/react';
import type { AspireNodeData } from '../components/playground/AspireNode';

export interface DeploymentCommand {
  command: string;
  docsUrl: string;
}

export interface GeneratedCode {
  appHost: string;
  nugetPackages: string[];
  deploymentOptions: DeploymentCommand[];
  appSettings?: string;
  dockerfile?: string;
  azureManifest?: string;
}

export function generateAppHostCode(nodes: Node<AspireNodeData>[], edges: Edge[]): GeneratedCode {
  const nugetPackages = new Set<string>();
  const resourceDeclarations: string[] = [];

  // Build reference graph
  const references = new Map<string, string[]>();
  edges.forEach(edge => {
    if (!references.has(edge.source)) {
      references.set(edge.source, []);
    }
    references.get(edge.source)!.push(edge.target);
  });

  // Sort nodes by dependencies (topological sort)
  const sortedNodes = topologicalSort(nodes, edges);

  // Generate resource declarations
  sortedNodes.forEach(node => {
    const { resourceType, instanceName, databaseName, envVars, ports, volumes, replicas, persistent } = node.data;

    // Skip if no instance name
    if (!instanceName) return;

    // Sanitize variable names for C#
    const sanitizedInstanceName = sanitizeCSharpIdentifier(instanceName);
    const sanitizedDatabaseName = databaseName ? sanitizeCSharpIdentifier(databaseName) : null;

    let code = '';

    switch (resourceType) {
      // Projects
      case 'dotnet-project':
        code = `var ${sanitizedInstanceName} = builder.AddProject<Projects.${capitalize(sanitizedInstanceName)}>("${instanceName}")`;
        break;

      case 'node-app':
        code = `var ${sanitizedInstanceName} = builder.AddNodeApp("${instanceName}", "../${instanceName}")`;
        nugetPackages.add('Aspire.Hosting.NodeJs@13.0.0');
        break;

      case 'vite-app':
        code = `var ${sanitizedInstanceName} = builder.AddViteApp("${instanceName}", "../${instanceName}")
    .WithHttpEndpoint(env: "PORT")`;
        nugetPackages.add('Aspire.Hosting.NodeJs@13.0.0');
        break;

      case 'python-app':
        code = `var ${sanitizedInstanceName} = builder.AddPythonApp("${instanceName}", "../${instanceName}", "main.py")`;
        nugetPackages.add('Aspire.Hosting.Python@13.0.0');
        break;

      case 'container':
        code = `var ${sanitizedInstanceName} = builder.AddContainer("${instanceName}", "myregistry/${instanceName}", "latest")
    .WithHttpEndpoint(targetPort: 8080)`;
        break;

      // Databases
      case 'postgres':
        code = `var ${sanitizedInstanceName} = builder.AddPostgres("${instanceName}")`;
        if (persistent !== false) {
          code += `
    .WithLifetime(ContainerLifetime.Persistent)`;
        }
        if (sanitizedDatabaseName) {
          code += `;
var ${sanitizedDatabaseName} = ${sanitizedInstanceName}.AddDatabase("${databaseName}")`;
        }
        nugetPackages.add('Aspire.Hosting.PostgreSQL@13.0.0');
        break;

      case 'sqlserver':
        code = `var ${sanitizedInstanceName} = builder.AddSqlServer("${instanceName}")
    .WithLifetime(ContainerLifetime.Persistent)`;
        if (sanitizedDatabaseName) {
          code += `;
var ${sanitizedDatabaseName} = ${sanitizedInstanceName}.AddDatabase("${databaseName}")`;
        }
        nugetPackages.add('Aspire.Hosting.SqlServer@13.0.0');
        break;

      case 'mongodb':
        code = `var ${sanitizedInstanceName} = builder.AddMongoDB("${instanceName}")
    .WithLifetime(ContainerLifetime.Persistent)`;
        if (sanitizedDatabaseName) {
          code += `;
var ${sanitizedDatabaseName} = ${sanitizedInstanceName}.AddDatabase("${databaseName}")`;
        }
        nugetPackages.add('Aspire.Hosting.MongoDB@13.0.0');
        break;

      case 'mysql':
        code = `var ${sanitizedInstanceName} = builder.AddMySql("${instanceName}")
    .WithLifetime(ContainerLifetime.Persistent)`;
        if (sanitizedDatabaseName) {
          code += `;
var ${sanitizedDatabaseName} = ${sanitizedInstanceName}.AddDatabase("${databaseName}")`;
        }
        nugetPackages.add('Aspire.Hosting.MySql@13.0.0');
        break;

      case 'oracle':
        code = `var ${sanitizedInstanceName} = builder.AddOracle("${instanceName}")
    .WithLifetime(ContainerLifetime.Persistent)`;
        if (sanitizedDatabaseName) {
          code += `;
var ${sanitizedDatabaseName} = ${sanitizedInstanceName}.AddDatabase("${databaseName}")`;
        }
        nugetPackages.add('Aspire.Hosting.Oracle@13.0.0');
        break;

      // Cache
      case 'redis':
        code = `var ${sanitizedInstanceName} = builder.AddRedis("${instanceName}")`;
        nugetPackages.add('Aspire.Hosting.Redis@13.0.0');
        break;

      case 'valkey':
        code = `var ${sanitizedInstanceName} = builder.AddValkey("${instanceName}")`;
        nugetPackages.add('Aspire.Hosting.Valkey@13.0.0');
        break;

      case 'garnet':
        code = `var ${sanitizedInstanceName} = builder.AddGarnet("${instanceName}")`;
        nugetPackages.add('Aspire.Hosting.Garnet@13.0.0');
        break;

      // Messaging
      case 'rabbitmq':
        code = `var ${sanitizedInstanceName} = builder.AddRabbitMQ("${instanceName}")`;
        nugetPackages.add('Aspire.Hosting.RabbitMQ@13.0.0');
        break;

      case 'kafka':
        code = `var ${sanitizedInstanceName} = builder.AddKafka("${instanceName}")`;
        nugetPackages.add('Aspire.Hosting.Kafka@13.0.0');
        break;

      case 'nats':
        code = `var ${sanitizedInstanceName} = builder.AddNats("${instanceName}")`;
        nugetPackages.add('Aspire.Hosting.Nats@13.0.0');
        break;

      // AI
      case 'openai':
        code = `var ${sanitizedInstanceName} = builder.AddConnectionString("${instanceName}")`;
        break;

      case 'ollama':
        code = `var ${sanitizedInstanceName} = builder.AddOllama("${instanceName}")`;
        nugetPackages.add('Aspire.Hosting.Ollama@13.0.0');
        break;
    }

    // Add environment variables
    if (envVars && envVars.length > 0) {
      envVars.forEach(env => {
        if (env.key && env.value) {
          code += `
    .WithEnvironment("${env.key}", "${env.value}")`;
        }
      });
    }

    // Add port mappings (for containers)
    if (ports && ports.length > 0) {
      ports.forEach(port => {
        if (port.container) {
          code += `
    .WithHttpEndpoint(${port.host ? `port: ${port.host}, ` : ''}targetPort: ${port.container})`;
        }
      });
    }

    // Add volume mounts
    if (volumes && volumes.length > 0) {
      volumes.forEach(volume => {
        if (volume.source && volume.target) {
          code += `
    .WithBindMount("${volume.source}", "${volume.target}")`;
        }
      });
    }

    // Add replicas
    if (replicas && replicas > 1) {
      code += `
    .WithReplicas(${replicas})`;
    }

    // Add references if this node has dependencies
    const deps = edges.filter(e => e.target === node.id);
    if (deps.length > 0 && code) {
      const sourceNodes = deps.map(dep => nodes.find(n => n.id === dep.source)).filter(Boolean);
      sourceNodes.forEach(sourceNode => {
        const sourceName = sourceNode!.data.databaseName || sourceNode!.data.instanceName;
        if (sourceName) {
          const sanitizedSourceName = sanitizeCSharpIdentifier(sourceName);
          code += `
    .WithReference(${sanitizedSourceName})`;
        }
      });

      // Add WaitFor for database dependencies
      const dbDeps = sourceNodes.filter(n =>
        ['postgres', 'sqlserver', 'mongodb', 'mysql', 'oracle'].includes(n!.data.resourceType)
      );
      if (dbDeps.length > 0) {
        dbDeps.forEach(dbNode => {
          const dbName = dbNode!.data.databaseName || dbNode!.data.instanceName;
          if (dbName) {
            const sanitizedDbName = sanitizeCSharpIdentifier(dbName);
            code += `
    .WaitFor(${sanitizedDbName})`;
          }
        });
      }
    }

    if (code) {
      resourceDeclarations.push(code + ';');
    }
  });

  // Build the header with SDK and package directives
  const packageDirectives = Array.from(nugetPackages)
    .sort()
    .map(pkg => `#:package ${pkg}`)
    .join('\n');

  const header = packageDirectives
    ? `#:sdk Aspire.AppHost.Sdk@13.0.0\n${packageDirectives}\n`
    : `#:sdk Aspire.AppHost.Sdk@13.0.0\n`;

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

  // Generate appsettings.json
  const appSettings = generateAppSettings(nodes);

  // Generate Dockerfile for container projects
  const dockerfile = generateDockerfile(nodes);

  // Generate Azure Container Apps manifest
  const azureManifest = generateAzureManifest(nodes, edges);

  return {
    appHost,
    nugetPackages: Array.from(nugetPackages),
    deploymentOptions,
    appSettings,
    dockerfile,
    azureManifest,
  };
}

function generateAppSettings(nodes: Node<AspireNodeData>[]): string {
  const settings: any = {
    Logging: {
      LogLevel: {
        Default: 'Information',
        'Microsoft.AspNetCore': 'Warning',
      },
    },
    AllowedHosts: '*',
    ConnectionStrings: {},
  };

  nodes.forEach(node => {
    const { resourceType, instanceName, databaseName } = node.data;

    // Add connection strings for databases
    if (['postgres', 'sqlserver', 'mongodb', 'mysql', 'oracle'].includes(resourceType)) {
      const dbName = databaseName || instanceName;
      settings.ConnectionStrings[dbName] = `{${dbName}.connectionString}`;
    }

    // Add Redis connection
    if (['redis', 'valkey', 'garnet'].includes(resourceType)) {
      settings.ConnectionStrings[instanceName] = `{${instanceName}.connectionString}`;
    }

    // Add messaging connection
    if (['rabbitmq', 'kafka', 'nats'].includes(resourceType)) {
      settings.ConnectionStrings[instanceName] = `{${instanceName}.connectionString}`;
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
  const containerApps: any[] = [];

  nodes.forEach(node => {
    const { resourceType, instanceName, envVars, replicas } = node.data;

    if (['dotnet-project', 'node-app', 'vite-app', 'python-app', 'container'].includes(resourceType)) {
      const app: any = {
        name: instanceName,
        properties: {
          configuration: {
            activeRevisionsMode: 'Single',
            ingress: {
              external: true,
              targetPort: 8080,
              transport: 'http',
            },
            registries: [],
          },
          template: {
            containers: [
              {
                name: instanceName,
                image: `myregistry.azurecr.io/${instanceName}:latest`,
                resources: {
                  cpu: 0.5,
                  memory: '1Gi',
                },
              },
            ],
            scale: {
              minReplicas: 1,
              maxReplicas: replicas || 10,
            },
          },
        },
      };

      // Add environment variables
      if (envVars && envVars.length > 0) {
        app.properties.template.containers[0].env = envVars.map(env => ({
          name: env.key,
          value: env.value,
        }));
      }

      containerApps.push(app);
    }
  });

  return JSON.stringify({ containerApps }, null, 2);
}

function topologicalSort(nodes: Node<AspireNodeData>[], edges: Edge[]): Node<AspireNodeData>[] {
  const graph = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // Initialize
  nodes.forEach(node => {
    graph.set(node.id, []);
    inDegree.set(node.id, 0);
  });

  // Build graph
  edges.forEach(edge => {
    graph.get(edge.source)!.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });

  // Kahn's algorithm
  const queue: string[] = [];
  const result: Node<AspireNodeData>[] = [];

  // Find nodes with no dependencies
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId);
    }
  });

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      result.push(node);
    }

    graph.get(nodeId)!.forEach(neighbor => {
      const newDegree = inDegree.get(neighbor)! - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    });
  }

  return result;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function sanitizeCSharpIdentifier(name: string): string {
  // Replace invalid characters with spaces for camelCase conversion
  let sanitized = name.replace(/[^a-zA-Z0-9]/g, ' ');
  
  // Convert to camelCase
  sanitized = sanitized
    .split(' ')
    .filter(word => word.length > 0)
    .map((word, index) => {
      if (index === 0) {
        // First word: lowercase
        return word.charAt(0).toLowerCase() + word.slice(1).toLowerCase();
      } else {
        // Subsequent words: capitalize first letter
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
    })
    .join('');

  // Ensure it doesn't start with a digit
  if (/^[0-9]/.test(sanitized)) {
    sanitized = 'n' + sanitized;
  }

  // If empty, provide a default
  if (!sanitized) {
    sanitized = 'resource';
  }

  return sanitized;
}
