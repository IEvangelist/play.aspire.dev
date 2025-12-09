/**
 * LocalStorage service for managing AppHost.cs files and canvas states
 * Note: This storage is browser-specific and does not sync across devices
 */

import type { Node, Edge } from '@xyflow/react';

const STORAGE_PREFIX = 'aspire-playground-apphost-';
const FILE_LIST_KEY = 'aspire-playground-apphost-files';
const CURRENT_FILE_KEY = 'aspire-playground-current-file';

export interface CanvasState {
  nodes: Node[];
  edges: Edge[];
}

export interface SavedAppHost {
  name: string;
  code: string;
  canvas?: CanvasState;
  createdAt: number;
  updatedAt: number;
}

export interface AppHostFile {
  name: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Get list of all saved AppHost files
 */
export function listAppHostFiles(): AppHostFile[] {
  try {
    const filesJson = localStorage.getItem(FILE_LIST_KEY);
    if (!filesJson) return [];
    return JSON.parse(filesJson);
  } catch {
    return [];
  }
}

/**
 * Save or update an AppHost file with canvas state
 */
export function saveAppHostFile(name: string, code: string, canvas?: CanvasState): SavedAppHost {
  const now = Date.now();
  const existingFiles = listAppHostFiles();
  const existingFile = existingFiles.find(f => f.name === name);

  const file: SavedAppHost = {
    name,
    code,
    canvas,
    createdAt: existingFile?.createdAt || now,
    updatedAt: now,
  };

  // Save the file content
  localStorage.setItem(`${STORAGE_PREFIX}${name}`, JSON.stringify(file));

  // Update the file list
  const updatedFiles = existingFile
    ? existingFiles.map(f => f.name === name ? { name, createdAt: file.createdAt, updatedAt: now } : f)
    : [...existingFiles, { name, createdAt: now, updatedAt: now }];
  
  localStorage.setItem(FILE_LIST_KEY, JSON.stringify(updatedFiles));

  return file;
}

/**
 * Load an AppHost file by name
 */
export function loadAppHostFile(name: string): SavedAppHost | null {
  try {
    const fileJson = localStorage.getItem(`${STORAGE_PREFIX}${name}`);
    if (!fileJson) return null;
    return JSON.parse(fileJson);
  } catch {
    return null;
  }
}

/**
 * Delete an AppHost file
 */
export function deleteAppHostFile(name: string): boolean {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${name}`);
    const files = listAppHostFiles().filter(f => f.name !== name);
    localStorage.setItem(FILE_LIST_KEY, JSON.stringify(files));
    
    // Clear current file if it was the deleted one
    if (getCurrentFileName() === name) {
      setCurrentFileName(null);
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Rename an AppHost file
 */
export function renameAppHostFile(oldName: string, newName: string): boolean {
  try {
    const file = loadAppHostFile(oldName);
    if (!file) return false;

    // Check if new name already exists
    if (loadAppHostFile(newName)) return false;

    // Save with new name
    saveAppHostFile(newName, file.code);
    
    // Delete old file
    localStorage.removeItem(`${STORAGE_PREFIX}${oldName}`);
    const files = listAppHostFiles().filter(f => f.name !== oldName);
    localStorage.setItem(FILE_LIST_KEY, JSON.stringify(files));

    // Update current file reference if needed
    if (getCurrentFileName() === oldName) {
      setCurrentFileName(newName);
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Get the currently active file name
 */
export function getCurrentFileName(): string | null {
  return localStorage.getItem(CURRENT_FILE_KEY);
}

/**
 * Set the currently active file name
 */
export function setCurrentFileName(name: string | null): void {
  if (name) {
    localStorage.setItem(CURRENT_FILE_KEY, name);
  } else {
    localStorage.removeItem(CURRENT_FILE_KEY);
  }
}

/**
 * Check if a file name is valid
 */
export function isValidFileName(name: string): boolean {
  if (!name || name.trim().length === 0) return false;
  if (name.length > 50) return false;
  // Allow alphanumeric, hyphens, underscores, and spaces
  return /^[a-zA-Z0-9_\-\s]+$/.test(name);
}

/**
 * Format a timestamp for display
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
