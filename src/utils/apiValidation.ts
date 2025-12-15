/**
 * API-Based Validation Engine
 * 
 * This module provides comprehensive validation for the Aspire Playground based on
 * the actual public APIs of the NuGet packages. It ensures:
 * 
 * 1. Semantic correctness - Code generated matches API method signatures
 * 2. Type safety - Parameter values conform to expected types
 * 3. Connection compatibility - Resources can only connect to valid targets
 * 4. Naming conventions - C# identifier rules are enforced
 * 5. Configuration validity - All required parameters are provided
 * 
 * The validation engine produces detailed, actionable error messages that help
 * users understand and fix issues before code generation.
 */

import type { Node, Edge } from '@xyflow/react';
import type { AspireNodeData } from '../components/playground/AspireNode';
import {
  getResourceApiDefinition,
  getAvailableChainingMethods,
  isValidConnection,
  isValidCSharpIdentifier,
  validateParameterValue,
  type ChainingMethod,
  type MethodParameter,
} from '../data/api-schema';

// ============================================================================
// Validation Issue Types
// ============================================================================

/**
 * Severity levels for validation issues
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Categories for validation issues
 */
export type ValidationCategory =
  | 'naming'           // C# identifier and naming convention issues
  | 'configuration'    // Missing or invalid configuration
  | 'connection'       // Invalid connections between resources
  | 'architecture'     // Architectural best practices
  | 'security'         // Security-related issues
  | 'performance'      // Performance-related suggestions
  | 'api'              // Issues with API usage (method signatures, parameters)
  | 'semantic';        // Semantic correctness issues

/**
 * A validation issue found during analysis
 */
export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  category: ValidationCategory;
  nodeId?: string;
  edgeId?: string;
  message: string;
  details?: string;
  suggestion?: string;
  relatedNodes?: string[];
  apiMethod?: string;
  parameter?: string;
}

/**
 * Result of validation
 */
export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
}

// ============================================================================
// Validation Context
// ============================================================================

/**
 * Context object for validation
 */
interface ValidationContext {
  nodes: Node<AspireNodeData>[];
  edges: Edge[];
  nodeMap: Map<string, Node<AspireNodeData>>;
  edgesBySource: Map<string, Edge[]>;
  edgesByTarget: Map<string, Edge[]>;
}

/**
 * Creates a validation context from nodes and edges
 */
function createValidationContext(
  nodes: Node<AspireNodeData>[],
  edges: Edge[]
): ValidationContext {
  const nodeMap = new Map<string, Node<AspireNodeData>>();
  const edgesBySource = new Map<string, Edge[]>();
  const edgesByTarget = new Map<string, Edge[]>();

  nodes.forEach(node => nodeMap.set(node.id, node));
  
  edges.forEach(edge => {
    if (!edgesBySource.has(edge.source)) {
      edgesBySource.set(edge.source, []);
    }
    edgesBySource.get(edge.source)!.push(edge);

    if (!edgesByTarget.has(edge.target)) {
      edgesByTarget.set(edge.target, []);
    }
    edgesByTarget.get(edge.target)!.push(edge);
  });

  return { nodes, edges, nodeMap, edgesBySource, edgesByTarget };
}

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validates the entire playground state
 */
export function validatePlayground(
  nodes: Node<AspireNodeData>[],
  edges: Edge[]
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const ctx = createValidationContext(nodes, edges);

  // Run all validation rules
  issues.push(...validateNaming(ctx));
  issues.push(...validateApiUsage(ctx));
  issues.push(...validateConnections(ctx));
  issues.push(...validateConfiguration(ctx));
  issues.push(...validateArchitecture(ctx));
  issues.push(...validateSecurity(ctx));
  issues.push(...validatePerformance(ctx));
  issues.push(...detectCircularDependencies(ctx));

  // Calculate counts
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  return {
    isValid: errorCount === 0,
    issues,
    errorCount,
    warningCount,
    infoCount,
  };
}

// ============================================================================
// Naming Validation
// ============================================================================

/**
 * Validates naming conventions
 */
