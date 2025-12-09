import type { Node, Edge } from '@xyflow/react';
import type { AspireNodeData } from '../components/playground/AspireNode';
import { aspireResources } from '../data/aspire-resources';

export interface ImportResult {
  nodes: Node<AspireNodeData>[];
  edges: Edge[];
  warnings: string[];
}

let nodeIdCounter = 1000; // Start high to avoid conflicts with existing nodes
const getNodeId = () => `imported_${nodeIdCounter++}`;

/**
 * Find the matching Aspire resource by various identifiers
 */
function findAspireResource(identifier: string): typeof aspireResources[0] | undefined {
  const lowerIdentifier = identifier.toLowerCase();
  
  // Direct match by id or name
  let resource = aspireResources.find(r => 
    r.id === lowerIdentifier || 
    r.name === lowerIdentifier
  );
  
  if (resource) return resource;
  
  // Match by hosting method (e.g., "AddPostgres" -> postgres)
  resource = aspireResources.find(r => 
    r.hostingMethod.toLowerCase() === `add${lowerIdentifier}`
  );
  
  if (resource) return resource;
  
  // Common Docker image name mappings
  const imageMapping: Record<string, string> = {
    'postgres': 'postgres',
    'postgresql': 'postgres',
    'mysql': 'mysql',
    'mariadb': 'mysql',
    'mongo': 'mongodb',
    'mongodb': 'mongodb',
    'redis': 'redis',
    'valkey': 'valkey',
    'rabbitmq': 'rabbitmq',
    'kafka': 'kafka',
    'nats': 'nats',
    'sqlserver': 'sqlserver',
    'mssql': 'sqlserver',
    'mcr.microsoft.com/mssql/server': 'sqlserver',
    'oracle': 'oracle',
    'ollama': 'ollama',
    'nginx': 'container',
    'node': 'node-app',
    'python': 'python-app',
  };
  
  // Check if the identifier contains any known image names
  for (const [key, value] of Object.entries(imageMapping)) {
    if (lowerIdentifier.includes(key)) {
      return aspireResources.find(r => r.id === value);
    }
  }
  
  // Default to container for unknown images
  return aspireResources.find(r => r.id === 'container');
}

/**
 * Parse C# AppHost.cs file and extract resources
 */
export function parseAppHost(content: string): ImportResult {
  const nodes: Node<AspireNodeData>[] = [];
  const edges: Edge[] = [];
  const warnings: string[] = [];
  const resourceMap = new Map<string, string>(); // variable name -> node id

  // Match builder.Add* patterns
  // Examples:
  // var postgres = builder.AddPostgres("postgres");
  // var db = postgres.AddDatabase("mydb");
  // builder.AddProject<Projects.Api>("api").WithReference(db);
  
  // First pass: extract all resources
  let yPosition = 100;
  const xPositions = {
    project: 600,
    database: 100,
    cache: 100,
    messaging: 100,
    ai: 100,
    compute: 600,
  };
  
  // Pattern 1: var name = builder.AddXxx("resourceName")
  const pattern1 = /(?:var|let|const)\s+(\w+)\s*=\s*builder\.Add(\w+)(?:<[^>]+>)?\s*\(\s*"([^"]+)"/g;
  let match;
  
  while ((match = pattern1.exec(content)) !== null) {
    const [, varName, methodSuffix, resourceName] = match;
    const resource = findAspireResource(methodSuffix);
    
    if (resource) {
      const nodeId = getNodeId();
      resourceMap.set(varName, nodeId);
      
      const category = resource.category;
      const xPos = xPositions[category] || 300;
      xPositions[category] += 250;
      
      nodes.push({
        id: nodeId,
        type: 'aspire',
        position: { x: xPos, y: yPosition },
        data: {
          resourceType: resource.id,
          label: resource.displayName,
          icon: resource.icon,
          color: resource.color,
          instanceName: resourceName,
          databaseName: resource.allowsDatabase ? undefined : undefined,
          allowsDatabase: resource.allowsDatabase,
        },
      });
      
      yPosition += 120;
    } else {
      warnings.push(`Unknown resource type: Add${methodSuffix}`);
    }
  }

  // Pattern 2: var db = parentVar.AddDatabase("dbname")
  const pattern2 = /(?:var|let|const)\s+(\w+)\s*=\s*(\w+)\.AddDatabase\s*\(\s*"([^"]+)"/g;
  
  while ((match = pattern2.exec(content)) !== null) {
    const [, varName, parentVar, dbName] = match;
    const parentNodeId = resourceMap.get(parentVar);
    
    if (parentNodeId) {
      // Update the parent node with database name
      const parentNode = nodes.find(n => n.id === parentNodeId);
      if (parentNode) {
        parentNode.data.databaseName = dbName;
      }
      // Store the database variable mapping to the parent node for references
      resourceMap.set(varName, parentNodeId);
    }
  }

  // Pattern 3: .WithReference(resourceVar)
  const referencePattern = /(\w+)(?:\s*\n\s*)?\.WithReference\s*\(\s*(\w+)\s*\)/g;
  
  while ((match = referencePattern.exec(content)) !== null) {
    const [, sourceVar, targetVar] = match;
    const sourceNodeId = resourceMap.get(sourceVar);
    const targetNodeId = resourceMap.get(targetVar);
    
    if (sourceNodeId && targetNodeId && sourceNodeId !== targetNodeId) {
      edges.push({
        id: `edge_${sourceNodeId}_${targetNodeId}`,
        source: sourceNodeId,
        target: targetNodeId,
        animated: true,
        style: { stroke: '#888', strokeWidth: 2 },
      });
    }
  }

  if (nodes.length === 0) {
    warnings.push('No Aspire resources found in the file. Make sure the file contains builder.Add* patterns.');
  }

  return { nodes, edges, warnings };
}

