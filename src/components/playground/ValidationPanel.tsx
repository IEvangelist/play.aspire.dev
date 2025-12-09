import { useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { AspireNodeData } from './AspireNode';
import { validatePlayground, type ValidationIssue } from '../../utils/validation';

interface ValidationPanelProps {
  nodes: Node<AspireNodeData>[];
  edges: Edge[];
  onNodeClick?: (nodeId: string) => void;
}

export default function ValidationPanel({ nodes, edges, onNodeClick }: ValidationPanelProps) {
  const issues = useMemo(() => validatePlayground(nodes, edges), [nodes, edges]);

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  const getSeverityIcon = (severity: ValidationIssue['severity']) => {
    switch (severity) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
    }
  };

  const getSeverityColor = (severity: ValidationIssue['severity']) => {
    switch (severity) {
      case 'error':
        return '#DC2626';
      case 'warning':
        return '#F59E0B';
      case 'info':
        return '#3B82F6';
    }
  };

  const getCategoryLabel = (category: ValidationIssue['category']) => {
    switch (category) {
      case 'architecture':
        return 'Architecture';
      case 'security':
        return 'Security';
      case 'performance':
        return 'Performance';
      case 'reliability':
        return 'Reliability';
    }
  };

  if (issues.length === 0) {
    return (
      <div
        style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#10B981',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 5,
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        <span style={{ fontSize: '18px' }}>✅</span>
        No validation issues found
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        maxHeight: '400px',
        background: 'var(--sl-color-bg)',
        border: '1px solid var(--sl-color-gray-5)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--sl-color-gray-5)',
          background: 'var(--sl-color-gray-6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--sl-color-white)',
            }}
          >
            Validation Results
          </h3>
          <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
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
        </div>
      </div>

      {/* Issues List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
        }}
      >
        {issues.map(issue => (
          <div
            key={issue.id}
            style={{
              padding: '12px',
              marginBottom: '8px',
              background: 'var(--sl-color-gray-6)',
              border: `1px solid ${getSeverityColor(issue.severity)}44`,
              borderLeft: `4px solid ${getSeverityColor(issue.severity)}`,
              borderRadius: '6px',
              cursor: issue.nodeId ? 'pointer' : 'default',
            }}
            onClick={() => issue.nodeId && onNodeClick?.(issue.nodeId)}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ fontSize: '16px', marginTop: '2px' }}>
                {getSeverityIcon(issue.severity)}
              </span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      background: `${getSeverityColor(issue.severity)}22`,
                      color: getSeverityColor(issue.severity),
                      borderRadius: '4px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {getCategoryLabel(issue.category)}
                  </span>
                </div>
                <p
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: '13px',
                    color: 'var(--sl-color-white)',
                    fontWeight: 500,
                  }}
                >
                  {issue.message}
                </p>
                {issue.suggestion && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: '12px',
                      color: 'var(--sl-color-gray-2)',
                      fontStyle: 'italic',
                    }}
                  >
                    💡 {issue.suggestion}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