function validateNaming(ctx: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  ctx.nodes.forEach(node => {
    const { instanceName, databaseName, resourceType } = node.data;

    // Check instance name
    if (!instanceName || instanceName.trim() === '') {
      issues.push({
        id: `naming-missing-${node.id}`,
        severity: 'error',
        category: 'naming',
        nodeId: node.id,
        message: `${node.data.label} requires an instance name`,
        details: 'Every resource must have a unique instance name that will be used in the generated code.',
        suggestion: 'Double-click the node and provide a meaningful name',
      });
    } else if (!isValidCSharpIdentifier(instanceName)) {
      issues.push({
        id: `naming-invalid-${node.id}`,
        severity: 'error',
        category: 'naming',
        nodeId: node.id,
        message: `"${instanceName}" is not a valid C# identifier`,
        details: 'C# identifiers must start with a letter or underscore, and can only contain letters, digits, and underscores. Reserved keywords cannot be used.',
        suggestion: `Try using "${sanitizeIdentifier(instanceName)}" instead`,
        parameter: 'instanceName',
      });
    }

    // Check database name for database resources
    const apiDef = getResourceApiDefinition(resourceType);
    if (apiDef?.childResourceMethods && node.data.allowsDatabase) {
      if (databaseName && !isValidCSharpIdentifier(databaseName)) {
        issues.push({
          id: `naming-invalid-db-${node.id}`,
          severity: 'error',
          category: 'naming',
          nodeId: node.id,
          message: `Database name "${databaseName}" is not a valid C# identifier`,
          details: 'Database names must follow C# identifier naming rules.',
          suggestion: `Try using "${sanitizeIdentifier(databaseName)}" instead`,
          parameter: 'databaseName',
        });
      }
    }

    // Check for duplicate names
    const duplicates = ctx.nodes.filter(
      n => n.id !== node.id && n.data.instanceName === instanceName && instanceName
    );
    if (duplicates.length > 0) {
      issues.push({
        id: `naming-duplicate-${node.id}`,
        severity: 'error',
        category: 'naming',
        nodeId: node.id,
        message: `Duplicate instance name "${instanceName}"`,
        details: 'Each resource must have a unique name within the application.',
        suggestion: `Consider renaming to "${instanceName}2" or choosing a more descriptive name`,
        relatedNodes: duplicates.map(d => d.id),
      });
    }

    // Validate against API parameter constraints
    if (apiDef) {
      const nameParam = apiDef.builderMethod.parameters.find(p => p.name === 'name');
      if (nameParam && instanceName) {
        const validation = validateParameterValue(instanceName, nameParam);
        if (!validation.isValid) {
          validation.errors.forEach((error, idx) => {
            issues.push({
              id: `naming-constraint-${node.id}-${idx}`,
              severity: 'error',
              category: 'api',
              nodeId: node.id,
              message: error,
              apiMethod: apiDef.builderMethod.name,
              parameter: 'name',
            });
          });
        }
      }
    }
  });

  return issues;
}

/**
 * Sanitizes a string to be a valid C# identifier
 */
function sanitizeIdentifier(name: string): string {
  let result = name.replace(/[^a-zA-Z0-9_]/g, '_');
  if (/^[0-9]/.test(result)) {
    result = '_' + result;
  }
  return result || 'resource';
}

// ============================================================================
// API Usage Validation
// ============================================================================

/**
 * Validates that resources are used correctly according to their API definitions
 */
function validateApiUsage(ctx: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  ctx.nodes.forEach(node => {
    const { resourceType } = node.data;
    const apiDef = getResourceApiDefinition(resourceType);

    if (!apiDef) {
      issues.push({
        id: `api-unknown-${node.id}`,
        severity: 'warning',
        category: 'api',
        nodeId: node.id,
        message: `Unknown resource type "${resourceType}"`,
        details: 'This resource type is not recognized in the API schema.',
      });
      return;
    }

    // Validate builder method parameters
    apiDef.builderMethod.parameters.forEach(param => {
      const value = getParameterValueFromNode(node, param);
      const validation = validateParameterValue(value, param);
      
      if (!validation.isValid) {
        validation.errors.forEach((error, idx) => {
          issues.push({
            id: `api-param-${node.id}-${param.name}-${idx}`,
            severity: 'error',
            category: 'api',
            nodeId: node.id,
            message: error,
            apiMethod: apiDef.builderMethod.name,
            parameter: param.name,
            details: param.description,
          });
        });
      }
    });

    // Validate chaining method usage
    const chainingMethods = getAvailableChainingMethods(resourceType);
    validateChainingMethodUsage(ctx, node, chainingMethods, issues);
  });

  return issues;
}

/**
 * Gets a parameter value from the node data
 */
