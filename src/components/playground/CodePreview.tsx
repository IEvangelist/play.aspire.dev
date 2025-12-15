import { useState, useEffect, useMemo } from 'react';
import { createHighlighter } from 'shiki';
import type { Node, Edge } from '@xyflow/react';
import type { GeneratedCode } from '../../utils/codeGenerator';
import type { AspireNodeData } from './AspireNode';
import { validatePlayground, type ValidationIssue } from '../../utils/validation';
import ConfirmDialog from './ConfirmDialog';
import {
  listAppHostFiles,
  saveAppHostFile,
  loadAppHostFile,
  deleteAppHostFile,
  renameAppHostFile,
  isValidFileName,
  formatTimestamp,
  type AppHostFile,
} from '../../utils/appHostStorage';

interface CodePreviewProps {
  generatedCode: GeneratedCode;
  width: number;
  onResize: (newWidth: number) => void;
  nodes: Node<AspireNodeData>[];
  edges: Edge[];
  onNodeClick?: (nodeId: string) => void;
  onLoadCanvas?: (nodes: Node<AspireNodeData>[], edges: Edge[]) => void;
  currentFile: string | null;
  onSetCurrentFile: (name: string | null) => void;
  theme: 'dark' | 'light';
}

type Tab = 'apphost' | 'packages' | 'deploy' | 'validation' | 'files';