/**
 * Parse Docker Compose YAML file and extract services
 */
export function parseDockerCompose(content: string): ImportResult {
  const nodes: Node<AspireNodeData>[] = [];
  const edges: Edge[] = [];
  const warnings: string[] = [];
  const serviceMap = new Map<string, string>(); // service name -> node id

  // Simple YAML parsing for docker-compose
  // This is a basic parser - for complex files, a proper YAML parser would be better
  
  const lines = content.split('\n');
  let currentService: string | null = null;
  let currentImage: string | null = null;
  let currentPorts: string[] = [];
  let currentDependsOn: string[] = [];
  let inServices = false;
  let yPosition = 100;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Detect services section
    if (trimmed === 'services:') {
      inServices = true;
      continue;
    }
    
    if (!inServices) continue;
    
    // Detect new top-level section (non-indented)
    if (trimmed && !line.startsWith(' ') && !line.startsWith('\t') && trimmed !== 'services:') {
      if (!trimmed.startsWith('#')) {
        inServices = false;
      }
      continue;
    }
    
    // Detect service name (single indent level)
    const serviceMatch = line.match(/^(\s{2}|\t)(\w[\w-]*)\s*:/);
    if (serviceMatch && inServices) {
      // Save previous service
      if (currentService) {
        createServiceNode(currentService, currentImage, currentPorts, currentDependsOn);
      }
      
      currentService = serviceMatch[2];
      currentImage = null;
      currentPorts = [];
      currentDependsOn = [];
      continue;
    }
    
    if (currentService) {
      // Parse image
      const imageMatch = trimmed.match(/^image:\s*["']?([^"'\s]+)["']?/);
      if (imageMatch) {
        currentImage = imageMatch[1];
        continue;
      }
      
      // Parse ports
      const portMatch = trimmed.match(/^-\s*["']?(\d+):(\d+)["']?/);
      if (portMatch) {
        currentPorts.push(`${portMatch[1]}:${portMatch[2]}`);
        continue;
      }
      
      // Parse depends_on
      if (trimmed === 'depends_on:') {
        // Read following lines for dependencies
        for (let j = i + 1; j < lines.length; j++) {
          const depLine = lines[j].trim();
          if (depLine.startsWith('- ')) {
            currentDependsOn.push(depLine.substring(2).trim());
          } else if (!depLine.startsWith('#') && depLine !== '') {
            break;
          }
        }
        continue;
      }
    }
  }
  
  // Don't forget the last service
  if (currentService) {
    createServiceNode(currentService, currentImage, currentPorts, currentDependsOn);
  }

  function createServiceNode(
    serviceName: string, 
    image: string | null, 
    ports: string[], 
    dependsOn: string[]
  ) {
    const resource = findAspireResource(image || serviceName);
    
    if (resource) {
      const nodeId = getNodeId();
      serviceMap.set(serviceName, nodeId);
      
      const category = resource.category;
      const xPos = category === 'project' || category === 'compute' ? 600 : 100;
      
      nodes.push({
        id: nodeId,
        type: 'aspire',
        position: { x: xPos + (nodes.length % 3) * 200, y: yPosition },
        data: {
          resourceType: resource.id,
          label: resource.displayName,
          icon: resource.icon,
          color: resource.color,
          instanceName: serviceName,
          databaseName: resource.allowsDatabase ? 'database' : undefined,
          allowsDatabase: resource.allowsDatabase,
          ports: ports.length > 0 ? ports.map(p => {
            const [host, container] = p.split(':');
            return { host, container };
          }) : undefined,
        },
      });
      
      yPosition += 120;
      
      // Store depends_on for edge creation
      dependsOn.forEach(dep => {
        const depNodeId = serviceMap.get(dep);
        if (depNodeId) {
          edges.push({
            id: `edge_${nodeId}_${depNodeId}`,
            source: nodeId,
            target: depNodeId,
            animated: true,
            style: { stroke: '#888', strokeWidth: 2 },
          });
        }
      });
    } else {
      warnings.push(`Could not map service "${serviceName}" to an Aspire resource`);
    }
  }

  // Second pass: create edges for depends_on that reference services defined later
  // Note: Most edges are already created in createServiceNode, but some may need deferred resolution
  // This is handled by the first pass since we iterate through services in order

  if (nodes.length === 0) {
    warnings.push('No services found in the docker-compose file. Make sure it contains a valid services section.');
  }

  return { nodes, edges, warnings };
}

/**
 * Parse Dockerfile and create a container resource
 */
export function parseDockerfile(content: string, fileName: string): ImportResult {
  const nodes: Node<AspireNodeData>[] = [];
  const edges: Edge[] = [];
  const warnings: string[] = [];

  // Extract information from Dockerfile
  let baseImage = 'unknown';
  let exposedPorts: string[] = [];
  
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Get base image
    const fromMatch = trimmed.match(/^FROM\s+([^\s]+)/i);
    if (fromMatch) {
      baseImage = fromMatch[1];
    }
    
    // Get exposed ports
    const exposeMatch = trimmed.match(/^EXPOSE\s+(.+)/i);
    if (exposeMatch) {
      const ports = exposeMatch[1].split(/\s+/).map(p => p.replace(/\/\w+$/, '')); // Remove protocol
      exposedPorts.push(...ports);
    }
  }

  // Determine the best resource type based on the base image
  let resource = findAspireResource(baseImage);
  
  // For most Dockerfiles, we'll create a container resource
  if (!resource || resource.id === 'container') {
    resource = aspireResources.find(r => r.id === 'container');
  }

  if (resource) {
    // Extract a sensible name from the filename or base image
    let containerName = 'container';
    if (fileName.toLowerCase() !== 'dockerfile') {
      // Dockerfile.api -> api
      containerName = fileName.replace(/^dockerfile\.?/i, '').replace(/\.dockerfile$/i, '') || 'container';
    } else if (baseImage !== 'unknown') {
      // Extract name from image
      containerName = baseImage.split('/').pop()?.split(':')[0] || 'container';
    }

    nodes.push({
      id: getNodeId(),
      type: 'aspire',
      position: { x: 300, y: 200 },
      data: {
        resourceType: resource.id,
        label: resource.displayName,
        icon: resource.icon,
        color: resource.color,
        instanceName: containerName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        ports: exposedPorts.length > 0 ? exposedPorts.map(p => ({ host: p, container: p })) : undefined,
      },
    });

    if (baseImage !== 'unknown') {
      warnings.push(`Base image: ${baseImage}`);
    }
    if (exposedPorts.length > 0) {
      warnings.push(`Exposed ports: ${exposedPorts.join(', ')}`);
    }
  }

  return { nodes, edges, warnings };
}