function getParameterValueFromNode(
  node: Node<AspireNodeData>,
  param: MethodParameter
): unknown {
  switch (param.name) {
    case 'name':
      return node.data.instanceName;
    case 'port':
      return node.data.ports?.[0]?.container;
    case 'scriptPath':
    case 'projectDirectory':
    case 'workingDirectory':
      return node.data.instanceName ? `../${node.data.instanceName}` : undefined;
    default:
      return undefined;
  }
}

/**
 * Validates chaining method usage for a node
 */
function validateChainingMethodUsage(
  ctx: ValidationContext,
  node: Node<AspireNodeData>,
  availableMethods: ChainingMethod[],
  issues: ValidationIssue[]
): void {
  const { resourceType } = node.data;
  const targetEdges = ctx.edgesByTarget.get(node.id) || [];

  // Check if WithReference/WaitFor are being used on resources that don't support them
  if (targetEdges.length > 0) {
    const supportsReferences = availableMethods.some(m => m.name === 'WithReference');
    if (!supportsReferences) {
      issues.push({
        id: `api-no-reference-${node.id}`,
        severity: 'error',
        category: 'api',
        nodeId: node.id,
        message: `${node.data.label} does not support .WithReference()`,
        details: `Resources of type "${resourceType}" cannot receive references from other resources.`,
        suggestion: 'Remove the incoming connections or change the connection direction',
      });
    }
  }
}

// ============================================================================
// Connection Validation
// ============================================================================

/**
 * Validates connections between resources
 */
function validateConnections(ctx: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  ctx.edges.forEach(edge => {
    const sourceNode = ctx.nodeMap.get(edge.source);
    const targetNode = ctx.nodeMap.get(edge.target);

    if (!sourceNode || !targetNode) {
      issues.push({
        id: `connection-orphan-${edge.id}`,
        severity: 'error',
        category: 'connection',
        edgeId: edge.id,
        message: 'Connection references a non-existent node',
        details: 'This connection is invalid because one or both nodes no longer exist.',
        suggestion: 'Delete this connection',
      });
      return;
    }

    const sourceType = sourceNode.data.resourceType;
    const targetType = targetNode.data.resourceType;

    // Check if connection is valid according to API definitions
    if (!isValidConnection(sourceType, targetType)) {
      issues.push({
        id: `connection-invalid-${edge.id}`,
        severity: 'error',
        category: 'connection',
        edgeId: edge.id,
        nodeId: edge.target,
        message: `Invalid connection: ${sourceNode.data.label} cannot connect to ${targetNode.data.label}`,
        details: `Resources of type "${sourceType}" cannot be referenced by resources of type "${targetType}".`,
        suggestion: 'Remove this connection or reverse its direction',
        relatedNodes: [edge.source, edge.target],
      });
    }

    // Check for self-connections
    if (edge.source === edge.target) {
      issues.push({
        id: `connection-self-${edge.id}`,
        severity: 'error',
        category: 'connection',
        edgeId: edge.id,
        message: 'A resource cannot reference itself',
        suggestion: 'Remove this connection',
      });
    }
  });

  return issues;
}

// ============================================================================
// Configuration Validation
// ============================================================================

/**
 * Validates resource configuration
 */
function validateConfiguration(ctx: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  ctx.nodes.forEach(node => {
    const { resourceType, allowsDatabase, databaseName, persistent } = node.data;
    const apiDef = getResourceApiDefinition(resourceType);

    if (!apiDef) return;

    // Check for missing database configuration on database resources
    if (allowsDatabase && apiDef.childResourceMethods) {
      if (!databaseName || databaseName.trim() === '') {
        issues.push({
          id: `config-no-database-${node.id}`,
          severity: 'warning',
          category: 'configuration',
          nodeId: node.id,
          message: `${node.data.label} has no database configured`,
          details: 'You can add a database to this server using .AddDatabase().',
          suggestion: 'Add a database name to create a default database',
        });
      }
    }

    // Check for persistent lifetime on databases
    if (['database'].includes(apiDef.category)) {
      if (persistent === false) {
        issues.push({
          id: `config-non-persistent-${node.id}`,
          severity: 'warning',
          category: 'configuration',
          nodeId: node.id,
          message: `${node.data.instanceName || node.data.label} is not using persistent storage`,
          details: 'Container data will be lost when the container restarts.',
          suggestion: 'Enable ContainerLifetime.Persistent for data durability',
        });
      }
    }

    // Validate environment variables
    if (node.data.envVars) {
      node.data.envVars.forEach((env, idx) => {
        if (env.key && !/^[A-Z_][A-Z0-9_]*$/.test(env.key)) {
          issues.push({
            id: `config-env-key-${node.id}-${idx}`,
            severity: 'warning',
            category: 'configuration',
            nodeId: node.id,
            message: `Environment variable "${env.key}" may not follow conventions`,
            details: 'Environment variable names are typically uppercase with underscores.',
            suggestion: `Consider renaming to "${env.key.toUpperCase().replace(/[^A-Z0-9]/g, '_')}"`,
          });
        }
      });
    }

    // Validate port mappings
    if (node.data.ports) {
      node.data.ports.forEach((port, idx) => {
        if (port.container) {
          const portNum = parseInt(port.container, 10);
          if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
            issues.push({
              id: `config-port-${node.id}-${idx}`,
              severity: 'error',
              category: 'configuration',
              nodeId: node.id,
              message: `Invalid port number: ${port.container}`,
              details: 'Port numbers must be between 1 and 65535.',
            });
          }
        }
      });
    }
  });

  return issues;
}