export default function CodePreview({ generatedCode, width, onResize, nodes, edges, onNodeClick, onLoadCanvas, currentFile, onSetCurrentFile, theme }: CodePreviewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('apphost');
  const [isResizing, setIsResizing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedDeployIndex, setCopiedDeployIndex] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [expandedWidth, setExpandedWidth] = useState(() => {
    // Initialize to a proper expanded width, not the collapsed width
    const COLLAPSED_WIDTH = 54; // 48px content + 6px resize handle
    const DEFAULT_EXPANDED_WIDTH = 520;
    return width > COLLAPSED_WIDTH ? width : DEFAULT_EXPANDED_WIDTH;
  });
  const [highlightedCode, setHighlightedCode] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollapsedMenuOpen, setIsCollapsedMenuOpen] = useState(false);
  const [menuButtonRect, setMenuButtonRect] = useState<DOMRect | null>(null);
  
  // Responsive breakpoint for hamburger menu
  const COMPACT_WIDTH = 580;
  
  // File management state
  const [savedFiles, setSavedFiles] = useState<AppHostFile[]>([]);
  const [newFileName, setNewFileName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; fileName: string | null }>({
    isOpen: false,
    fileName: null,
  });
  const [overwriteConfirm, setOverwriteConfirm] = useState<{ isOpen: boolean; targetFile: string | null }>({
    isOpen: false,
    targetFile: null,
  });
  const [storageWarningDismissed, setStorageWarningDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('aspire-playground-storage-warning-dismissed') === 'true';
    }
    return false;
  });

  const COLLAPSED_WIDTH = 54; // 48px content + 6px resize handle
  const DEFAULT_EXPANDED_WIDTH = 520;

  // Validation
  const validationIssues = useMemo(() => validatePlayground(nodes, edges), [nodes, edges]);
  const errorCount = validationIssues.filter(i => i.severity === 'error').length;
  const warningCount = validationIssues.filter(i => i.severity === 'warning').length;
  const infoCount = validationIssues.filter(i => i.severity === 'info').length;

  // Set collapsed width on mount if starting collapsed
  useEffect(() => {
    if (isCollapsed) {
      onResize(COLLAPSED_WIDTH);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load saved files on mount
  useEffect(() => {
    setSavedFiles(listAppHostFiles());
  }, []);

  // Save storage warning preference
  useEffect(() => {
    localStorage.setItem('aspire-playground-storage-warning-dismissed', storageWarningDismissed.toString());
  }, [storageWarningDismissed]);

  // Initialize Shiki highlighter
  useEffect(() => {
    let cancelled = false;

    const highlightCode = async () => {
      const highlighter = await createHighlighter({
        themes: ['laserwave', 'github-light'],
        langs: ['csharp', 'powershell'],
      });

      if (cancelled) return;

      const highlighted = highlighter.codeToHtml(generatedCode.appHost, {
        lang: 'csharp',
        theme: theme === 'dark' ? 'laserwave' : 'github-light',
      });

      if (!cancelled) {
        setHighlightedCode(highlighted);
      }
    };

    highlightCode();

    return () => {
      cancelled = true;
    };
  }, [generatedCode, theme]);

  useEffect(() => {
    if (!isResizing) return;

    // Prevent text selection while resizing
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      const maxWidth = Math.min(900, window.innerWidth * 0.6);
      const minExpandedWidth = 300;
      
      // When collapsed and user drags wider, immediately snap out of collapsed mode
      if (isCollapsed && newWidth > COLLAPSED_WIDTH + 20) {
        // Snap to minimum expanded width or the drag position, whichever is larger
        const targetWidth = Math.max(minExpandedWidth, Math.min(newWidth, maxWidth));
        onResize(targetWidth);
        setExpandedWidth(targetWidth);
        setIsCollapsed(false);
      } else if (!isCollapsed && newWidth >= minExpandedWidth && newWidth <= maxWidth) {
        // Normal resizing when expanded
        onResize(newWidth);
        setExpandedWidth(newWidth);
      } else if (!isCollapsed && newWidth < minExpandedWidth && newWidth > COLLAPSED_WIDTH) {
        // Allow dragging smaller but maintain minimum when released
        onResize(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      // Restore text selection
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      
      // Snap to minimum expanded width if released between collapsed and minimum
      if (!isCollapsed && width < 300 && width > COLLAPSED_WIDTH) {
        onResize(300);
        setExpandedWidth(300);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // Restore text selection on cleanup
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing, onResize, isCollapsed, width]);

  const handleDoubleClick = () => {
    if (isCollapsed) {
      onResize(expandedWidth || DEFAULT_EXPANDED_WIDTH);
      setIsCollapsed(false);
    } else {
      setExpandedWidth(width);
      onResize(COLLAPSED_WIDTH);
      setIsCollapsed(true);
    }
  };

  const handleSaveFile = () => {
    if (!isValidFileName(newFileName)) return;
    // Save both the code AND the canvas state (nodes/edges)
    saveAppHostFile(newFileName, generatedCode.appHost, { nodes, edges });
    setSavedFiles(listAppHostFiles());
    onSetCurrentFile(newFileName);
    setNewFileName('');
    setShowSaveDialog(false);
  };

  const handleLoadFile = (name: string) => {
    const file = loadAppHostFile(name);
    if (file) {
      onSetCurrentFile(name);
      // Load the canvas state if available
      if (file.canvas && onLoadCanvas) {
        onLoadCanvas(file.canvas.nodes as Node<AspireNodeData>[], file.canvas.edges);
      }
    }
  };

  const handleSaveToFile = (name: string) => {
    // If saving to a different file than the currently loaded one, prompt for confirmation
    if (currentFile && currentFile !== name) {
      setOverwriteConfirm({ isOpen: true, targetFile: name });
      return;
    }
    // Direct save if it's the current file or no file is loaded
    saveAppHostFile(name, generatedCode.appHost, { nodes, edges });
    setSavedFiles(listAppHostFiles());
  };

  const confirmOverwriteFile = () => {
    if (overwriteConfirm.targetFile) {
      saveAppHostFile(overwriteConfirm.targetFile, generatedCode.appHost, { nodes, edges });
      setSavedFiles(listAppHostFiles());
    }
    setOverwriteConfirm({ isOpen: false, targetFile: null });
  };

  const handleDeleteFile = (name: string) => {
    setDeleteConfirm({ isOpen: true, fileName: name });
  };

  const confirmDeleteFile = () => {
    if (deleteConfirm.fileName) {
      deleteAppHostFile(deleteConfirm.fileName);
      setSavedFiles(listAppHostFiles());
      if (currentFile === deleteConfirm.fileName) {
        onSetCurrentFile(null);
      }
    }
    setDeleteConfirm({ isOpen: false, fileName: null });
  };

  const handleRenameFile = (oldName: string) => {
    if (!isValidFileName(renameValue) || renameValue === oldName) {
      setRenamingFile(null);
      return;
    }
    if (renameAppHostFile(oldName, renameValue)) {
      setSavedFiles(listAppHostFiles());
      if (currentFile === oldName) {
        onSetCurrentFile(renameValue);
      }
    }
    setRenamingFile(null);
    setRenameValue('');
  };

  const handleDownloadFile = (name: string) => {
    const file = loadAppHostFile(name);
    if (file) {
      const blob = new Blob([file.code], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.cs`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getSeverityIcon = (severity: ValidationIssue['severity']) => {
    switch (severity) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
    }
  };

  const getSeverityColor = (severity: ValidationIssue['severity']) => {
    switch (severity) {
      case 'error': return '#DC2626';
      case 'warning': return '#F59E0B';
      case 'info': return '#3B82F6';
    }
  };

  const getCategoryLabel = (category: ValidationIssue['category']) => {
    switch (category) {
      case 'architecture': return 'Architecture';
      case 'security': return 'Security';
      case 'performance': return 'Performance';
      case 'reliability': return 'Reliability';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'apphost':
        return (
          <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Action buttons container */}
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              display: 'flex',
              gap: '8px',
              zIndex: 10,
            }}>
              {/* Download button */}
              <button
                onClick={() => {
                  const fileName = currentFile || 'AppHost';
                  const blob = new Blob([generatedCode.appHost], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${fileName}.cs`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                style={{
                  padding: '6px 10px',
                  fontSize: '12px',
                  background: 'var(--sl-color-gray-5)',
                  color: 'var(--sl-color-white)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--sl-color-gray-4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--sl-color-gray-5)';
                }}
                title="Download code as .cs file"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download
              </button>
              {/* Copy button */}
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(generatedCode.appHost);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{
                  padding: '6px 10px',
                  fontSize: '12px',
                  background: copied ? 'var(--sl-color-green-high)' : 'var(--sl-color-gray-5)',
                  color: 'var(--sl-color-white)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                onMouseEnter={(e) => {
                  if (!copied) e.currentTarget.style.background = 'var(--sl-color-gray-4)';
                }}
                onMouseLeave={(e) => {
                  if (!copied) e.currentTarget.style.background = 'var(--sl-color-gray-5)';
                }}
                title="Copy code"
              >
                {copied ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            {highlightedCode ? (
              <div
                style={{
                  margin: 0,
                  overflow: 'auto',
                  flex: 1,
                  userSelect: 'text',
                  WebkitUserSelect: 'text',
                }}
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />
            ) : (
              <pre
                style={{
                  margin: 0,
                  padding: '16px',
                  fontSize: '16px',
                  lineHeight: '1.6',
                  fontFamily: 'var(--sl-font-mono)',
                  color: 'var(--sl-color-white)',
                  overflow: 'auto',
                  flex: 1,
                  userSelect: 'text',
                  WebkitUserSelect: 'text',
                }}
              >
                {generatedCode.appHost}
              </pre>
            )}
            
            {/* Instructions */}
            <div
              style={{
                padding: '16px',
                background: 'var(--sl-color-gray-6)',
                borderTop: '1px solid var(--sl-color-gray-5)',
                fontSize: '13px',
                lineHeight: '1.6',
                color: 'var(--sl-color-gray-2)',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>💡</span>
                <div>
                  <strong style={{ color: 'var(--sl-color-white)', fontWeight: 600 }}>Note:</strong> This is generated code for your <code style={{ 
                    background: 'var(--sl-color-gray-5)', 
                    padding: '2px 6px', 
                    borderRadius: '4px',
                    fontFamily: 'var(--sl-font-mono)',
                    fontSize: '12px',
                  }}>AppHost.cs</code> file. Project paths (e.g., <code style={{ 
                    background: 'var(--sl-color-gray-5)', 
                    padding: '2px 6px', 
                    borderRadius: '4px',
                    fontFamily: 'var(--sl-font-mono)',
                    fontSize: '12px',
                  }}>../MyProject</code>) are expected to exist on disk relative to your AppHost project once your solution is set up.
                </div>
              </div>
            </div>
          </div>
        );

      case 'packages':
        return (
          <div style={{ padding: '20px', position: 'relative' }}>
            {/* Copy button */}
            {generatedCode.nugetPackages.length > 0 && (
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(generatedCode.nugetPackages.join('\n'));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  background: copied ? 'var(--sl-color-green-high)' : 'var(--sl-color-gray-5)',
                  color: 'var(--sl-color-white)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                onMouseEnter={(e) => {
                  if (!copied) e.currentTarget.style.background = 'var(--sl-color-gray-4)';
                }}
                onMouseLeave={(e) => {
                  if (!copied) e.currentTarget.style.background = 'var(--sl-color-gray-5)';
                }}
                title="Copy all packages"
              >
                {copied ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy All
                  </>
                )}
              </button>
            )}
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--sl-color-white)',
              letterSpacing: '-0.01em',
            }}>
              Required NuGet Packages
            </h3>
            {generatedCode.nugetPackages.length === 0 ? (
              <p style={{ 
                color: 'var(--sl-color-gray-2)', 
                fontSize: '14px',
                lineHeight: '1.6',
              }}>
                No additional packages required for your current configuration.
              </p>
            ) : (
              <ul style={{ margin: 0, padding: 0, fontSize: '15px', lineHeight: '1.8', listStyle: 'none' }}>
                {generatedCode.nugetPackages.map((pkg, index) => {
                  const packageName = pkg.split('@')[0];
                  const nugetUrl = `https://www.nuget.org/packages/${packageName}`;
                  return (
                    <li key={index} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px' }}>📦</span>
                      <a
                        href={nugetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: 'var(--sl-color-accent-high)',
                          fontFamily: 'var(--sl-font-mono)',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--sl-color-accent)';
                          e.currentTarget.style.textDecoration = 'underline';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--sl-color-accent-high)';
                          e.currentTarget.style.textDecoration = 'none';
                        }}
                      >
                        {pkg}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );

      case 'deploy':
        return (
          <div style={{ padding: '20px' }}>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--sl-color-white)',
              letterSpacing: '-0.01em',
            }}>
              Deployment Commands
            </h3>
            <p style={{
              margin: '0 0 16px 0',
              fontSize: '13px',
              color: 'var(--sl-color-gray-2)',
              lineHeight: '1.5',
            }}>
              Use the Aspire CLI to run, deploy, and manage your application. Click any command to copy.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {generatedCode.deploymentOptions.map((option, index) => (
                <div
                  key={index}
                  style={{
                    padding: '12px 14px',
                    background: 'var(--sl-color-gray-6)',
                    borderRadius: '6px',
                    border: '1px solid var(--sl-color-gray-5)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--sl-color-gray-5)';
                    e.currentTarget.style.borderColor = 'var(--sl-color-accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--sl-color-gray-6)';
                    e.currentTarget.style.borderColor = 'var(--sl-color-gray-5)';
                  }}
                >
                  <code style={{
                    fontSize: '14px',
                    fontFamily: 'var(--sl-font-mono)',
                    color: 'var(--sl-color-accent-high)',
                  }}>
                    {option.command}
                  </code>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Docs link */}
                    <a
                      href={option.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        borderRadius: '4px',
                        color: 'var(--sl-color-gray-3)',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--sl-color-accent)';
                        e.currentTarget.style.background = 'var(--sl-color-gray-6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--sl-color-gray-3)';
                        e.currentTarget.style.background = 'transparent';
                      }}
                      title="View CLI documentation"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                      </svg>
                    </a>
                    {/* Copy button */}
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(option.command);
                        setCopiedDeployIndex(index);
                        setTimeout(() => setCopiedDeployIndex(null), 2000);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        borderRadius: '4px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: copiedDeployIndex === index ? 'var(--sl-color-accent)' : 'var(--sl-color-gray-3)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (copiedDeployIndex !== index) {
                          e.currentTarget.style.color = 'var(--sl-color-accent)';
                          e.currentTarget.style.background = 'var(--sl-color-gray-6)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (copiedDeployIndex !== index) {
                          e.currentTarget.style.color = 'var(--sl-color-gray-3)';
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                      title="Copy command"
                    >
                      {copiedDeployIndex === index ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'validation':
        return (
          <div style={{ padding: '20px' }}>
            {/* Summary */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '20px',
              padding: '12px 16px',
              background: validationIssues.length === 0 ? 'rgba(16, 185, 129, 0.1)' : 'var(--sl-color-gray-6)',
              borderRadius: '8px',
              border: `1px solid ${validationIssues.length === 0 ? 'rgba(16, 185, 129, 0.3)' : 'var(--sl-color-gray-5)'}`,
            }}>
              {validationIssues.length === 0 ? (
                <>
                  <span style={{ fontSize: '20px' }}>✅</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#10B981' }}>
                      All checks passed
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--sl-color-gray-2)', marginTop: '2px' }}>
                      Your architecture looks good!
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                    {errorCount > 0 && (
                      <span style={{ color: '#DC2626', fontWeight: 500 }}>
                        {errorCount} error{errorCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {warningCount > 0 && (
                      <span style={{ color: '#F59E0B', fontWeight: 500 }}>
                        {warningCount} warning{warningCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {infoCount > 0 && (
                      <span style={{ color: '#3B82F6', fontWeight: 500 }}>
                        {infoCount} suggestion{infoCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Issues List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {validationIssues.map(issue => (
                <div
                  key={issue.id}
                  style={{
                    padding: '14px',
                    background: 'var(--sl-color-gray-6)',
                    border: `1px solid ${getSeverityColor(issue.severity)}33`,
                    borderLeft: `4px solid ${getSeverityColor(issue.severity)}`,
                    borderRadius: '6px',
                    cursor: issue.nodeId ? 'pointer' : 'default',
                  }}
                  onClick={() => issue.nodeId && onNodeClick?.(issue.nodeId)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ fontSize: '16px', marginTop: '1px' }}>
                      {getSeverityIcon(issue.severity)}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{
                          fontSize: '10px',
                          padding: '2px 8px',
                          background: `${getSeverityColor(issue.severity)}22`,
                          color: getSeverityColor(issue.severity),
                          borderRadius: '4px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}>
                          {getCategoryLabel(issue.category)}
                        </span>
                      </div>
                      <p style={{
                        margin: '0 0 6px 0',
                        fontSize: '14px',
                        color: 'var(--sl-color-white)',
                        fontWeight: 500,
                        lineHeight: '1.5',
                      }}>
                        {issue.message}
                      </p>
                      {issue.suggestion && (
                        <p style={{
                          margin: 0,
                          fontSize: '13px',
                          color: 'var(--sl-color-gray-2)',
                          lineHeight: '1.5',
                        }}>
                          💡 {issue.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {nodes.length === 0 && (
              <p style={{
                textAlign: 'center',
                color: 'var(--sl-color-gray-3)',
                fontSize: '14px',
                marginTop: '40px',
              }}>
                Add resources to the canvas to see validation results.
              </p>
            )}
          </div>
        );

      case 'files':
        return (
          <div style={{ padding: '20px' }}>
            {/* Browser Storage Warning */}
            {!storageWarningDismissed && (
              <div style={{
                padding: '12px 14px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '8px',
                marginBottom: '16px',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '6px',
                    }}>
                      <span style={{ fontSize: '14px' }}>⚠️</span>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#F59E0B',
                      }}>
                        Browser-Only Storage
                      </span>
                    </div>
                    <p style={{
                      margin: 0,
                      fontSize: '12px',
                      color: 'var(--sl-color-gray-2)',
                      lineHeight: '1.5',
                    }}>
                      Files are saved locally in your browser. They won't sync across devices or browsers, 
                      and may be lost if you clear browser data.
                    </p>
                  </div>
                  <button
                    onClick={() => setStorageWarningDismissed(true)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--sl-color-gray-3)',
                      cursor: 'pointer',
                      padding: '4px',
                      fontSize: '14px',
                      lineHeight: 1,
                    }}
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Save Current */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--sl-color-white)',
              }}>
                Save Current AppHost
              </h3>
              {showSaveDialog ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Enter file name..."
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveFile();
                      if (e.key === 'Escape') setShowSaveDialog(false);
                    }}
                    autoFocus
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: '13px',
                      background: 'var(--sl-color-gray-6)',
                      border: '1px solid var(--sl-color-gray-5)',
                      borderRadius: '6px',
                      color: 'var(--sl-color-white)',
                      outline: 'none',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--sl-color-accent)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--sl-color-gray-5)'}
                  />
                  <button
                    onClick={handleSaveFile}
                    disabled={!isValidFileName(newFileName)}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      background: isValidFileName(newFileName) ? 'var(--sl-color-accent)' : 'var(--sl-color-gray-5)',
                      color: isValidFileName(newFileName) ? 'var(--sl-color-black)' : 'var(--sl-color-gray-3)',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isValidFileName(newFileName) ? 'pointer' : 'not-allowed',
                      fontWeight: 500,
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setShowSaveDialog(false); setNewFileName(''); }}
                    style={{
                      padding: '8px 12px',
                      fontSize: '13px',
                      background: 'var(--sl-color-gray-5)',
                      color: 'var(--sl-color-white)',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSaveDialog(true)}
                  style={{
                    padding: '10px 16px',
                    fontSize: '13px',
                    background: 'var(--sl-color-accent)',
                    color: 'var(--sl-color-black)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--sl-color-accent-high)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--sl-color-accent)'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  Save as New File
                </button>
              )}
            </div>

            {/* Saved Files List */}
            <div>
              <h3 style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--sl-color-white)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                Saved Files ({savedFiles.length})
              </h3>
              
              {savedFiles.length === 0 ? (
                <p style={{
                  color: 'var(--sl-color-gray-3)',
                  fontSize: '13px',
                  textAlign: 'center',
                  padding: '24px 16px',
                  background: 'var(--sl-color-gray-6)',
                  borderRadius: '8px',
                  border: '1px dashed var(--sl-color-gray-5)',
                }}>
                  No saved files yet. Save your current AppHost to get started.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {savedFiles.map((file) => (
                    <div
                      key={file.name}
                      style={{
                        padding: '12px',
                        background: currentFile === file.name ? 'var(--sl-color-gray-5)' : 'var(--sl-color-gray-6)',
                        border: `1px solid ${currentFile === file.name ? 'var(--sl-color-accent)' : 'var(--sl-color-gray-5)'}`,
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 32 32" fill="#368832">
                        <path d="M19.792 7.071h2.553v2.553H24.9V7.071h2.552v2.553H30v2.552h-2.55v2.551H30v2.553h-2.551v2.552H24.9v-2.55h-2.55v2.552h-2.557v-2.55H17.24v-2.559h2.553v-2.546H17.24V9.622h2.554Zm2.553 7.658H24.9v-2.553h-2.555Zm-7.656 9.284a10.2 10.2 0 0 1-4.653.915a7.6 7.6 0 0 1-5.89-2.336A8.84 8.84 0 0 1 2 16.367a9.44 9.44 0 0 1 2.412-6.719a8.18 8.18 0 0 1 6.259-2.577a11.1 11.1 0 0 1 4.018.638v3.745a6.8 6.8 0 0 0-3.723-1.036a4.8 4.8 0 0 0-3.7 1.529a5.88 5.88 0 0 0-1.407 4.142a5.77 5.77 0 0 0 1.328 3.992a4.55 4.55 0 0 0 3.575 1.487a7.3 7.3 0 0 0 3.927-1.108Z"/>
                      </svg>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {renamingFile === file.name ? (
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameFile(file.name);
                              if (e.key === 'Escape') { setRenamingFile(null); setRenameValue(''); }
                            }}
                            onBlur={() => handleRenameFile(file.name)}
                            autoFocus
                            style={{
                              width: '100%',
                              padding: '4px 8px',
                              fontSize: '13px',
                              background: 'var(--sl-color-gray-7)',
                              border: '1px solid var(--sl-color-accent)',
                              borderRadius: '4px',
                              color: 'var(--sl-color-white)',
                              outline: 'none',
                            }}
                          />
                        ) : (
                          <>
                            <div style={{
                              fontSize: '13px',
                              fontWeight: 500,
                              color: 'var(--sl-color-white)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {file.name}.cs
                            </div>
                            <div style={{
                              fontSize: '11px',
                              color: 'var(--sl-color-gray-3)',
                              marginTop: '2px',
                            }}>
                              Modified {formatTimestamp(file.updatedAt)}
                            </div>
                          </>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button
                          onClick={() => handleLoadFile(file.name)}
                          style={{
                            padding: '6px 10px',
                            fontSize: '11px',
                            background: 'var(--sl-color-gray-5)',
                            color: 'var(--sl-color-white)',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                          title="Load this file"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleSaveToFile(file.name)}
                          style={{
                            padding: '6px 10px',
                            fontSize: '11px',
                            background: currentFile === file.name ? 'var(--sl-color-accent)' : 'var(--sl-color-gray-5)',
                            color: currentFile === file.name ? 'var(--sl-color-black)' : 'var(--sl-color-white)',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                          title="Save current canvas to this file"
                        >
                          Save
                        </button>
                        <div style={{ width: '12px' }} />
                        <button
                          onClick={() => { setRenamingFile(file.name); setRenameValue(file.name); }}
                          style={{
                            padding: '6px',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--sl-color-gray-3)',
                            cursor: 'pointer',
                            borderRadius: '4px',
                          }}
                          title="Rename"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDownloadFile(file.name)}
                          style={{
                            padding: '6px',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--sl-color-gray-3)',
                            cursor: 'pointer',
                            borderRadius: '4px',
                          }}
                          title="Download"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file.name)}
                          style={{
                            padding: '6px',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--sl-color-gray-3)',
                            cursor: 'pointer',
                            borderRadius: '4px',
                          }}
                          title="Delete"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div
      style={{
        width: `${width}px`,
        height: '100%',
        background: 'var(--sl-color-gray-7)',
        borderLeft: '1px solid var(--sl-color-gray-5)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        zIndex: 5,
      }}
    >
      {/* Resize Handle */}
      <div
        onMouseDown={() => setIsResizing(true)}
        onDoubleClick={handleDoubleClick}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '6px',
          cursor: 'col-resize',
          background: isResizing ? 'var(--sl-color-accent)' : 'var(--sl-color-gray-4)',
          transition: 'all 0.2s',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => {
          if (!isResizing) {
            e.currentTarget.style.background = 'var(--sl-color-accent)';
            e.currentTarget.style.width = '8px';
          }
        }}
        onMouseLeave={(e) => {
          if (!isResizing) {
            e.currentTarget.style.background = 'var(--sl-color-gray-4)';
            e.currentTarget.style.width = '6px';
          }
        }}
        title="Drag to resize, double-click to collapse/expand"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', opacity: 0.7 }}>
          <div style={{ width: '2px', height: '2px', background: 'var(--sl-color-white)', borderRadius: '50%' }} />
          <div style={{ width: '2px', height: '2px', background: 'var(--sl-color-white)', borderRadius: '50%' }} />
          <div style={{ width: '2px', height: '2px', background: 'var(--sl-color-white)', borderRadius: '50%' }} />
        </div>
      </div>

      {/* Collapsed state */}
      {isCollapsed ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '16px',
            paddingBottom: '16px',
            marginLeft: '6px',
            gap: '12px',
            justifyContent: 'space-between',
          }}
        >
          {/* Top section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handleDoubleClick}
              style={{
                width: '36px',
                height: '36px',
                background: 'var(--sl-color-gray-6)',
                border: '1px solid var(--sl-color-gray-5)',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--sl-color-gray-5)';
                e.currentTarget.style.borderColor = 'var(--sl-color-accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--sl-color-gray-6)';
                e.currentTarget.style.borderColor = 'var(--sl-color-gray-5)';
              }}
              title="Expand code panel"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sl-color-white)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          
          {/* Hamburger Menu for Tab Selection */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => {
                setIsCollapsedMenuOpen(!isCollapsedMenuOpen);
                // Store button position for dropdown
                const rect = e.currentTarget.getBoundingClientRect();
                setMenuButtonRect(rect);
              }}
              style={{
                width: '36px',
                height: '36px',
                background: isCollapsedMenuOpen ? 'var(--sl-color-accent)' : 'var(--sl-color-gray-6)',
                border: '1px solid var(--sl-color-gray-5)',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isCollapsedMenuOpen) {
                  e.currentTarget.style.background = 'var(--sl-color-gray-5)';
                  e.currentTarget.style.borderColor = 'var(--sl-color-accent)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isCollapsedMenuOpen) {
                  e.currentTarget.style.background = 'var(--sl-color-gray-6)';
                  e.currentTarget.style.borderColor = 'var(--sl-color-gray-5)';
                }
              }}
              title="Select tab"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sl-color-white)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {isCollapsedMenuOpen && menuButtonRect && (
              <div
                style={{
                  position: 'fixed',
                  top: menuButtonRect.top,
                  left: menuButtonRect.left - 170,
                  background: 'var(--sl-color-gray-6)',
                  border: '1px solid var(--sl-color-gray-5)',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  zIndex: 1000,
                  overflow: 'hidden',
                  minWidth: '160px',
                }}
              >
                <button
                  onClick={() => { setActiveTab('apphost'); setIsCollapsedMenuOpen(false); }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '13px',
                    background: activeTab === 'apphost' ? 'var(--sl-color-gray-5)' : 'transparent',
                    color: activeTab === 'apphost' ? 'var(--sl-color-white)' : 'var(--sl-color-gray-3)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'apphost') e.currentTarget.style.background = 'var(--sl-color-gray-5)';
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'apphost') e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 32 32" fill="#368832">
                    <path d="M19.792 7.071h2.553v2.553H24.9V7.071h2.552v2.553H30v2.552h-2.55v2.551H30v2.553h-2.551v2.552H24.9v-2.55h-2.55v2.552h-2.557v-2.55H17.24v-2.559h2.553v-2.546H17.24V9.622h2.554Zm2.553 7.658H24.9v-2.553h-2.555Zm-7.656 9.284a10.2 10.2 0 0 1-4.653.915a7.6 7.6 0 0 1-5.89-2.336A8.84 8.84 0 0 1 2 16.367a9.44 9.44 0 0 1 2.412-6.719a8.18 8.18 0 0 1 6.259-2.577a11.1 11.1 0 0 1 4.018.638v3.745a6.8 6.8 0 0 0-3.723-1.036a4.8 4.8 0 0 0-3.7 1.529a5.88 5.88 0 0 0-1.407 4.142a5.77 5.77 0 0 0 1.328 3.992a4.55 4.55 0 0 0 3.575 1.487a7.3 7.3 0 0 0 3.927-1.108Z"/>
                  </svg>
                  AppHost.cs
                </button>
                <button
                  onClick={() => { setActiveTab('packages'); setIsCollapsedMenuOpen(false); }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '13px',
                    background: activeTab === 'packages' ? 'var(--sl-color-gray-5)' : 'transparent',
                    color: activeTab === 'packages' ? 'var(--sl-color-white)' : 'var(--sl-color-gray-3)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'packages') e.currentTarget.style.background = 'var(--sl-color-gray-5)';
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'packages') e.currentTarget.style.background = 'transparent';
                  }}
                >
                  📦 Packages
                </button>
                <button
                  onClick={() => { setActiveTab('deploy'); setIsCollapsedMenuOpen(false); }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '13px',
                    background: activeTab === 'deploy' ? 'var(--sl-color-gray-5)' : 'transparent',
                    color: activeTab === 'deploy' ? 'var(--sl-color-white)' : 'var(--sl-color-gray-3)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'deploy') e.currentTarget.style.background = 'var(--sl-color-gray-5)';
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'deploy') e.currentTarget.style.background = 'transparent';
                  }}
                >
                  🚀 Deploy
                </button>
                <button
                  onClick={() => { setActiveTab('validation'); setIsCollapsedMenuOpen(false); }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '13px',
                    background: activeTab === 'validation' ? 'var(--sl-color-gray-5)' : 'transparent',
                    color: activeTab === 'validation' ? 'var(--sl-color-white)' : 'var(--sl-color-gray-3)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'validation') e.currentTarget.style.background = 'var(--sl-color-gray-5)';
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'validation') e.currentTarget.style.background = 'transparent';
                  }}
                >
                  ✅ Validation
                  {validationIssues.length > 0 && (
                    <span style={{
                      background: errorCount > 0 ? '#DC2626' : '#F59E0B',
                      color: 'white',
                      fontSize: '10px',
                      padding: '1px 5px',
                      borderRadius: '10px',
                      fontWeight: 600,
                    }}>
                      {validationIssues.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { setActiveTab('files'); setIsCollapsedMenuOpen(false); }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontSize: '13px',
                    background: activeTab === 'files' ? 'var(--sl-color-gray-5)' : 'transparent',
                    color: activeTab === 'files' ? 'var(--sl-color-white)' : 'var(--sl-color-gray-3)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'files') e.currentTarget.style.background = 'var(--sl-color-gray-5)';
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'files') e.currentTarget.style.background = 'transparent';
                  }}
                >
                  📁 Files
                  {savedFiles.length > 0 && (
                    <span style={{
                      background: 'var(--sl-color-gray-4)',
                      color: 'var(--sl-color-gray-2)',
                      fontSize: '10px',
                      padding: '1px 5px',
                      borderRadius: '10px',
                      fontWeight: 600,
                    }}>
                      {savedFiles.length}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
          
            <span style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              color: 'var(--sl-color-gray-3)',
              fontSize: '12px',
              fontWeight: 500,
            }}>
              Code Preview
            </span>
          </div>
          
          {/* Bottom section - Aspire docs link */}
          <a
            href="https://aspire.dev/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              width: '36px',
              height: '36px',
              background: 'transparent',
              border: '1px solid var(--sl-color-gray-5)',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--sl-color-gray-5)';
              e.currentTarget.style.borderColor = 'var(--sl-color-accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'var(--sl-color-gray-5)';
            }}
            title="Aspire Documentation"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sl-color-gray-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </a>
        </div>
      ) : (
        <>
          {/* Header with Tabs */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--sl-color-gray-5)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative',
              gap: '8px',
            }}
          >
            {/* Collapse Button */}
            <button
              onClick={handleDoubleClick}
              style={{
                width: '28px',
                height: '28px',
                background: 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--sl-color-gray-5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              title="Collapse panel"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sl-color-gray-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            {/* Compact Mode: Hamburger Menu */}
            {width < COMPACT_WIDTH ? (
              <div style={{ position: 'relative', flex: 1 }}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    background: 'var(--sl-color-gray-5)',
                    color: 'var(--sl-color-white)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {activeTab === 'apphost' && (
                      <>
                        <svg width="12" height="12" viewBox="0 0 32 32" fill="#368832">
                          <path d="M19.792 7.071h2.553v2.553H24.9V7.071h2.552v2.553H30v2.552h-2.55v2.551H30v2.553h-2.551v2.552H24.9v-2.55h-2.55v2.552h-2.557v-2.55H17.24v-2.559h2.553v-2.546H17.24V9.622h2.554Zm2.553 7.658H24.9v-2.553h-2.555Zm-7.656 9.284a10.2 10.2 0 0 1-4.653.915a7.6 7.6 0 0 1-5.89-2.336A8.84 8.84 0 0 1 2 16.367a9.44 9.44 0 0 1 2.412-6.719a8.18 8.18 0 0 1 6.259-2.577a11.1 11.1 0 0 1 4.018.638v3.745a6.8 6.8 0 0 0-3.723-1.036a4.8 4.8 0 0 0-3.7 1.529a5.88 5.88 0 0 0-1.407 4.142a5.77 5.77 0 0 0 1.328 3.992a4.55 4.55 0 0 0 3.575 1.487a7.3 7.3 0 0 0 3.927-1.108Z"/>
                        </svg>
                        AppHost.cs
                      </>
                    )}
                    {activeTab === 'packages' && '📦 Packages'}
                    {activeTab === 'deploy' && '🚀 Deploy'}
                    {activeTab === 'validation' && (
                      <>
                        ✅ Validation
                        {validationIssues.length > 0 && (
                          <span style={{
                            background: errorCount > 0 ? '#DC2626' : '#F59E0B',
                            color: 'white',
                            fontSize: '10px',
                            padding: '1px 5px',
                            borderRadius: '10px',
                            fontWeight: 600,
                            marginLeft: '4px',
                          }}>
                            {validationIssues.length}
                          </span>
                        )}
                      </>
                    )}
                    {activeTab === 'files' && (
                      <>
                        📁 Files
                        {savedFiles.length > 0 && (
                          <span style={{
                            background: 'var(--sl-color-gray-4)',
                            color: 'var(--sl-color-gray-2)',
                            fontSize: '10px',
                            padding: '1px 5px',
                            borderRadius: '10px',
                            fontWeight: 600,
                            marginLeft: '4px',
                          }}>
                            {savedFiles.length}
                          </span>
                        )}
                      </>
                    )}
                  </span>
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    style={{
                      transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      background: 'var(--sl-color-gray-6)',
                      border: '1px solid var(--sl-color-gray-5)',
                      borderRadius: '6px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                      zIndex: 100,
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      onClick={() => { setActiveTab('apphost'); setIsMenuOpen(false); }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '13px',
                        background: activeTab === 'apphost' ? 'var(--sl-color-gray-5)' : 'transparent',
                        color: activeTab === 'apphost' ? 'var(--sl-color-white)' : 'var(--sl-color-gray-3)',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        if (activeTab !== 'apphost') e.currentTarget.style.background = 'var(--sl-color-gray-5)';
                      }}
                      onMouseLeave={(e) => {
                        if (activeTab !== 'apphost') e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 32 32" fill="#368832">
                        <path d="M19.792 7.071h2.553v2.553H24.9V7.071h2.552v2.553H30v2.552h-2.55v2.551H30v2.553h-2.551v2.552H24.9v-2.55h-2.55v2.552h-2.557v-2.55H17.24v-2.559h2.553v-2.546H17.24V9.622h2.554Zm2.553 7.658H24.9v-2.553h-2.555Zm-7.656 9.284a10.2 10.2 0 0 1-4.653.915a7.6 7.6 0 0 1-5.89-2.336A8.84 8.84 0 0 1 2 16.367a9.44 9.44 0 0 1 2.412-6.719a8.18 8.18 0 0 1 6.259-2.577a11.1 11.1 0 0 1 4.018.638v3.745a6.8 6.8 0 0 0-3.723-1.036a4.8 4.8 0 0 0-3.7 1.529a5.88 5.88 0 0 0-1.407 4.142a5.77 5.77 0 0 0 1.328 3.992a4.55 4.55 0 0 0 3.575 1.487a7.3 7.3 0 0 0 3.927-1.108Z"/>
                      </svg>
                      AppHost.cs
                    </button>
                    <button
                      onClick={() => { setActiveTab('packages'); setIsMenuOpen(false); }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '13px',
                        background: activeTab === 'packages' ? 'var(--sl-color-gray-5)' : 'transparent',
                        color: activeTab === 'packages' ? 'var(--sl-color-white)' : 'var(--sl-color-gray-3)',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        if (activeTab !== 'packages') e.currentTarget.style.background = 'var(--sl-color-gray-5)';
                      }}
                      onMouseLeave={(e) => {
                        if (activeTab !== 'packages') e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      📦 Packages
                    </button>
                    <button
                      onClick={() => { setActiveTab('deploy'); setIsMenuOpen(false); }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '13px',
                        background: activeTab === 'deploy' ? 'var(--sl-color-gray-5)' : 'transparent',
                        color: activeTab === 'deploy' ? 'var(--sl-color-white)' : 'var(--sl-color-gray-3)',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        if (activeTab !== 'deploy') e.currentTarget.style.background = 'var(--sl-color-gray-5)';
                      }}
                      onMouseLeave={(e) => {
                        if (activeTab !== 'deploy') e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      🚀 Deploy
                    </button>
                    <button
                      onClick={() => { setActiveTab('validation'); setIsMenuOpen(false); }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '13px',
                        background: activeTab === 'validation' ? 'var(--sl-color-gray-5)' : 'transparent',
                        color: activeTab === 'validation' ? 'var(--sl-color-white)' : 'var(--sl-color-gray-3)',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        if (activeTab !== 'validation') e.currentTarget.style.background = 'var(--sl-color-gray-5)';
                      }}
                      onMouseLeave={(e) => {
                        if (activeTab !== 'validation') e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      ✅ Validation
                      {validationIssues.length > 0 && (
                        <span style={{
                          background: errorCount > 0 ? '#DC2626' : '#F59E0B',
                          color: 'white',
                          fontSize: '10px',
                          padding: '1px 5px',
                          borderRadius: '10px',
                          fontWeight: 600,
                        }}>
                          {validationIssues.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => { setActiveTab('files'); setIsMenuOpen(false); }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        fontSize: '13px',
                        background: activeTab === 'files' ? 'var(--sl-color-gray-5)' : 'transparent',
                        color: activeTab === 'files' ? 'var(--sl-color-white)' : 'var(--sl-color-gray-3)',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        if (activeTab !== 'files') e.currentTarget.style.background = 'var(--sl-color-gray-5)';
                      }}
                      onMouseLeave={(e) => {
                        if (activeTab !== 'files') e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      📁 Files
                      {savedFiles.length > 0 && (
                        <span style={{
                          background: 'var(--sl-color-gray-4)',
                          color: 'var(--sl-color-gray-2)',
                          fontSize: '10px',
                          padding: '1px 5px',
                          borderRadius: '10px',
                          fontWeight: 600,
                        }}>
                          {savedFiles.length}
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Wide Mode: All Tabs Visible */
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setActiveTab('apphost')}
                  style={{
                    padding: '6px 10px',
                    fontSize: '13px',
                    background: activeTab === 'apphost' ? 'var(--sl-color-gray-5)' : 'transparent',
                    color: activeTab === 'apphost' ? 'var(--sl-color-white)' : 'var(--sl-color-gray-3)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 32 32" fill="#368832">
                    <path d="M19.792 7.071h2.553v2.553H24.9V7.071h2.552v2.553H30v2.552h-2.55v2.551H30v2.553h-2.551v2.552H24.9v-2.55h-2.55v2.552h-2.557v-2.55H17.24v-2.559h2.553v-2.546H17.24V9.622h2.554Zm2.553 7.658H24.9v-2.553h-2.555Zm-7.656 9.284a10.2 10.2 0 0 1-4.653.915a7.6 7.6 0 0 1-5.89-2.336A8.84 8.84 0 0 1 2 16.367a9.44 9.44 0 0 1 2.412-6.719a8.18 8.18 0 0 1 6.259-2.577a11.1 11.1 0 0 1 4.018.638v3.745a6.8 6.8 0 0 0-3.723-1.036a4.8 4.8 0 0 0-3.7 1.529a5.88 5.88 0 0 0-1.407 4.142a5.77 5.77 0 0 0 1.328 3.992a4.55 4.55 0 0 0 3.575 1.487a7.3 7.3 0 0 0 3.927-1.108Z"/>
                  </svg>
                  AppHost.cs
                </button>
                <button
                  onClick={() => setActiveTab('packages')}
                  style={{
                    padding: '6px 10px',
                    fontSize: '13px',
                    background: activeTab === 'packages' ? 'var(--sl-color-gray-5)' : 'transparent',
                    color: activeTab === 'packages' ? 'var(--sl-color-white)' : 'var(--sl-color-gray-3)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  📦 Packages
                </button>
                <button
                  onClick={() => setActiveTab('deploy')}
                  style={{
                    padding: '6px 10px',
                    fontSize: '13px',
                    background: activeTab === 'deploy' ? 'var(--sl-color-gray-5)' : 'transparent',
                    color: activeTab === 'deploy' ? 'var(--sl-color-white)' : 'var(--sl-color-gray-3)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  🚀 Deploy
                </button>
                <button
                  onClick={() => setActiveTab('validation')}
                  style={{
                    padding: '6px 10px',
                    fontSize: '13px',
                    background: activeTab === 'validation' ? 'var(--sl-color-gray-5)' : 'transparent',
                    color: activeTab === 'validation' ? 'var(--sl-color-white)' : 'var(--sl-color-gray-3)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  ✅ Validation
                  {validationIssues.length > 0 && (
                    <span style={{
                      background: errorCount > 0 ? '#DC2626' : '#F59E0B',
                      color: 'white',
                      fontSize: '10px',
                      padding: '1px 5px',
                      borderRadius: '10px',
                      fontWeight: 600,
                    }}>
                      {validationIssues.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('files')}
                  style={{
                    padding: '6px 10px',
                    fontSize: '13px',
                    background: activeTab === 'files' ? 'var(--sl-color-gray-5)' : 'transparent',
                    color: activeTab === 'files' ? 'var(--sl-color-white)' : 'var(--sl-color-gray-3)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  📁 Files
                  {savedFiles.length > 0 && (
                    <span style={{
                      background: 'var(--sl-color-gray-4)',
                      color: 'var(--sl-color-gray-2)',
                      fontSize: '10px',
                      padding: '1px 5px',
                      borderRadius: '10px',
                      fontWeight: 600,
                    }}>
                      {savedFiles.length}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div
            key={activeTab}
            style={{
              flex: 1,
              overflow: 'auto',
              background: 'var(--sl-color-gray-7)',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
          >
            {renderContent()}
          </div>

          {/* Sticky Footer */}
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--sl-color-gray-5)',
              background: 'var(--sl-color-gray-7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <a
              href="https://aspire.dev/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: '36px',
                height: '36px',
                background: 'transparent',
                border: '1px solid var(--sl-color-gray-5)',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--sl-color-gray-5)';
                e.currentTarget.style.borderColor = 'var(--sl-color-accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'var(--sl-color-gray-5)';
              }}
              title="Visit aspire.dev"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sl-color-gray-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </a>
            <span style={{ fontSize: '11px', color: 'var(--sl-color-accent-high)' }}>
              play.aspire.dev
            </span>
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete File"
        message={`Are you sure you want to delete "${deleteConfirm.fileName}"? This file is stored in your browser's local storage and cannot be recovered once deleted.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="#DC2626"
        requireTypedConfirmation="delete"
        onConfirm={confirmDeleteFile}
        onCancel={() => setDeleteConfirm({ isOpen: false, fileName: null })}
      />

      {/* Overwrite Confirmation Dialog */}
      <ConfirmDialog
        isOpen={overwriteConfirm.isOpen}
        title="Overwrite File?"
        message={`You are about to save the current canvas to "${overwriteConfirm.targetFile}.apphost", but you have "${currentFile}.apphost" loaded.\n\nThis will overwrite "${overwriteConfirm.targetFile}.apphost" with your current visual design and generated AppHost code. The previous contents of "${overwriteConfirm.targetFile}.apphost" will be lost.`}
        confirmText="Overwrite"
        cancelText="Cancel"
        confirmColor="#F59E0B"
        onConfirm={confirmOverwriteFile}
        onCancel={() => setOverwriteConfirm({ isOpen: false, targetFile: null })}
      />
    </div>
  );
}
