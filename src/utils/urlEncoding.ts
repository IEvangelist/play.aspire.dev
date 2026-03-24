/**
 * URL Encoding utilities for sharing Aspire Playground state
 * 
 * Supports two modes:
 * - Full state sharing (?state=): preserves nodes, edges, positions, config, language
 * - Legacy code sharing (?apphost=): encodes just the generated code text
 */

import type { Node, Edge } from '@xyflow/react';
import type { AspireNodeData } from '../components/playground/AspireNode';
import { aspireResources } from '../data/aspire-resources';
import type { AppHostLanguage } from './codeGenerator';

/**
 * Full canvas state for sharing
 */
export interface PlaygroundState {
  nodes: Node<AspireNodeData>[];
  edges: Edge[];
  language: AppHostLanguage;
  version: number;
  // UI layout state
  paletteCollapsed?: boolean;
  codePreviewWidth?: number;
  toolbarCollapsed?: boolean;
  activeTab?: string;
  codePreviewCollapsed?: boolean;
}

const STATE_VERSION = 1;

// ─── Base64 helpers ───

function toUrlSafeBase64(str: string): string {
  const base64 = btoa(unescape(encodeURIComponent(str)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromUrlSafeBase64(encoded: string): string {
  let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return decodeURIComponent(escape(atob(base64)));
}

// ─── Full state encode/decode ───

/**
 * Encode full playground state (nodes, edges, language) for URL sharing.
 * Strips unnecessary fields to minimize URL length.
 */
export function encodePlaygroundState(
  nodes: Node<AspireNodeData>[],
  edges: Edge[],
  language: AppHostLanguage,
  ui?: {
    paletteCollapsed?: boolean;
    codePreviewWidth?: number;
    toolbarCollapsed?: boolean;
    activeTab?: string;
    codePreviewCollapsed?: boolean;
  },
): string {
  // Strip transient React Flow fields to reduce size
  const minimalNodes = nodes.map(n => ({
    id: n.id,
    type: n.type,
    position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
    data: n.data,
  }));

  const minimalEdges = edges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
  }));

  const state: PlaygroundState = {
    nodes: minimalNodes as Node<AspireNodeData>[],
    edges: minimalEdges as Edge[],
    language,
    version: STATE_VERSION,
    ...(ui?.paletteCollapsed !== undefined && { paletteCollapsed: ui.paletteCollapsed }),
    ...(ui?.codePreviewWidth !== undefined && { codePreviewWidth: ui.codePreviewWidth }),
    ...(ui?.toolbarCollapsed !== undefined && { toolbarCollapsed: ui.toolbarCollapsed }),
    ...(ui?.activeTab && { activeTab: ui.activeTab }),
    ...(ui?.codePreviewCollapsed !== undefined && { codePreviewCollapsed: ui.codePreviewCollapsed }),
  };

  return toUrlSafeBase64(JSON.stringify(state));
}

/**
 * Decode full playground state from URL parameter
 */
export function decodePlaygroundState(encoded: string): PlaygroundState | null {
  try {
    const json = fromUrlSafeBase64(encoded);
    const state = JSON.parse(json) as PlaygroundState;

    // Basic validation
    if (!state.nodes || !Array.isArray(state.nodes)) return null;
    if (!state.edges || !Array.isArray(state.edges)) return null;

    // Re-add default edge styling
    state.edges = state.edges.map(e => ({
      ...e,
      animated: true,
      style: { stroke: '#888', strokeWidth: 2 },
    }));

    // Re-resolve icons from current resource definitions (shared URLs may have stale hashed paths)
    state.nodes = state.nodes.map(node => {
      const resourceDef = aspireResources.find(r => r.id === node.data?.resourceType);
      if (resourceDef && resourceDef.icon) {
        return {
          ...node,
          data: { ...node.data, icon: resourceDef.icon, color: resourceDef.color },
        };
      }
      return node;
    });

    // Default language if missing
    if (!state.language) state.language = 'csharp';

    return state;
  } catch (error) {
    console.error('Failed to decode playground state:', error);
    return null;
  }
}

/**
 * Get full playground state from URL if present (?state= param)
 */
export function getStateFromUrl(): PlaygroundState | null {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('state');
  if (!encoded) return null;
  return decodePlaygroundState(encoded);
}

// ─── Legacy code-only encode/decode (backward compat) ───

/**
 * Encode AppHost code for URL sharing (legacy format)
 */
export function encodeAppHost(content: string): string {
  try {
    const compressed = content.split('\n').map(line => line.trimEnd()).join('\n');
    return toUrlSafeBase64(compressed);
  } catch (error) {
    console.error('Failed to encode AppHost content:', error);
    throw new Error('Failed to encode content for sharing');
  }
}

/**
 * Decode AppHost code from URL parameter (legacy format)
 */
export function decodeAppHost(encoded: string): string {
  try {
    return fromUrlSafeBase64(encoded);
  } catch (error) {
    console.error('Failed to decode AppHost content:', error);
    throw new Error('Failed to decode shared content');
  }
}

/**
 * Create a shareable URL with the AppHost content encoded
 */
export function createShareableUrl(content: string, baseUrl?: string): string {
  const base = baseUrl || window.location.origin + window.location.pathname;
  const encoded = encodeAppHost(content);
  return `${base}?apphost=${encoded}`;
}

/**
 * Create a URL for SVG export with the AppHost content encoded
 */
export function createSvgUrl(content: string, baseUrl?: string): string {
  const base = baseUrl || window.location.origin;
  const encoded = encodeAppHost(content);
  return `${base}/svg?apphost=${encoded}`;
}

/**
 * Extract AppHost content from URL search params
 */
export function getAppHostFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('apphost');
  
  if (!encoded) {
    return null;
  }
  
  try {
    return decodeAppHost(encoded);
  } catch (error) {
    console.error('Failed to decode AppHost from URL:', error);
    return null;
  }
}

/**
 * Check if current URL has shared AppHost content
 */
export function hasSharedAppHost(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.has('apphost');
}
