import { memo, useState, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';

export interface AspireNodeData extends Record<string, unknown> {
  resourceType: string;
  label: string;
  icon: string;
  color: string;
  instanceName: string;
  databaseName?: string;
  allowsDatabase?: boolean;
  envVars?: Array<{ key: string; value: string }>;
  ports?: Array<{ container: string; host: string }>;
  volumes?: Array<{ source: string; target: string }>;
  replicas?: number;
  persistent?: boolean;
}

export type AspireNode = Node<AspireNodeData, 'aspireNode'>;

const AspireNode = memo(({ data, id, selected }: NodeProps<AspireNode>) => {
  const [isEditing, setIsEditing] = useState(false);
  const [instanceName, setInstanceName] = useState(data.instanceName || '');
  const [databaseName, setDatabaseName] = useState(data.databaseName || '');

  const handleDoubleClick = useCallback(() => {
    // Trigger config panel via custom event
    window.dispatchEvent(new CustomEvent('openNodeConfig', { detail: { nodeId: id } }));
  }, [id]);

  const handleInstanceNameBlur = useCallback(() => {
    setIsEditing(false);
    if (instanceName.trim()) {
      data.instanceName = instanceName.trim();
    }
  }, [instanceName, data]);

  const handleDatabaseNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newName = e.target.value;
      setDatabaseName(newName);
      data.databaseName = newName;
    },
    [data]
  );

  const handleInstanceNameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleInstanceNameBlur();
      }
    },
    [handleInstanceNameBlur]
  );

  return (
    <div
      className="aspire-node"
      onDoubleClick={handleDoubleClick}
      style={{
        background: selected ? `${data.color}22` : 'var(--sl-node-bg)',
        borderColor: selected ? data.color : 'var(--sl-node-border)',
        borderWidth: '2px',
        borderStyle: 'solid',
        borderRadius: '8px',
        padding: '12px 16px',
        minWidth: '200px',
        boxShadow: selected
          ? `0 0 0 2px ${data.color}44`
          : '0 2px 8px rgba(0, 0, 0, 0.3)',
        cursor: 'default',
      }}
    >
      {/* Left handle - target */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{
          background: data.color,
          width: '10px',
          height: '10px',
          border: '2px solid var(--sl-node-bg)',
        }}
      />
      {/* Top handle - target */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{
          background: data.color,
          width: '10px',
          height: '10px',
          border: '2px solid var(--sl-node-bg)',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <img src={data.icon} alt="" style={{ height: '24px', maxWidth: '40px', width: 'auto', objectFit: 'contain' }} />
        <span
          style={{
            fontSize: '12px',
            color: 'var(--sl-node-text-muted)',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {data.label}
        </span>
      </div>

      <div style={{ marginBottom: data.allowsDatabase ? '8px' : '0' }}>
        {isEditing ? (
          <input
            type="text"
            value={instanceName}
            onChange={(e) => setInstanceName(e.target.value)}
            onBlur={handleInstanceNameBlur}
            onKeyDown={handleInstanceNameKeyDown}
            autoFocus
            style={{
              width: '100%',
              padding: '4px 8px',
              fontSize: '14px',
              background: 'var(--sl-node-input-bg)',
              border: `1px solid ${data.color}`,
              borderRadius: '4px',
              color: 'var(--sl-node-text)',
              outline: 'none',
              fontFamily: 'var(--sl-font-mono)',
            }}
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            style={{
              cursor: 'text',
              padding: '4px 8px',
              fontSize: '14px',
              color: 'var(--sl-node-text)',
              fontWeight: 500,
              fontFamily: 'var(--sl-font-mono)',
              borderRadius: '4px',
              border: '1px solid transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--sl-node-input-bg)';
              e.currentTarget.style.borderColor = 'var(--sl-node-input-border)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            {instanceName || 'Click to name'}
          </div>
        )}
      </div>

      {data.allowsDatabase && (
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--sl-node-border)' }}>
          <label
            style={{
              display: 'block',
              fontSize: '11px',
              color: 'var(--sl-node-text-muted)',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Database Name
          </label>
          <input
            type="text"
            value={databaseName}
            onChange={handleDatabaseNameChange}
            placeholder="database"
            style={{
              width: '100%',
              padding: '4px 8px',
              fontSize: '13px',
              background: 'var(--sl-node-input-bg)',
              border: '1px solid var(--sl-node-input-border)',
              borderRadius: '4px',
              color: 'var(--sl-node-text)',
              outline: 'none',
              fontFamily: 'var(--sl-font-mono)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = data.color;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--sl-node-input-border)';
            }}
          />
        </div>
      )}

      {/* Right handle - source */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          background: data.color,
          width: '10px',
          height: '10px',
          border: '2px solid var(--sl-node-bg)',
        }}
      />
      {/* Bottom handle - source */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          background: data.color,
          width: '10px',
          height: '10px',
          border: '2px solid var(--sl-node-bg)',
        }}
      />
    </div>
  );
});

AspireNode.displayName = 'AspireNode';

export default AspireNode;
