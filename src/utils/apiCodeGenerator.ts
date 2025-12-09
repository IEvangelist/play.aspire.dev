/**
 * API-Based Code Generator
 * 
 * This module generates semantically correct Aspire AppHost code based on
 * the API schema definitions. It ensures that:
 * 
 * 1. Method signatures match the actual Aspire APIs
 * 2. Parameters are correctly ordered and typed
 * 3. Chaining methods are used appropriately for each resource type
 * 4. Required imports and packages are included
 * 5. Code follows Aspire best practices
 * 
 * The generator produces C# code that is guaranteed to compile when the
 * API schema accurately reflects the underlying NuGet packages.
 */

import type { Node, Edge } from '@xyflow/react';
import type { AspireNodeData } from '../components/playground/AspireNode';
import {
  getResourceApiDefinition,
  getRequiredPackages,
  type ResourceApiDefinition,
} from '../data/api-schema';
import { isReadyForCodeGeneration } from './apiValidation';

// ============================================================================
// Types
// ============================================================================

export interface GeneratedCode {
  appHost: string;
  nugetPackages: string[];
  deploymentOptions: string[];
  appSettings?: string;
  dockerfile?: string;
  azureManifest?: string;
  validationErrors?: string[];
}

export interface CodeGenerationOptions {
  includeComments?: boolean;
  includeRegions?: boolean;
  indentSize?: number;
  aspireVersion?: string;
}

const DEFAULT_OPTIONS: CodeGenerationOptions = {
  includeComments: false,
  includeRegions: false,
  indentSize: 4,
  aspireVersion: '13.0.0',
};

// ============================================================================
// Main Code Generation Function
// ============================================================================

/**
 * Generates complete AppHost code from the playground state
 */
export function generateAppHostCodeFromSchema(
  nodes: Node<AspireNodeData>[],
  edges: Edge[],
  options: CodeGenerationOptions = {}
): GeneratedCode {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Check if ready for code generation
  const readinessCheck = isReadyForCodeGeneration(nodes, edges);
  if (!readinessCheck.ready) {
    return {
      appHost: generateErrorCode(readinessCheck.blockingIssues),
      nugetPackages: [],
      deploymentOptions: [],
      validationErrors: readinessCheck.blockingIssues.map(i => i.message),
    };
  }

  // Sort nodes topologically
  const sortedNodes = topologicalSort(nodes, edges);
  
  // Generate code sections
  const nugetPackages = collectRequiredPackages(sortedNodes);
  const resourceDeclarations = generateResourceDeclarations(sortedNodes, edges, opts);
  
  // Build the complete file
  const appHost = buildAppHostFile(nugetPackages, resourceDeclarations, opts);
  
  // Generate supporting files
  const appSettings = generateAppSettings(sortedNodes);
  const dockerfile = generateDockerfile(sortedNodes);
  const azureManifest = generateAzureManifest(sortedNodes, edges);
  
  return {
    appHost,
    nugetPackages,
    deploymentOptions: generateDeploymentOptions(),
    appSettings,
    dockerfile,
    azureManifest,
  };
}

// ============================================================================
// Code Building Functions
// ============================================================================

/**
 * Builds the complete AppHost.cs file content
 */
function buildAppHostFile(
  packages: string[],
  declarations: string[],
  opts: CodeGenerationOptions
): string {
  const lines: string[] = [];
  
  // SDK directive
  lines.push(`#:sdk Aspire.AppHost.Sdk@${opts.aspireVersion}`);
  
  // Package directives
  packages.forEach(pkg => {
    lines.push(`#:package ${pkg}`);
  });
  
  // Empty line before code
  if (packages.length > 0) {
    lines.push('');
  }
  
  // Builder creation
  lines.push('var builder = DistributedApplication.CreateBuilder(args);');
  lines.push('');
  
  // Resource declarations
  if (declarations.length === 0) {
    lines.push('// Add resources by dragging them from the palette to the canvas');
    lines.push('');
  } else {
    declarations.forEach(decl => {
      lines.push(decl);
      lines.push('');
    });
  }
  
  // Build and run
  lines.push('builder.Build().Run();');
  
  return lines.join('\n');
}

