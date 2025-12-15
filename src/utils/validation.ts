/**
 * Validation Module
 * 
 * This module provides validation for the Aspire Playground.
 * It now uses the API-based validation engine for comprehensive validation.
 * 
 * @see apiValidation.ts for the full API-based validation engine
 */

import type { Node, Edge } from '@xyflow/react';
import type { AspireNodeData } from '../components/playground/AspireNode';
import { 
  validatePlayground as apiValidatePlayground,
  type ValidationSeverity,
  type ValidationCategory,
} from './apiValidation';

// Re-export types for backward compatibility
export type { ValidationSeverity, ValidationCategory };

export interface ValidationIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  nodeId?: string;
  message: string;
  category: 'architecture' | 'security' | 'performance' | 'reliability' | 'naming' | 'configuration' | 'connection' | 'api' | 'semantic';
  suggestion?: string;
}

/**
 * Validates the playground state.
 * Uses the new API-based validation engine for comprehensive validation.
 */
export function validatePlayground(nodes: Node<AspireNodeData>[], edges: Edge[]): ValidationIssue[] {
  // Use the API-based validation engine
  const result = apiValidatePlayground(nodes, edges);
  
  // Convert API validation issues to the expected format
  return result.issues.map(issue => ({
    id: issue.id,
    severity: issue.severity,
    nodeId: issue.nodeId,
    message: issue.message,
    category: mapCategory(issue.category),
    suggestion: issue.suggestion,
  }));
}

/**
 * Maps API validation categories to the legacy format
 */
function mapCategory(category: string): ValidationIssue['category'] {
  switch (category) {
    case 'naming':
      return 'naming';
    case 'configuration':
      return 'configuration';
    case 'connection':
      return 'connection';
    case 'architecture':
      return 'architecture';
    case 'security':
      return 'security';
    case 'performance':
      return 'performance';
    case 'reliability':
      return 'reliability';
    case 'api':
      return 'api';
    case 'semantic':
      return 'semantic';
    default:
      return 'architecture';
  }
}
