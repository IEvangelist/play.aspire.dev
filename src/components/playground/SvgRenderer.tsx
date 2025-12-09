import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toSvg, toPng } from 'html-to-image';

import AspireNode, { type AspireNodeData } from './AspireNode';
import { parseAppHost } from '../../utils/importParsers';
import { decodeAppHost } from '../../utils/urlEncoding';

const nodeTypes = {
  aspire: AspireNode,
};

interface SvgRendererContentProps {
  nodes: Node<AspireNodeData>[];
  edges: Edge[];
  format: 'svg' | 'png';
  download: boolean;
}

function SvgRendererContent({ nodes, edges, format, download }: SvgRendererContentProps) {
  const { fitView } = useReactFlow();
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const exportToSvg = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);

    // Wait for React Flow to render and fit view
    await new Promise(resolve => setTimeout(resolve, 500));
    fitView({ padding: 0.2 });
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      // Find the viewport element
      const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
      if (!viewport) {
        throw new Error('React Flow viewport not found');
      }

      if (format === 'svg') {
        const svgString = await toSvg(viewport, {
          backgroundColor: '#0f172a',
          width: 1200,
          height: 800,
        });

        if (download) {
          // Trigger download
          const blob = new Blob([svgString], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'aspire-diagram.svg';
          a.click();
          URL.revokeObjectURL(url);
        }

        setSvgContent(svgString);
      } else {
        const pngDataUrl = await toPng(viewport, {
          backgroundColor: '#0f172a',
          width: 1200,
          height: 800,
        });

        if (download) {
          const a = document.createElement('a');
          a.href = pngDataUrl;
          a.download = 'aspire-diagram.png';
          a.click();
        }

        setSvgContent(pngDataUrl);
      }
    } catch (err) {
      console.error('Export failed:', err);
      setError(`Failed to export: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [fitView, format, download, isExporting]);

  useEffect(() => {
    if (nodes.length > 0 && !svgContent && !error) {
      exportToSvg();
    }
  }, [nodes, svgContent, error, exportToSvg]);

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        color: '#ef4444', 
        background: '#1e293b',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Export Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100vw', 
        height: '100vh',
        background: '#0f172a',
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        style={{ background: '#0f172a' }}
        defaultEdgeOptions={{
          animated: false,
          style: { stroke: '#888', strokeWidth: 2 },
        }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        panOnScroll={false}
        panOnDrag={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={2} color="#334155" />
      </ReactFlow>
      
      {/* Display the exported image */}
      {svgContent && (
        <img 
          src={svgContent}
          alt="Aspire Architecture Diagram"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            background: '#0f172a',
          }}
        />
      )}
    </div>
  );
}

export default function SvgRenderer() {
  const [searchParams] = useSearchParams();
  const [nodes, setNodes] = useState<Node<AspireNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const format = (searchParams.get('format') || 'svg') as 'svg' | 'png';
  const download = searchParams.get('download') === 'true';

  useEffect(() => {
    const encodedAppHost = searchParams.get('apphost');

    if (!encodedAppHost) {
      setError('No AppHost content provided. Use ?apphost=<encoded-content>');
      setLoading(false);
      return;
    }

    try {
      const appHostContent = decodeAppHost(encodedAppHost);
      const result = parseAppHost(appHostContent);

      if (result.nodes.length === 0) {
        setError('No resources found in the provided AppHost content');
        setLoading(false);
        return;
      }

      setNodes(result.nodes);
      setEdges(result.edges);
      setLoading(false);
    } catch (err) {
      console.error('Failed to parse AppHost:', err);
      setError(`Failed to parse AppHost: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div style={{ 
        padding: '20px', 
        color: '#94a3b8', 
        background: '#0f172a',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #334155',
            borderTopColor: '#7c3aed',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <p>Generating diagram...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '40px', 
        color: '#f87171', 
        background: '#0f172a',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ 
          textAlign: 'center',
          maxWidth: '500px',
          background: '#1e293b',
          padding: '32px',
          borderRadius: '12px',
          border: '1px solid #334155',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h1 style={{ fontSize: '20px', marginBottom: '12px', color: '#f8fafc' }}>
            Error Generating SVG
          </h1>
          <p style={{ fontSize: '14px', lineHeight: '1.6' }}>{error}</p>
          <div style={{ marginTop: '24px' }}>
            <a 
              href="/"
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                background: '#7c3aed',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Go to Playground
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <SvgRendererContent 
        nodes={nodes} 
        edges={edges} 
        format={format}
        download={download}
      />
    </ReactFlowProvider>
  );
}
