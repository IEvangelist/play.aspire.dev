/**
 * URL Encoding utilities for sharing AppHost.cs content
 * 
 * This module provides functions to encode/decode AppHost.cs content
 * for URL sharing. Uses base64 encoding with URL-safe characters.
 */

/**
 * Encode AppHost.cs content for URL sharing
 * Uses base64 with URL-safe characters
 */
export function encodeAppHost(content: string): string {
  try {
    // Compress by removing unnecessary whitespace but preserve structure
    const compressed = content
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n');
    
    // Convert to base64 with URL-safe characters
    const base64 = btoa(unescape(encodeURIComponent(compressed)));
    
    // Make URL-safe by replacing + with - and / with _
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (error) {
    console.error('Failed to encode AppHost content:', error);
    throw new Error('Failed to encode content for sharing');
  }
}

/**
 * Decode AppHost.cs content from URL parameter
 */
export function decodeAppHost(encoded: string): string {
  try {
    // Restore base64 characters
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    
    // Decode from base64
    return decodeURIComponent(escape(atob(base64)));
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