// ============================================================================
// Architecture Validation
// ============================================================================

/**
 * Validates architectural best practices
 */
function validateArchitecture(ctx: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check for isolated resources (no connections)
  ctx.nodes.forEach(node => {
    const apiDef = getResourceApiDefinition(node.data.resourceType);
    if (!apiDef) return;

    const hasIncoming = ctx.edgesByTarget.has(node.id);
    const hasOutgoing = ctx.edgesBySource.has(node.id);

    // Projects without connections
    if (['project', 'container'].includes(apiDef.category)) {
      if (!hasIncoming) {
        issues.push({
          id: `arch-isolated-project-${node.id}`,
          severity: 'info',
          category: 'architecture',
          nodeId: node.id,
          message: `${node.data.instanceName || node.data.label} has no incoming connections`,
          details: 'This resource is not connected to any databases, caches, or other services.',
          suggestion: 'Consider connecting to backend resources if needed',
        });
      }
    }

    // Databases without consumers
    if (['database', 'cache', 'messaging'].includes(apiDef.category)) {
      if (!hasOutgoing) {
        issues.push({
          id: `arch-unused-resource-${node.id}`,
          severity: 'warning',
          category: 'architecture',
          nodeId: node.id,
          message: `${node.data.instanceName || node.data.label} is not connected to any consumers`,
          details: 'This resource is deployed but not used by any projects.',
          suggestion: 'Connect this resource to a project or remove it',
        });
      }
    }
  });

  // Check for multiple messaging systems
  const messagingSystems = ctx.nodes.filter(n =>
    getResourceApiDefinition(n.data.resourceType)?.category === 'messaging'
  );
  if (messagingSystems.length > 1) {
    issues.push({
      id: 'arch-multiple-messaging',
      severity: 'warning',
      category: 'architecture',
      message: 'Multiple messaging systems detected',
      details: `Found: ${messagingSystems.map(n => n.data.label).join(', ')}`,
      suggestion: 'Consider standardizing on a single messaging system for simplicity',
      relatedNodes: messagingSystems.map(n => n.id),
    });
  }

  // Check for multiple cache systems
  const cacheSystems = ctx.nodes.filter(n =>
    getResourceApiDefinition(n.data.resourceType)?.category === 'cache'
  );
  if (cacheSystems.length > 1) {
    issues.push({
      id: 'arch-multiple-cache',
      severity: 'warning',
      category: 'architecture',
      message: 'Multiple caching systems detected',
      details: `Found: ${cacheSystems.map(n => n.data.label).join(', ')}`,
      suggestion: 'Consider using a single caching system unless you have specific requirements',
      relatedNodes: cacheSystems.map(n => n.id),
    });
  }

  return issues;
}

// ============================================================================
// Security Validation
// ============================================================================

/**
 * Validates security-related concerns
 */