/**
 * Generates error code when validation fails
 */
function generateErrorCode(issues: { message: string }[]): string {
  const lines = [
    '#:sdk Aspire.AppHost.Sdk@13.0.0',
    '',
    '// ⚠️ VALIDATION ERRORS - Fix these issues before generating code:',
    '//',
  ];
  
  issues.forEach((issue, idx) => {
    lines.push(`// ${idx + 1}. ${issue.message}`);
  });
  
  lines.push('//');
  lines.push('// Fix the issues above and the code will be generated automatically.');
  lines.push('');
  lines.push('var builder = DistributedApplication.CreateBuilder(args);');
  lines.push('');
  lines.push('// Your resources will appear here');
  lines.push('');
  lines.push('builder.Build().Run();');
  
  return lines.join('\n');
}

// ============================================================================
// Resource Declaration Generation
// ============================================================================

/**
 * Generates resource declarations for all nodes
 */
function generateResourceDeclarations(
  nodes: Node<AspireNodeData>[],
  edges: Edge[],
  opts: CodeGenerationOptions
): string[] {
  const declarations: string[] = [];
  
  // Build edge maps for reference lookup
  const incomingEdges = new Map<string, Edge[]>();
  edges.forEach(edge => {
    if (!incomingEdges.has(edge.target)) {
      incomingEdges.set(edge.target, []);
    }
    incomingEdges.get(edge.target)!.push(edge);
  });
  
  // Generate declaration for each node
  nodes.forEach(node => {
    const declaration = generateNodeDeclaration(node, nodes, incomingEdges, opts);
    if (declaration) {
      declarations.push(declaration);
    }
  });
  
  return declarations;
}

/**
 * Generates a resource declaration for a single node
 */
function generateNodeDeclaration(
  node: Node<AspireNodeData>,
  allNodes: Node<AspireNodeData>[],
  incomingEdges: Map<string, Edge[]>,
  opts: CodeGenerationOptions
): string | null {
  const { resourceType, instanceName, databaseName } = node.data;
  
  // Skip nodes without instance names
  if (!instanceName) return null;
  
  // Get API definition
  const apiDef = getResourceApiDefinition(resourceType);
  if (!apiDef) return null;
  
  // Sanitize names
  const varName = sanitizeCSharpIdentifier(instanceName);
  const dbVarName = databaseName ? sanitizeCSharpIdentifier(databaseName) : null;
  
  // Build the declaration
  const lines: string[] = [];
  
  // Generate builder method call
  const builderCall = generateBuilderMethodCall(node, apiDef, varName);
  lines.push(builderCall);
  
  // Generate chaining methods
  const chainingMethods = generateChainingMethods(node, apiDef, opts);
  chainingMethods.forEach(method => {
    lines[lines.length - 1] += '\n' + method;
  });
  
  // Add database if applicable
  if (dbVarName && apiDef.childResourceMethods) {
    lines[lines.length - 1] += ';';
    lines.push(`var ${dbVarName} = ${varName}.AddDatabase("${databaseName}")`);
  }
  
  // Generate reference methods
  const references = generateReferences(node, allNodes, incomingEdges);
  references.forEach(ref => {
    lines[lines.length - 1] += '\n' + ref;
  });
  
  // Add semicolon
  lines[lines.length - 1] += ';';
  
  return lines.join('');
}

/**
 * Generates the builder method call for a resource
 */
