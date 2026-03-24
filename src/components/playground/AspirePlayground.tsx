import { useCallback, useState, useRef, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  applyNodeChanges,
  type Node,
  type Edge,
  type Connection,
  type OnConnect,
  type NodeChange,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import AspireNode, { type AspireNodeData } from './AspireNode';
import ResourcePalette from './ResourcePalette';
import CodePreview from './CodePreview';
import ConfigPanel from './ConfigPanel';
import TemplateGallery from './TemplateGallery';
import ConfirmDialog from './ConfirmDialog';
import ImportModal, { type ImportType } from './ImportModal';
import { generateAppHostCode, type AppHostLanguage } from '../../utils/codeGenerator';
import { parseAppHost, parseDockerCompose, parseDockerfile } from '../../utils/importParsers';
import { getAppHostFromUrl, createSvgUrl, encodePlaygroundState, getStateFromUrl } from '../../utils/urlEncoding';
import { aspireResources, type AspireResource } from '../../data/aspire-resources';
import type { Template } from '../../data/templates';

// Derive category sets from resource data for connection validation
const categorySetByType = new Map<string, string>();
aspireResources.forEach(r => categorySetByType.set(r.id, r.category));
import {
  getCurrentFileName,
  setCurrentFileName,
  saveAppHostFile,
  loadAppHostFile,
} from '../../utils/appHostStorage';

const nodeTypes = {
  aspire: AspireNode,
};

let nodeId = 0;
const getNodeId = () => `node_${nodeId++}`;

// Node height constant for snap alignment calculations
const NODE_HEIGHT = 80;

export default function AspirePlayground() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, _onNodesChange] = useNodesState<Node<AspireNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  
  // Load user preferences from localStorage
  const [codePreviewWidth, setCodePreviewWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aspire-playground-code-width');
      if (saved) return parseInt(saved, 10);
      // Default based on screen size - wider to avoid horizontal scroll
      if (window.innerWidth <= 768) return window.innerWidth;
      if (window.innerWidth <= 1200) return 580;
      return 650; // Wide enough to avoid horizontal scrollbar for typical code
    }
    return 650;
  });
  
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      // Auto-collapse on mobile screens
      if (window.innerWidth <= 768) return true;
      const saved = localStorage.getItem('aspire-playground-palette-collapsed');
      return saved === 'true';
    }
    return false;
  });
  
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aspire-playground-toolbar-collapsed');
      return saved === 'true';
    }
    return false;
  });
  
  const [selectedNode, setSelectedNode] = useState<Node<AspireNodeData> | null>(null);
  const [history, setHistory] = useState<{ nodes: Node<AspireNodeData>[]; edges: Edge[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [copiedNodes, setCopiedNodes] = useState<Node<AspireNodeData>[]>([]);
  const [codePreviewTab, setCodePreviewTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aspire-playground-code-tab');
      if (saved) return saved;
    }
    return 'apphost';
  });
  const [codePreviewCollapsed, setCodePreviewCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aspire-playground-code-collapsed');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [clearCanvasConfirm, setClearCanvasConfirm] = useState(false);
  const [showKeyboardLegend, setShowKeyboardLegend] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aspire-playground-keyboard-legend');
      return saved === 'true';
    }
    return false;
  });
  const [currentFile, setCurrentFile] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return getCurrentFileName();
    }
    return null;
  });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aspire-playground-theme');
      return (saved === 'light' ? 'light' : 'dark');
    }
    return 'dark';
  });

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const [appHostLanguage, setAppHostLanguage] = useState<AppHostLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aspire-playground-language');
      return (saved === 'typescript' ? 'typescript' : 'csharp');
    }
    return 'csharp';
  });

  // Persist language preference
  useEffect(() => {
    localStorage.setItem('aspire-playground-language', appHostLanguage);
  }, [appHostLanguage]);

  // Apply theme to document and persist
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aspire-playground-theme', theme);
  }, [theme]);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('aspire-playground-code-width', codePreviewWidth.toString());
  }, [codePreviewWidth]);
  
  useEffect(() => {
    localStorage.setItem('aspire-playground-palette-collapsed', isPaletteCollapsed.toString());
  }, [isPaletteCollapsed]);
  
  useEffect(() => {
    localStorage.setItem('aspire-playground-toolbar-collapsed', isToolbarCollapsed.toString());
  }, [isToolbarCollapsed]);

  // Save code preview state to localStorage
  useEffect(() => {
    localStorage.setItem('aspire-playground-code-collapsed', codePreviewCollapsed.toString());
  }, [codePreviewCollapsed]);

  useEffect(() => {
    localStorage.setItem('aspire-playground-code-tab', codePreviewTab);
  }, [codePreviewTab]);

  // Save keyboard legend preference to localStorage
  useEffect(() => {
    localStorage.setItem('aspire-playground-keyboard-legend', showKeyboardLegend.toString());
  }, [showKeyboardLegend]);

  // Update current file name and persist to localStorage
  const handleSetCurrentFile = useCallback((name: string | null) => {
    setCurrentFile(name);
    setCurrentFileName(name);
  }, []);

  // Handle responsive width on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setCodePreviewWidth(window.innerWidth); // Mobile: full width
        setIsPaletteCollapsed(true); // Auto-collapse palette on mobile
      } else if (window.innerWidth <= 1200) {
        setCodePreviewWidth(Math.min(550, window.innerWidth * 0.45)); // Mid-sized: wider, up to 45%
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load from URL if there's a shared apphost parameter, or reload current file
  const [hasLoadedFromUrl, setHasLoadedFromUrl] = useState(false);
  
  useEffect(() => {
    if (hasLoadedFromUrl) return;
    
    // First priority: load full state from URL (?state= param)
    const sharedState = getStateFromUrl();
    if (sharedState) {
      setNodes(sharedState.nodes);
      setEdges(sharedState.edges);
      if (sharedState.language) {
        setAppHostLanguage(sharedState.language);
      }
      if (sharedState.paletteCollapsed !== undefined) {
        setIsPaletteCollapsed(sharedState.paletteCollapsed);
      }
      if (sharedState.codePreviewWidth !== undefined) {
        setCodePreviewWidth(sharedState.codePreviewWidth);
      }
      if (sharedState.toolbarCollapsed !== undefined) {
        setIsToolbarCollapsed(sharedState.toolbarCollapsed);
      }
      if (sharedState.activeTab) {
        setCodePreviewTab(sharedState.activeTab);
      }
      if (sharedState.codePreviewCollapsed !== undefined) {
        setCodePreviewCollapsed(sharedState.codePreviewCollapsed);
      }
      setHasLoadedFromUrl(true);
      return;
    }

    // Second priority: load from legacy ?apphost= param (code text)
    const sharedAppHost = getAppHostFromUrl();
    if (sharedAppHost) {
      try {
        const result = parseAppHost(sharedAppHost);
        if (result.nodes.length > 0) {
          setNodes(result.nodes);
          setEdges(result.edges);
          if (result.warnings.length > 0) {
            setImportWarnings(result.warnings);
            setTimeout(() => setImportWarnings([]), 5000);
          }
        }
      } catch (error) {
        console.error('Failed to load shared AppHost:', error);
      }
      setHasLoadedFromUrl(true);
      return;
    }
    
    // Third priority: reload current file if it exists
    if (currentFile) {
      const savedFile = loadAppHostFile(currentFile);
      if (savedFile?.canvas) {
        setNodes(savedFile.canvas.nodes as Node<AspireNodeData>[]);
        setEdges(savedFile.canvas.edges);
      }
    }
    
    setHasLoadedFromUrl(true);
  }, [hasLoadedFromUrl, currentFile, setNodes, setEdges, setAppHostLanguage]);

  // Track shift key state for snap-to-connected-nodes feature
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Custom onNodesChange handler with shift-snap to connected nodes
  const onNodesChange = useCallback((changes: NodeChange<Node<AspireNodeData>>[]) => {
    // If shift is pressed and we're dragging, snap to connected nodes' top/bottom
    if (isShiftPressed) {
      const positionChanges = changes.filter(c => c.type === 'position' && c.dragging);
      
      if (positionChanges.length > 0) {
        const modifiedChanges = changes.map(change => {
          if (change.type === 'position' && change.dragging && change.position) {
            const draggingNodeId = change.id;
            const currentPosition = change.position;
            
            // Find connected nodes through edges
            const connectedNodeIds = edges
              .filter(e => e.source === draggingNodeId || e.target === draggingNodeId)
              .map(e => e.source === draggingNodeId ? e.target : e.source);
            
            const connectedNodes = nodes.filter(n => connectedNodeIds.includes(n.id));
            
            if (connectedNodes.length > 0) {
              // Get all potential snap positions (top and bottom alignment)
              const snapPositions: number[] = [];
              connectedNodes.forEach(node => {
                // Snap to top alignment (same Y)
                snapPositions.push(node.position.y);
                // Snap to bottom alignment (same Y + height, accounting for node height)
                snapPositions.push(node.position.y + NODE_HEIGHT);
                // Snap to be below the connected node
                snapPositions.push(node.position.y - NODE_HEIGHT);
              });
              
              // Find closest snap position within threshold (30px)
              const SNAP_THRESHOLD = 30;
              let closestSnapY = currentPosition.y;
              let minDistance = SNAP_THRESHOLD;
              
              snapPositions.forEach(snapY => {
                const distance = Math.abs(currentPosition.y - snapY);
                if (distance < minDistance) {
                  minDistance = distance;
                  closestSnapY = snapY;
                }
              });
              
              return {
                ...change,
                position: {
                  x: currentPosition.x,
                  y: closestSnapY,
                },
              };
            }
          }
          return change;
        });
        
        setNodes(nds => applyNodeChanges(modifiedChanges, nds));
        return;
      }
    }
    
    // Default behavior
    _onNodesChange(changes);
  }, [isShiftPressed, edges, nodes, setNodes, _onNodesChange]);

  // Generate code whenever nodes or edges change
  const generatedCode = useMemo(() => {
    return generateAppHostCode(nodes, edges, appHostLanguage);
  }, [nodes, edges, appHostLanguage]);

  // Share functionality — encodes full canvas state (nodes, edges, positions, language, UI layout)
  const handleShare = useCallback(() => {
    const encoded = encodePlaygroundState(nodes, edges, appHostLanguage, {
      paletteCollapsed: isPaletteCollapsed,
      codePreviewWidth,
      toolbarCollapsed: isToolbarCollapsed,
      activeTab: codePreviewTab,
      codePreviewCollapsed,
    });
    const shareUrl = `${window.location.origin}${window.location.pathname}?state=${encoded}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      setSaveMessage('Share link copied!');
      setTimeout(() => setSaveMessage(null), 2000);
    }).catch(() => {
      // Fallback: show the URL in a prompt
      prompt('Share this URL:', shareUrl);
    });
  }, [nodes, edges, appHostLanguage, isPaletteCollapsed, codePreviewWidth, isToolbarCollapsed, codePreviewTab, codePreviewCollapsed]);

  // Get SVG URL for embedding
  const handleGetSvgUrl = useCallback(() => {
    const svgUrl = createSvgUrl(generatedCode.appHost);
    
    navigator.clipboard.writeText(svgUrl).then(() => {
      setSaveMessage('SVG URL copied!');
      setTimeout(() => setSaveMessage(null), 2000);
    }).catch(() => {
      prompt('SVG URL:', svgUrl);
    });
  }, [generatedCode.appHost]);

  // Handle save to current file
  const handleSaveToFile = useCallback(() => {
    if (currentFile) {
      saveAppHostFile(currentFile, generatedCode.appHost, { nodes, edges });
      setSaveMessage(`Saved to "${currentFile}"`);
      setTimeout(() => setSaveMessage(null), 2000);
    }
  }, [currentFile, generatedCode.appHost, nodes, edges]);

  // Save to history
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      setHistory(prev => [...prev.slice(0, historyIndex + 1), { nodes, edges }]);
      setHistoryIndex(prev => prev + 1);
    }
  }, [nodes, edges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip shortcuts when user is typing in an input or textarea
      const target = e.target as HTMLElement;
      const isEditing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable;

      // Delete
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditing) {
        const selectedNodes = nodes.filter(n => n.selected);
        const selectedEdges = edges.filter(e => e.selected);
        
        if (selectedNodes.length > 0) {
          setNodes(nodes.filter(n => !n.selected));
          setEdges(edges.filter(e => !selectedNodes.some(n => n.id === e.source || n.id === e.target)));
        } else if (selectedEdges.length > 0) {
          setEdges(edges.filter(e => !e.selected));
        }
      }

      // Undo (Ctrl+Z) — let browser handle it when editing text
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey && !isEditing && historyIndex > 0) {
        e.preventDefault();
        const prevState = history[historyIndex - 1];
        setNodes(prevState.nodes);
        setEdges(prevState.edges);
        setHistoryIndex(historyIndex - 1);
      }

      // Redo (Ctrl+Y or Ctrl+Shift+Z)
      if (!isEditing && ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z'))) {
        if (historyIndex < history.length - 1) {
          e.preventDefault();
          const nextState = history[historyIndex + 1];
          setNodes(nextState.nodes);
          setEdges(nextState.edges);
          setHistoryIndex(historyIndex + 1);
        }
      }

      // Copy (Ctrl+C) — only intercept when not editing text
      if (e.ctrlKey && e.key === 'c' && !isEditing) {
        const selectedNodes = nodes.filter(n => n.selected);
        if (selectedNodes.length > 0) {
          setCopiedNodes(selectedNodes);
        }
      }

      // Paste (Ctrl+V) — only intercept when not editing text
      if (e.ctrlKey && e.key === 'v' && !isEditing && copiedNodes.length > 0) {
        const newNodes = copiedNodes.map(node => ({
          ...node,
          id: getNodeId(),
          position: {
            x: node.position.x + 50,
            y: node.position.y + 50,
          },
          selected: false,
        }));
        setNodes([...nodes.map(n => ({ ...n, selected: false })), ...newNodes]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, edges, history, historyIndex, copiedNodes, setNodes, setEdges]);

  // Listen for config panel open events
  useEffect(() => {
    const handleOpenConfig = (e: CustomEvent) => {
      const node = nodes.find(n => n.id === e.detail.nodeId);
      if (node) {
        setSelectedNode(node);
      }
    };

    window.addEventListener('openNodeConfig', handleOpenConfig as EventListener);
    return () => window.removeEventListener('openNodeConfig', handleOpenConfig as EventListener);
  }, [nodes]);

  // Connection validation
  const isValidConnection = useCallback((connection: Connection) => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    
    if (!sourceNode || !targetNode) return false;

    // Prevent self-connections
    if (connection.source === connection.target) return false;

    const sourceCategory = categorySetByType.get(sourceNode.data.resourceType);
    const targetCategory = categorySetByType.get(targetNode.data.resourceType);

    // Prevent connecting resources of the same infrastructure category
    if (sourceCategory && targetCategory && sourceCategory === targetCategory) {
      if (['database', 'cache', 'messaging'].includes(sourceCategory)) {
        return false;
      }
    }

    return true;
  }, [nodes]);

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!isValidConnection(connection)) {
        return;
      }

      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: '#888', strokeWidth: 2 },
          },
          eds
        )
      );
    },
    [setEdges, isValidConnection]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) {
        return;
      }

      const resourceData = event.dataTransfer.getData('application/reactflow');
      if (!resourceData) {
        return;
      }

      const resource: AspireResource = JSON.parse(resourceData);
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node<AspireNodeData> = {
        id: getNodeId(),
        type: 'aspire',
        position,
        data: {
          resourceType: resource.id,
          label: resource.displayName,
          icon: resource.icon,
          color: resource.color,
          instanceName: resource.name,
          databaseName: resource.allowsDatabase ? 'database' : undefined,
          allowsDatabase: resource.allowsDatabase,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onResourceDragStart = (event: React.DragEvent, resource: AspireResource) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(resource));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleAddResource = useCallback((resource: AspireResource) => {
    if (!reactFlowInstance) return;

    // Get the center of the visible canvas area
    const { x, y, zoom } = reactFlowInstance.getViewport();
    const centerX = (-x + (window.innerWidth / 2)) / zoom;
    const centerY = (-y + (window.innerHeight / 2)) / zoom;
    
    // Add some randomness to avoid stacking nodes directly on top of each other
    const randomOffset = () => (Math.random() - 0.5) * 100;
    
    const newNode: Node<AspireNodeData> = {
      id: getNodeId(),
      type: 'aspire',
      position: {
        x: centerX + randomOffset(),
        y: centerY + randomOffset(),
      },
      data: {
        resourceType: resource.id,
        label: resource.displayName,
        icon: resource.icon,
        color: resource.color,
        instanceName: resource.name,
        databaseName: resource.allowsDatabase ? 'database' : undefined,
        allowsDatabase: resource.allowsDatabase,
      },
    };

    setNodes((nds) => nds.concat(newNode));
  }, [reactFlowInstance, setNodes]);

  const handleUpdateNode = useCallback((nodeId: string, updates: Partial<AspireNodeData>) => {
    setNodes(nodes => 
      nodes.map(node => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
  }, [setNodes]);

  const handleClearCanvas = () => {
    if (nodes.length === 0 && edges.length === 0) return;
    setClearCanvasConfirm(true);
  };

  const confirmClearCanvas = () => {
    setNodes([]);
    setEdges([]);
    setClearCanvasConfirm(false);
  };

  const handleExport = () => {
    // Save to current file if one is open
    if (currentFile) {
      saveAppHostFile(currentFile, generatedCode.appHost, { nodes, edges });
    }
    
    // Download the AppHost code
    const ext = appHostLanguage === 'typescript' ? '.ts' : '.cs';
    const defaultName = appHostLanguage === 'typescript' ? 'apphost' : 'AppHost';
    const blob = new Blob([generatedCode.appHost], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile ? `${currentFile}${ext}` : `${defaultName}${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    setShowImportModal(true);
  };

  const handleImportFile = useCallback((type: ImportType, content: string, fileName: string) => {
    let result: ReturnType<typeof parseAppHost>;
    
    try {
      switch (type) {
        case 'apphost':
        case 'apphost-ts':
          result = parseAppHost(content);
          break;
        case 'docker-compose':
          result = parseDockerCompose(content);
          break;
        case 'dockerfile':
          result = parseDockerfile(content, fileName);
          break;
        default:
          return;
      }

      if (result.nodes.length > 0) {
        // If there are existing nodes, ask for confirmation
        if (nodes.length > 0) {
          if (!confirm('This will add imported resources to your canvas. Continue?')) {
            return;
          }
        }
        
        // Add imported nodes and edges to existing ones
        const importedNodes = result.nodes;
        const importedEdges = result.edges;
        setNodes((nds) => [...nds, ...importedNodes]);
        setEdges((eds) => [...eds, ...importedEdges]);
        
        if (result.warnings.length > 0) {
          setImportWarnings(result.warnings);
          // Auto-clear warnings after 5 seconds
          setTimeout(() => setImportWarnings([]), 5000);
        }
      } else {
        alert('No resources could be imported from the file. ' + 
          (result.warnings.length > 0 ? result.warnings.join(' ') : ''));
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to parse the file. Please make sure it is a valid file.');
    }
  }, [nodes.length, setNodes, setEdges]);

  const handleApplyTemplate = (template: Template) => {
    if (nodes.length > 0 && !confirm('This will replace your current canvas. Continue?')) {
      return;
    }
    setNodes(template.nodes);
    setEdges(template.edges);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', background: 'var(--sl-color-bg)' }} role="application" aria-label="Aspire Playground">
      {/* Skip to content link for keyboard users */}
      <a href="#canvas" className="skip-to-content">Skip to canvas</a>

      {/* Left Panel: Resource Palette */}
      <ResourcePalette 
        onResourceDragStart={onResourceDragStart}
        onAddResource={handleAddResource}
        isCollapsed={isPaletteCollapsed}
        onToggleCollapse={() => setIsPaletteCollapsed(!isPaletteCollapsed)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Center: React Flow Canvas */}
      <div id="canvas" role="main" aria-label="Design canvas" style={{ flex: 1, position: 'relative' }} ref={reactFlowWrapper}>
        {/* Top Toolbar */}
        <div
          role="toolbar"
          aria-label="Canvas actions"
          style={{
            position: 'absolute',
            top: '6px',
            left: '6px',
            zIndex: 4,
            display: 'flex',
            gap: '8px',
            background: 'var(--sl-color-gray-7)',
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid var(--sl-color-gray-5)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.3s ease-in-out',
            overflow: 'hidden',
          }}
        >
          {/* Collapse/Expand Toggle Button */}
          <button
            onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
            style={{
              width: '36px',
              height: '36px',
              background: 'var(--sl-color-gray-5)',
              border: '1px solid var(--sl-color-gray-5)',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--sl-color-gray-4)';
              e.currentTarget.style.borderColor = 'var(--sl-color-accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--sl-color-gray-5)';
              e.currentTarget.style.borderColor = 'var(--sl-color-gray-5)';
            }}
            title={isToolbarCollapsed ? 'Expand toolbar' : 'Collapse toolbar'}
            aria-label={isToolbarCollapsed ? 'Expand toolbar' : 'Collapse toolbar'}
            aria-expanded={!isToolbarCollapsed}
          >
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="var(--sl-color-white)" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{
                transition: 'all 0.3s ease',
              }}
            >
              {isToolbarCollapsed ? (
                <>
                  <circle cx="6" cy="12" r="1" fill="var(--sl-color-white)" />
                  <circle cx="12" cy="12" r="1" fill="var(--sl-color-white)" />
                  <circle cx="18" cy="12" r="1" fill="var(--sl-color-white)" />
                </>
              ) : (
                <polyline points="15 18 9 12 15 6" />
              )}
            </svg>
          </button>
          
          {/* Toolbar buttons - animated collapse/expand */}
          {!isToolbarCollapsed && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              transition: 'opacity 0.3s ease-in-out',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            <>
              <button
                onClick={() => setShowTemplateGallery(true)}
                style={{
                  padding: '0 16px',
                  height: '36px',
                  fontSize: '13px',
                  background: 'var(--sl-color-gray-5)',
                  color: 'var(--sl-color-white)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--sl-color-gray-4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--sl-color-gray-5)';
                }}
                title="Templates"
                aria-label="Open template gallery"
              >
                <span aria-hidden="true">📋</span>
                <span style={{ marginLeft: '6px' }} className="toolbar-text">Templates</span>
              </button>
              <button
                onClick={handleClearCanvas}
                style={{
                  padding: '0 16px',
                  height: '36px',
                  fontSize: '13px',
                  background: 'var(--sl-color-gray-5)',
                  color: 'var(--sl-color-white)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--sl-color-gray-4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--sl-color-gray-5)';
                }}
                title="Clear canvas"
                aria-label="Clear canvas"
              >
                <span aria-hidden="true">🗑️</span>
                <span style={{ marginLeft: '6px' }} className="toolbar-text">Clear</span>
              </button>
              <button
                onClick={handleExport}
                style={{
                  padding: '0 16px',
                  height: '36px',
                  fontSize: '13px',
                  background: 'var(--sl-color-gray-5)',
                  color: 'var(--sl-color-white)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--sl-color-gray-4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--sl-color-gray-5)';
                }}
                title="Export code"
                aria-label="Export code"
              >
                <span aria-hidden="true">⬆️</span>
                <span style={{ marginLeft: '6px' }} className="toolbar-text">Export</span>
              </button>
              <button
                onClick={handleImport}
                style={{
                  padding: '0 16px',
                  height: '36px',
                  fontSize: '13px',
                  background: 'var(--sl-color-gray-5)',
                  color: 'var(--sl-color-white)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--sl-color-gray-4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--sl-color-gray-5)';
                }}
                title="Import code"
                aria-label="Import code"
              >
                <span aria-hidden="true">⬇️</span>
                <span style={{ marginLeft: '6px' }} className="toolbar-text">Import</span>
              </button>
              {currentFile && (
                <button
                  onClick={handleSaveToFile}
                  style={{
                    padding: '0 16px',
                    height: '36px',
                    fontSize: '13px',
                    background: saveMessage ? 'var(--sl-color-green-high)' : 'var(--sl-color-gray-5)',
                    color: saveMessage ? '#fff' : 'var(--sl-color-white)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => {
                    if (!saveMessage) {
                      e.currentTarget.style.background = 'var(--sl-color-gray-4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saveMessage) {
                      e.currentTarget.style.background = 'var(--sl-color-gray-5)';
                    }
                  }}
                  title={saveMessage ? 'Saved' : `Save changes to "${currentFile}"`}
                  aria-label={saveMessage ? 'Changes saved' : `Save changes to ${currentFile}`}
                >
                  <span aria-hidden="true">{saveMessage ? '✓' : '💾'}</span>
                  <span style={{ marginLeft: '6px' }} className="toolbar-text">{saveMessage ? 'Saved' : 'Save'}</span>
                </button>
              )}
              <button
                onClick={() => setShowKeyboardLegend(!showKeyboardLegend)}
                style={{
                  padding: '0 16px',
                  height: '36px',
                  fontSize: '13px',
                  background: showKeyboardLegend ? 'var(--sl-color-accent)' : 'var(--sl-color-gray-5)',
                  color: showKeyboardLegend ? '#fff' : 'var(--sl-color-white)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => {
                  if (!showKeyboardLegend) {
                    e.currentTarget.style.background = 'var(--sl-color-gray-4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showKeyboardLegend) {
                    e.currentTarget.style.background = 'var(--sl-color-gray-5)';
                  }
                }}
                title="Toggle keyboard shortcuts"
                aria-label="Toggle keyboard shortcuts"
                aria-pressed={showKeyboardLegend}
              >
                <span aria-hidden="true">⌨️</span>
                <span style={{ marginLeft: '6px' }} className="toolbar-text">Shortcuts</span>
              </button>
              {currentFile && (
                <>
                  <button
                    onClick={handleShare}
                    disabled={nodes.length === 0}
                    style={{
                      padding: '0 16px',
                      height: '36px',
                      fontSize: '13px',
                      background: 'var(--sl-color-gray-5)',
                      color: 'var(--sl-color-white)',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: nodes.length === 0 ? 'not-allowed' : 'pointer',
                      fontWeight: 500,
                      transition: 'all 0.2s',
                      opacity: nodes.length === 0 ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    onMouseEnter={(e) => {
                      if (nodes.length > 0) {
                        e.currentTarget.style.background = 'var(--sl-color-gray-4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--sl-color-gray-5)';
                    }}
                    title="Copy shareable URL to clipboard"
                    aria-label="Copy shareable URL to clipboard"
                  >
                    <span aria-hidden="true">🔗</span>
                    <span style={{ marginLeft: '6px' }} className="toolbar-text">Share</span>
                  </button>
                  <button
                    onClick={handleGetSvgUrl}
                    disabled={nodes.length === 0}
                    style={{
                      padding: '0 16px',
                      height: '36px',
                      fontSize: '13px',
                      background: 'var(--sl-color-gray-5)',
                      color: 'var(--sl-color-white)',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: nodes.length === 0 ? 'not-allowed' : 'pointer',
                      fontWeight: 500,
                      transition: 'all 0.2s',
                      opacity: nodes.length === 0 ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    onMouseEnter={(e) => {
                      if (nodes.length > 0) {
                        e.currentTarget.style.background = 'var(--sl-color-gray-4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--sl-color-gray-5)';
                    }}
                    title="Copy SVG embed URL to clipboard"
                    aria-label="Copy SVG embed URL to clipboard"
                  >
                    <span aria-hidden="true">🖼️</span>
                    <span style={{ marginLeft: '6px' }} className="toolbar-text">SVG</span>
                  </button>
                </>
              )}
            </>
          </div>
          )}
        </div>

        {/* Current File Badge */}
        {currentFile && (
          <div
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              zIndex: 4,
              background: 'var(--sl-color-gray-7)',
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid var(--sl-color-gray-5)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '14px' }}>📄</span>
            <span
              style={{
                color: 'var(--sl-color-white)',
                fontSize: '13px',
                fontWeight: 500,
                fontFamily: 'var(--sl-font-mono)',
              }}
            >
              ./{currentFile}{appHostLanguage === 'typescript' ? '.ts' : '.cs'}
            </span>
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          style={{ background: 'var(--sl-color-bg)' }}
          defaultEdgeOptions={{
            animated: true,
            style: { stroke: '#888', strokeWidth: 2 },
          }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={2} color="#444" />
          <Controls style={{
            left: '6px',
            bottom: '6px',
            margin: '0',
          }} />
          <MiniMap
            nodeColor={(node) => {
              return (node.data as any)?.color || '#888';
            }}
            style={{
              right: '6px',
              margin: '0',
            }}
          />
        </ReactFlow>

        {/* Keyboard Shortcuts Legend */}
        {showKeyboardLegend && (
          <div
            style={{
              position: 'absolute',
              bottom: '6px',
              left: '38px',
              zIndex: 100,
              background: 'rgba(30, 30, 35, 0.95)',
              backdropFilter: 'blur(8px)',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid var(--sl-color-gray-5)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
              maxWidth: '280px',
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--sl-color-gray-5)'
            }}>
              <span style={{ 
                color: 'var(--sl-color-white)', 
                fontWeight: 600, 
                fontSize: '14px' 
              }}>
                ⌨️ Keyboard Shortcuts
              </span>
              <button
                onClick={() => setShowKeyboardLegend(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--sl-color-gray-3)',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--sl-color-gray-5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ color: 'var(--sl-color-accent-high)', fontSize: '11px', fontWeight: 600, marginTop: '4px' }}>
                CONNECTIONS
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <kbd style={{
                  background: 'var(--sl-color-gray-5)',
                  color: 'var(--sl-color-white)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  border: '1px solid var(--sl-color-gray-4)',
                  minWidth: '70px',
                  textAlign: 'center',
                }}>Shift + Click</kbd>
                <span style={{ color: 'var(--sl-color-gray-2)', fontSize: '12px' }}>Select connection</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <kbd style={{
                  background: 'var(--sl-color-gray-5)',
                  color: 'var(--sl-color-white)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  border: '1px solid var(--sl-color-gray-4)',
                  minWidth: '70px',
                  textAlign: 'center',
                }}>Delete</kbd>
                <span style={{ color: 'var(--sl-color-gray-2)', fontSize: '12px' }}>Remove selected</span>
              </div>
              
              <div style={{ color: 'var(--sl-color-accent-high)', fontSize: '11px', fontWeight: 600, marginTop: '8px' }}>
                ALIGNMENT
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <kbd style={{
                  background: 'var(--sl-color-gray-5)',
                  color: 'var(--sl-color-white)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  border: '1px solid var(--sl-color-gray-4)',
                  minWidth: '70px',
                  textAlign: 'center',
                }}>Shift + Drag</kbd>
                <span style={{ color: 'var(--sl-color-gray-2)', fontSize: '12px' }}>Snap to connected</span>
              </div>
              
              <div style={{ color: 'var(--sl-color-accent-high)', fontSize: '11px', fontWeight: 600, marginTop: '8px' }}>
                NODES
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <kbd style={{
                  background: 'var(--sl-color-gray-5)',
                  color: 'var(--sl-color-white)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  border: '1px solid var(--sl-color-gray-4)',
                  minWidth: '70px',
                  textAlign: 'center',
                }}>Ctrl + C</kbd>
                <span style={{ color: 'var(--sl-color-gray-2)', fontSize: '12px' }}>Copy selected</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <kbd style={{
                  background: 'var(--sl-color-gray-5)',
                  color: 'var(--sl-color-white)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  border: '1px solid var(--sl-color-gray-4)',
                  minWidth: '70px',
                  textAlign: 'center',
                }}>Ctrl + V</kbd>
                <span style={{ color: 'var(--sl-color-gray-2)', fontSize: '12px' }}>Paste nodes</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <kbd style={{
                  background: 'var(--sl-color-gray-5)',
                  color: 'var(--sl-color-white)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  border: '1px solid var(--sl-color-gray-4)',
                  minWidth: '70px',
                  textAlign: 'center',
                }}>Delete</kbd>
                <span style={{ color: 'var(--sl-color-gray-2)', fontSize: '12px' }}>Remove selected</span>
              </div>
              
              <div style={{ color: 'var(--sl-color-accent-high)', fontSize: '11px', fontWeight: 600, marginTop: '8px' }}>
                HISTORY
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <kbd style={{
                  background: 'var(--sl-color-gray-5)',
                  color: 'var(--sl-color-white)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  border: '1px solid var(--sl-color-gray-4)',
                  minWidth: '70px',
                  textAlign: 'center',
                }}>Ctrl + Z</kbd>
                <span style={{ color: 'var(--sl-color-gray-2)', fontSize: '12px' }}>Undo</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <kbd style={{
                  background: 'var(--sl-color-gray-5)',
                  color: 'var(--sl-color-white)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  border: '1px solid var(--sl-color-gray-4)',
                  minWidth: '70px',
                  textAlign: 'center',
                }}>Ctrl + Y</kbd>
                <span style={{ color: 'var(--sl-color-gray-2)', fontSize: '12px' }}>Redo</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel: Code Preview */}
      <CodePreview
        generatedCode={generatedCode}
        width={codePreviewWidth}
        onResize={setCodePreviewWidth}
        nodes={nodes}
        edges={edges}
        onNodeClick={(nodeId) => {
          const node = nodes.find(n => n.id === nodeId);
          if (node) {
            setSelectedNode(node);
          }
        }}
        onLoadCanvas={(loadedNodes, loadedEdges) => {
          setNodes(loadedNodes);
          setEdges(loadedEdges);
        }}
        currentFile={currentFile}
        onSetCurrentFile={handleSetCurrentFile}
        theme={theme}
        appHostLanguage={appHostLanguage}
        onLanguageChange={setAppHostLanguage}
        initialTab={codePreviewTab}
        onTabChange={setCodePreviewTab}
        initialCollapsed={codePreviewCollapsed}
        onCollapsedChange={setCodePreviewCollapsed}
      />

      {/* Configuration Panel */}
      {selectedNode && (
        <ConfigPanel
          selectedNode={selectedNode}
          onUpdateNode={handleUpdateNode}
          onClose={() => setSelectedNode(null)}
        />
      )}

      {/* Template Gallery */}
      {showTemplateGallery && (
        <TemplateGallery
          onApplyTemplate={handleApplyTemplate}
          onClose={() => setShowTemplateGallery(false)}
        />
      )}

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportFile}
      />

      {/* Import Warnings Toast */}
      {importWarnings.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--sl-color-gray-6)',
            border: '1px solid var(--sl-color-accent)',
            borderRadius: '8px',
            padding: '12px 20px',
            zIndex: 1001,
            maxWidth: '500px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            justifyContent: 'space-between',
            gap: '12px',
          }}>
            <div>
              <div style={{ 
                color: 'var(--sl-color-accent)', 
                fontWeight: 600, 
                marginBottom: '4px',
                fontSize: '14px',
              }}>
                Import Notes
              </div>
              {importWarnings.map((warning, i) => (
                <div key={i} style={{ 
                  color: 'var(--sl-color-gray-2)', 
                  fontSize: '13px',
                  marginTop: '2px',
                }}>
                  • {warning}
                </div>
              ))}
            </div>
            <button
              onClick={() => setImportWarnings([])}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--sl-color-gray-3)',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '0',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Clear Canvas Confirmation Dialog */}
      <ConfirmDialog
        isOpen={clearCanvasConfirm}
        title="Clear Canvas"
        message={`Are you sure you want to clear all ${nodes.length} resource${nodes.length !== 1 ? 's' : ''} from the canvas? This action cannot be undone.`}
        confirmText="Clear"
        cancelText="Cancel"
        confirmColor="#DC2626"
        requireTypedConfirmation="clear"
        onConfirm={confirmClearCanvas}
        onCancel={() => setClearCanvasConfirm(false)}
      />

    </div>
  );
}