function validateSecurity(ctx: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  ctx.nodes.forEach(node => {
    const { resourceType, envVars, instanceName } = node.data;

    // Check for hardcoded secrets in environment variables
    if (envVars) {
      envVars.forEach((env, idx) => {
        const sensitivePatterns = ['password', 'secret', 'key', 'token', 'api_key', 'apikey'];
        const keyLower = env.key.toLowerCase();
        
        if (sensitivePatterns.some(pattern => keyLower.includes(pattern))) {
          if (env.value && env.value.length > 0 && !env.value.startsWith('{') && !env.value.startsWith('$')) {
            issues.push({
              id: `security-hardcoded-secret-${node.id}-${idx}`,
              severity: 'warning',
              category: 'security',
              nodeId: node.id,
              message: `Potential hardcoded secret in "${env.key}"`,
              details: 'Hardcoding secrets in environment variables is a security risk.',
              suggestion: 'Use user secrets or environment variable placeholders instead',
            });
          }
        }
      });
    }

    // Check OpenAI configuration
    if (resourceType === 'openai') {
      const hasApiKeyConfig = envVars?.some(env =>
        env.key.toLowerCase().includes('api') || env.key.toLowerCase().includes('key')
      );
      
      if (!hasApiKeyConfig) {
        issues.push({
          id: `security-openai-config-${node.id}`,
          severity: 'info',
          category: 'security',
          nodeId: node.id,
          message: `${instanceName || 'OpenAI'} may need API key configuration`,
          details: 'OpenAI requires an API key to function.',
          suggestion: 'Configure the API key via user secrets or environment variables',
        });
      }
    }
  });

  return issues;
}

// ============================================================================
// Performance Validation
// ============================================================================

/**
 * Validates performance-related suggestions
 */
function validatePerformance(ctx: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  ctx.nodes.forEach(node => {
    const { resourceType, replicas } = node.data;
    const apiDef = getResourceApiDefinition(resourceType);

    if (!apiDef) return;

    // Check for high-load projects without replicas
    if (['project', 'container'].includes(apiDef.category)) {
      const incomingCount = (ctx.edgesByTarget.get(node.id) || []).length;
      
      if (incomingCount > 3 && (!replicas || replicas < 2)) {
        issues.push({
          id: `perf-replicas-${node.id}`,
          severity: 'info',
          category: 'performance',
          nodeId: node.id,
          message: `${node.data.instanceName || node.data.label} has many dependencies but only 1 replica`,
          details: `This resource has ${incomingCount} incoming connections which may indicate high load.`,
          suggestion: 'Consider increasing replicas for better availability',
        });
      }
    }
  });

  return issues;
}

// ============================================================================
// Circular Dependency Detection
// ============================================================================

/**
 * Detects circular dependencies in the graph
 */
function detectCircularDependencies(ctx: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];

  function dfs(nodeId: string): string[] | null {
    visited.add(nodeId);
    recStack.add(nodeId);
    path.push(nodeId);

    const outgoingEdges = ctx.edgesBySource.get(nodeId) || [];
    
    for (const edge of outgoingEdges) {
      const neighbor = edge.target;
      
      if (!visited.has(neighbor)) {
        const cycle = dfs(neighbor);
        if (cycle) return cycle;
      } else if (recStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = path.indexOf(neighbor);
        return path.slice(cycleStart);
      }
    }

    recStack.delete(nodeId);
    path.pop();
    return null;
  }

  for (const node of ctx.nodes) {
    if (!visited.has(node.id)) {
      const cycle = dfs(node.id);
      if (cycle) {
        const cycleNames = cycle.map(id => {
          const n = ctx.nodeMap.get(id);
          return n?.data.instanceName || n?.data.label || id;
        });
        cycleNames.push(cycleNames[0]); // Complete the cycle for display

        issues.push({
          id: `arch-circular-${cycle[0]}`,
          severity: 'error',
          category: 'architecture',
          message: `Circular dependency detected: ${cycleNames.join(' → ')}`,
          details: 'Circular dependencies prevent proper dependency ordering in the generated code.',
          suggestion: 'Remove one of the connections to break the cycle',
          relatedNodes: cycle,
        });
      }
    }
  }

  return issues;
}

// ============================================================================
// Validation Helpers for Code Generator
// ============================================================================

/**
 * Checks if the configuration is ready for code generation
 */
export function isReadyForCodeGeneration(
  nodes: Node<AspireNodeData>[],
  edges: Edge[]
): { ready: boolean; blockingIssues: ValidationIssue[] } {
  const result = validatePlayground(nodes, edges);
  const blockingIssues = result.issues.filter(i => i.severity === 'error');

  return {
    ready: blockingIssues.length === 0,
    blockingIssues,
  };
}

/**
 * Gets validation issues for a specific node
 */
export function getNodeValidationIssues(
  nodeId: string,
  nodes: Node<AspireNodeData>[],
  edges: Edge[]
): ValidationIssue[] {
  const result = validatePlayground(nodes, edges);
  return result.issues.filter(
    i => i.nodeId === nodeId || i.relatedNodes?.includes(nodeId)
  );
}