function generateBuilderMethodCall(
  node: Node<AspireNodeData>,
  apiDef: ResourceApiDefinition,
  varName: string
): string {
  const { instanceName, resourceType } = node.data;
  const method = apiDef.builderMethod;
  
  // Handle special cases
  switch (resourceType) {
    case 'dotnet-project':
      return `var ${varName} = builder.AddProject<Projects.${capitalize(varName)}>("${instanceName}")`;
    
    case 'node-app':
      return `var ${varName} = builder.AddNodeApp("${instanceName}", "../${instanceName}")`;
    
    case 'vite-app':
      return `var ${varName} = builder.AddViteApp("${instanceName}", "../${instanceName}")`;
    
    case 'python-app':
      return `var ${varName} = builder.AddPythonApp("${instanceName}", "../${instanceName}", "main.py")`;
    
    case 'container':
      return `var ${varName} = builder.AddContainer("${instanceName}", "myregistry/${instanceName}", "latest")`;
    
    default:
      // Generic builder method
      return `var ${varName} = builder.${method.name}("${instanceName}")`;
  }
}

/**
 * Generates chaining method calls based on node configuration
 */
function generateChainingMethods(
  node: Node<AspireNodeData>,
  apiDef: ResourceApiDefinition,
  opts: CodeGenerationOptions
): string[] {
  const chains: string[] = [];
  const indent = ' '.repeat(opts.indentSize || 4);
  const { resourceType, persistent, envVars, ports, volumes, replicas } = node.data;
  
  // Add ContainerLifetime.Persistent for databases
  if (['database'].includes(apiDef.category) && persistent !== false) {
    chains.push(`${indent}.WithLifetime(ContainerLifetime.Persistent)`);
  }
  
  // Add HTTP endpoint for Vite apps
  if (resourceType === 'vite-app') {
    chains.push(`${indent}.WithHttpEndpoint(env: "PORT")`);
  }
  
  // Add HTTP endpoint for containers
  if (resourceType === 'container') {
    chains.push(`${indent}.WithHttpEndpoint(targetPort: 8080)`);
  }
  
  // Add environment variables
  if (envVars && envVars.length > 0) {
    envVars.forEach(env => {
      if (env.key && env.value) {
        chains.push(`${indent}.WithEnvironment("${env.key}", "${env.value}")`);
      }
    });
  }
  
  // Add port mappings
  if (ports && ports.length > 0) {
    ports.forEach(port => {
      if (port.container) {
        if (port.host) {
          chains.push(`${indent}.WithHttpEndpoint(port: ${port.host}, targetPort: ${port.container})`);
        } else {
          chains.push(`${indent}.WithHttpEndpoint(targetPort: ${port.container})`);
        }
      }
    });
  }
  
  // Add volume mounts
  if (volumes && volumes.length > 0) {
    volumes.forEach(vol => {
      if (vol.source && vol.target) {
        chains.push(`${indent}.WithBindMount("${vol.source}", "${vol.target}")`);
      }
    });
  }
  
  // Add replicas
  if (replicas && replicas > 1) {
    chains.push(`${indent}.WithReplicas(${replicas})`);
  }
  
  return chains;
}

/**
 * Generates WithReference and WaitFor calls based on edges
 */
function generateReferences(
  node: Node<AspireNodeData>,
  allNodes: Node<AspireNodeData>[],
  incomingEdges: Map<string, Edge[]>
): string[] {
  const references: string[] = [];
  const indent = '    ';
  
  const incoming = incomingEdges.get(node.id) || [];
  
  incoming.forEach(edge => {
    const sourceNode = allNodes.find(n => n.id === edge.source);
    if (!sourceNode || !sourceNode.data.instanceName) return;
    
    // Determine which variable to reference (database vs server)
    const sourceApiDef = getResourceApiDefinition(sourceNode.data.resourceType);
    let refVar: string;
    
    if (sourceApiDef?.childResourceMethods && sourceNode.data.databaseName) {
      // Reference the database, not the server
      refVar = sanitizeCSharpIdentifier(sourceNode.data.databaseName);
    } else {
      refVar = sanitizeCSharpIdentifier(sourceNode.data.instanceName);
    }
    
    // Add WithReference
    references.push(`${indent}.WithReference(${refVar})`);
    
    // Add WaitFor for databases
    if (sourceApiDef?.category === 'database') {
      references.push(`${indent}.WaitFor(${refVar})`);
    }
  });
  
  return references;
}

