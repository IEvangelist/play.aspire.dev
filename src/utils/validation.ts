import type { Node, Edge } from '@xyflow/react';
import type { AspireNodeData } from '../components/playground/AspireNode';
import { aspireResources } from '../data/aspire-resources';

export interface ValidationIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  nodeId?: string;
  message: string;
  category: 'architecture' | 'security' | 'performance' | 'reliability';
  suggestion?: string;
}

// Derive resource type sets from the canonical resource data
const databaseTypes = new Set(aspireResources.filter(r => r.category === 'database').map(r => r.id));
const cacheTypes = new Set(aspireResources.filter(r => r.category === 'cache').map(r => r.id));
const messagingTypes = new Set(aspireResources.filter(r => r.category === 'messaging').map(r => r.id));
const projectTypes = new Set(aspireResources.filter(r => r.category === 'project').map(r => r.id));
// Container is special — it's a compute resource but behaves like a project for validation
const appTypes = new Set([...projectTypes, 'container']);

function isDatabase(type: string) { return databaseTypes.has(type); }
function isCache(type: string) { return cacheTypes.has(type); }
function isMessaging(type: string) { return messagingTypes.has(type); }
function isApp(type: string) { return appTypes.has(type); }

export function validatePlayground(nodes: Node<AspireNodeData>[], edges: Edge[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check for unnamed nodes
  nodes.forEach(node => {
    if (!node.data.instanceName || node.data.instanceName.trim() === '') {
      issues.push({
        id: `unnamed-${node.id}`,
        severity: 'error',
        nodeId: node.id,
        message: `${node.data.label} has no instance name`,
        category: 'architecture',
        suggestion: 'Double-click the node and provide a meaningful name',
      });
    }
  });

  // Check for databases without persistent lifetime
  nodes.forEach(node => {
    if (isDatabase(node.data.resourceType) && node.data.persistent === false) {
      issues.push({
        id: `non-persistent-db-${node.id}`,
        severity: 'warning',
        nodeId: node.id,
        message: `${node.data.instanceName || node.data.label} is not configured for persistent storage`,
        category: 'reliability',
        suggestion: 'Enable persistent container lifetime to prevent data loss on restart',
      });
    }
  });

  // Check for projects without any connections
  nodes.forEach(node => {
    if (isApp(node.data.resourceType)) {
      const hasConnections = edges.some(edge => edge.source === node.id || edge.target === node.id);
      
      if (!hasConnections) {
        issues.push({
          id: `isolated-project-${node.id}`,
          severity: 'info',
          nodeId: node.id,
          message: `${node.data.instanceName || node.data.label} has no connections to other resources`,
          category: 'architecture',
          suggestion: 'Consider connecting to databases, caches, or messaging systems',
        });
      }
    }
  });

  // Check for databases without any consumers
  nodes.forEach(node => {
    if (isDatabase(node.data.resourceType)) {
      const hasConsumers = edges.some(edge => edge.source === node.id);
      
      if (!hasConsumers) {
        issues.push({
          id: `unused-database-${node.id}`,
          severity: 'warning',
          nodeId: node.id,
          message: `${node.data.instanceName || node.data.label} is not connected to any projects`,
          category: 'architecture',
          suggestion: 'Connect this database to a project that will use it',
        });
      }
    }
  });

  // Check for missing replicas configuration
  nodes.forEach(node => {
    if (isApp(node.data.resourceType) && (!node.data.replicas || node.data.replicas < 2)) {
      const hasMultipleConnections = edges.filter(edge => edge.target === node.id).length > 2;
      
      if (hasMultipleConnections) {
        issues.push({
          id: `low-replicas-${node.id}`,
          severity: 'info',
          nodeId: node.id,
          message: `${node.data.instanceName || node.data.label} uses multiple resources but has only 1 replica`,
          category: 'performance',
          suggestion: 'Consider increasing replicas for better availability',
        });
      }
    }
  });

  // Check for missing environment variables for common scenarios
  nodes.forEach(node => {
    if (isApp(node.data.resourceType) && (!node.data.envVars || node.data.envVars.length === 0)) {
      const hasConnections = edges.some(edge => edge.target === node.id);
      
      if (hasConnections) {
        issues.push({
          id: `missing-env-${node.id}`,
          severity: 'info',
          nodeId: node.id,
          message: `${node.data.instanceName || node.data.label} has connections but no environment variables configured`,
          category: 'architecture',
          suggestion: 'Configure environment variables for runtime settings',
        });
      }
    }
  });

  // Anti-pattern: Multiple messaging systems
  const messagingSystems = nodes.filter(n => isMessaging(n.data.resourceType));
  if (messagingSystems.length > 1) {
    issues.push({
      id: 'multiple-messaging',
      severity: 'warning',
      message: 'Multiple messaging systems detected in the same application',
      category: 'architecture',
      suggestion: 'Consider standardizing on a single messaging system for simplicity',
    });
  }

  // Anti-pattern: Multiple cache systems
  const cacheSystems = nodes.filter(n => isCache(n.data.resourceType));
  if (cacheSystems.length > 1) {
    issues.push({
      id: 'multiple-cache',
      severity: 'warning',
      message: 'Multiple caching systems detected in the same application',
      category: 'architecture',
      suggestion: 'Consider using a single caching system unless you have specific requirements',
    });
  }

  // Check for circular dependencies
  const circularDeps = detectCircularDependencies(nodes, edges);
  circularDeps.forEach((cycle, index) => {
    issues.push({
      id: `circular-dep-${index}`,
      severity: 'error',
      message: `Circular dependency detected: ${cycle.join(' → ')}`,
      category: 'architecture',
      suggestion: 'Refactor your architecture to remove circular dependencies',
    });
  });

  // Performance: Check for containers without resource limits
  nodes.forEach(node => {
    if (node.data.resourceType === 'container' && (!node.data.envVars || node.data.envVars.length === 0)) {
      issues.push({
        id: `no-resources-${node.id}`,
        severity: 'info',
        nodeId: node.id,
        message: `${node.data.instanceName || node.data.label} container has no resource configuration`,
        category: 'performance',
        suggestion: 'Configure memory and CPU limits for better resource management',
      });
    }
  });

  // Security: Check for OpenAI without environment variable
  nodes.forEach(node => {
    if (node.data.resourceType === 'openai') {
      const hasApiKey = node.data.envVars?.some(env => 
        env.key.toLowerCase().includes('api') || env.key.toLowerCase().includes('key')
      );
      
      if (!hasApiKey) {
        issues.push({
          id: `openai-no-key-${node.id}`,
          severity: 'warning',
          nodeId: node.id,
          message: `${node.data.instanceName || node.data.label} may need API key configuration`,
          category: 'security',
          suggestion: 'Configure OpenAI API key via environment variables or user secrets',
        });
      }
    }
  });

  return issues;
}

function detectCircularDependencies(nodes: Node<AspireNodeData>[], edges: Edge[]): string[][] {
  const cycles: string[][] = [];
  const graph = new Map<string, string[]>();

  // Build adjacency list
  nodes.forEach(node => graph.set(node.id, []));
  edges.forEach(edge => {
    const neighbors = graph.get(edge.source) || [];
    neighbors.push(edge.target);
    graph.set(edge.source, neighbors);
  });

  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recStack.add(nodeId);
    path.push(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) {
          return true;
        }
      } else if (recStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = path.indexOf(neighbor);
        const cycle = path.slice(cycleStart).map(id => {
          const node = nodes.find(n => n.id === id);
          return node?.data.instanceName || node?.data.label || id;
        });
        cycle.push(cycle[0]); // Complete the cycle
        cycles.push(cycle);
        return true;
      }
    }

    recStack.delete(nodeId);
    path.pop();
    return false;
  }

  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  });

  return cycles;
}