// ============================================================================
// Package Collection
// ============================================================================

/**
 * Collects all required NuGet packages
 */
function collectRequiredPackages(nodes: Node<AspireNodeData>[]): string[] {
  const resourceTypes = nodes
    .map(n => n.data.resourceType)
    .filter(Boolean);
  
  return getRequiredPackages(resourceTypes);
}

// ============================================================================
// Supporting File Generation
// ============================================================================

/**
 * Generates appsettings.json content
 */
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

  nodes.forEach(node => {
    const { resourceType, instanceName, databaseName } = node.data;
    if (!instanceName) return;

    const apiDef = getResourceApiDefinition(resourceType);
    if (!apiDef) return;

    // Add connection strings for databases
    if (apiDef.category === 'database') {
      const connName = databaseName || instanceName;
      (settings.ConnectionStrings as Record<string, string>)[connName] = `{${connName}.connectionString}`;
    }

    // Add connection strings for cache and messaging
    if (['cache', 'messaging'].includes(apiDef.category)) {
      (settings.ConnectionStrings as Record<string, string>)[instanceName] = `{${instanceName}.connectionString}`;
    }
  });

  return JSON.stringify(settings, null, 2);
}

/**
 * Generates a sample Dockerfile
 */
function generateDockerfile(nodes: Node<AspireNodeData>[]): string {
  const hasContainers = nodes.some(n => n.data.resourceType === 'container');
  
  if (hasContainers) {
    return `# Dockerfile for custom container
FROM alpine:latest
WORKDIR /app
COPY . .
EXPOSE 8080
CMD ["./start.sh"]`;
  }

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

/**
 * Generates Azure Container Apps manifest
 */
function generateAzureManifest(
  nodes: Node<AspireNodeData>[],
  _edges: Edge[]
): string {
  const containerApps: Record<string, unknown>[] = [];

  nodes.forEach(node => {
    const { resourceType, instanceName, envVars, replicas } = node.data;
    if (!instanceName) return;

    const apiDef = getResourceApiDefinition(resourceType);
    if (!apiDef) return;

    if (['project', 'container'].includes(apiDef.category)) {
      const app = {
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
                env: envVars?.filter(e => e.key && e.value).map(env => ({
                  name: env.key,
                  value: env.value,
                })) || [],
              },
            ],
            scale: {
              minReplicas: 1,
              maxReplicas: replicas || 10,
            },
          },
        },
      };

      containerApps.push(app);
    }
  });

  return JSON.stringify({ containerApps }, null, 2);
}

/**
 * Generates deployment command options
 */
function generateDeploymentOptions(): string[] {
  return [
    'aspire run',
    'aspire deploy',
    'aspire deploy --environment staging',
    'aspire do diagnostics',
    'aspire do build',
  ];
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Topological sort for dependency ordering
 */
function topologicalSort(
  nodes: Node<AspireNodeData>[],
  edges: Edge[]
): Node<AspireNodeData>[] {
  const graph = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // Initialize
  nodes.forEach(node => {
    graph.set(node.id, []);
    inDegree.set(node.id, 0);
  });

  // Build graph
  edges.forEach(edge => {
    graph.get(edge.source)?.push(edge.target);
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

    graph.get(nodeId)?.forEach(neighbor => {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    });
  }

  return result;
}

/**
 * Capitalizes the first letter of a string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Sanitizes a string to be a valid C# identifier
 */
function sanitizeCSharpIdentifier(name: string): string {
  // Replace invalid characters with spaces for camelCase conversion
  let sanitized = name.replace(/[^a-zA-Z0-9]/g, ' ');
  
  // Convert to camelCase
  sanitized = sanitized
    .split(' ')
    .filter(word => word.length > 0)
    .map((word, index) => {
      if (index === 0) {
        return word.charAt(0).toLowerCase() + word.slice(1).toLowerCase();
      } else {
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
