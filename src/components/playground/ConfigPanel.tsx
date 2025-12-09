import { useState, useEffect } from 'react';
import type { Node } from '@xyflow/react';
import type { AspireNodeData } from './AspireNode';

interface ConfigPanelProps {
  selectedNode: Node<AspireNodeData> | null;
  onUpdateNode: (nodeId: string, updates: Partial<AspireNodeData>) => void;
  onClose: () => void;
}

interface EnvironmentVariable {
  key: string;
  value: string;
}

interface PortMapping {
  container: string;
  host: string;
}

interface VolumeMount {
  source: string;
  target: string;
}

export default function ConfigPanel({ selectedNode, onUpdateNode, onClose }: ConfigPanelProps) {
  const [envVars, setEnvVars] = useState<EnvironmentVariable[]>([]);
  const [ports, setPorts] = useState<PortMapping[]>([]);
  const [volumes, setVolumes] = useState<VolumeMount[]>([]);
  const [replicas, setReplicas] = useState<number>(1);
  const [persistent, setPersistent] = useState(true);

  useEffect(() => {
    if (!selectedNode) return;

    // Load existing config from node data
    setEnvVars(selectedNode.data.envVars || []);
    setPorts(selectedNode.data.ports || []);
    setVolumes(selectedNode.data.volumes || []);
    setReplicas(selectedNode.data.replicas || 1);
    setPersistent(selectedNode.data.persistent !== false);
  }, [selectedNode]);

  if (!selectedNode) return null;

  const handleSave = () => {
    onUpdateNode(selectedNode.id, {
      envVars,
      ports,
      volumes,
      replicas,
      persistent,
    });
    onClose();
  };

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };

  const removeEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...envVars];
    updated[index][field] = value;
    setEnvVars(updated);
  };

  const addPort = () => {
    setPorts([...ports, { container: '', host: '' }]);
  };

  const removePort = (index: number) => {
    setPorts(ports.filter((_, i) => i !== index));
  };

  const updatePort = (index: number, field: 'container' | 'host', value: string) => {
    const updated = [...ports];
    updated[index][field] = value;
    setPorts(updated);
  };

  const addVolume = () => {
    setVolumes([...volumes, { source: '', target: '' }]);
  };

  const removeVolume = (index: number) => {
    setVolumes(volumes.filter((_, i) => i !== index));
  };

  const updateVolume = (index: number, field: 'source' | 'target', value: string) => {
    const updated = [...volumes];
    updated[index][field] = value;
    setVolumes(updated);
  };

  const isDatabase = ['postgres', 'sqlserver', 'mongodb', 'mysql', 'oracle'].includes(
    selectedNode.data.resourceType
  );

  const isContainer = selectedNode.data.resourceType === 'container';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--sl-color-bg)',
          border: '1px solid var(--sl-color-gray-5)',
          borderRadius: '12px',
          width: '600px',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--sl-color-gray-5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={selectedNode.data.icon} alt="" style={{ height: '32px', maxWidth: '56px', width: 'auto', objectFit: 'contain' }} />
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'var(--sl-color-white)',
                }}
              >
                Configure {selectedNode.data.label}
              </h2>
              <p
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '13px',
                  color: 'var(--sl-color-gray-3)',
                  fontFamily: 'var(--sl-font-mono)',
                }}
              >
                {selectedNode.data.instanceName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--sl-color-gray-3)',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Environment Variables */}
          <section style={{ marginBottom: '24px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--sl-color-white)',
                }}
              >
                Environment Variables
              </h3>
              <button
                onClick={addEnvVar}
                style={{
                  padding: '4px 12px',
                  fontSize: '12px',
                  background: 'var(--sl-color-accent)',
                  color: 'var(--sl-color-black)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                + Add
              </button>
            </div>
            {envVars.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--sl-color-gray-3)', margin: 0 }}>
                No environment variables configured
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {envVars.map((env, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="KEY"
                      value={env.key}
                      onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        fontSize: '13px',
                        background: 'var(--sl-color-gray-6)',
                        border: '1px solid var(--sl-color-gray-5)',
                        borderRadius: '4px',
                        color: 'var(--sl-color-white)',
                        fontFamily: 'var(--sl-font-mono)',
                      }}
                    />
                    <input
                      type="text"
                      placeholder="value"
                      value={env.value}
                      onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                      style={{
                        flex: 2,
                        padding: '8px',
                        fontSize: '13px',
                        background: 'var(--sl-color-gray-6)',
                        border: '1px solid var(--sl-color-gray-5)',
                        borderRadius: '4px',
                        color: 'var(--sl-color-white)',
                        fontFamily: 'var(--sl-font-mono)',
                      }}
                    />
                    <button
                      onClick={() => removeEnvVar(index)}
                      style={{
                        padding: '8px',
                        background: 'transparent',
                        border: '1px solid var(--sl-color-gray-5)',
                        borderRadius: '4px',
                        color: 'var(--sl-color-gray-3)',
                        cursor: 'pointer',
                        fontSize: '16px',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Port Mappings (for containers) */}
          {isContainer && (
            <section style={{ marginBottom: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--sl-color-white)',
                  }}
                >
                  Port Mappings
                </h3>
                <button
                  onClick={addPort}
                  style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    background: 'var(--sl-color-accent)',
                    color: 'var(--sl-color-black)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  + Add
                </button>
              </div>
              {ports.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--sl-color-gray-3)', margin: 0 }}>
                  No port mappings configured
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {ports.map((port, index) => (
                    <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Container Port"
                        value={port.container}
                        onChange={(e) => updatePort(index, 'container', e.target.value)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          fontSize: '13px',
                          background: 'var(--sl-color-gray-6)',
                          border: '1px solid var(--sl-color-gray-5)',
                          borderRadius: '4px',
                          color: 'var(--sl-color-white)',
                          fontFamily: 'var(--sl-font-mono)',
                        }}
                      />
                      <span style={{ color: 'var(--sl-color-gray-3)' }}>→</span>
                      <input
                        type="text"
                        placeholder="Host Port"
                        value={port.host}
                        onChange={(e) => updatePort(index, 'host', e.target.value)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          fontSize: '13px',
                          background: 'var(--sl-color-gray-6)',
                          border: '1px solid var(--sl-color-gray-5)',
                          borderRadius: '4px',
                          color: 'var(--sl-color-white)',
                          fontFamily: 'var(--sl-font-mono)',
                        }}
                      />
                      <button
                        onClick={() => removePort(index)}
                        style={{
                          padding: '8px',
                          background: 'transparent',
                          border: '1px solid var(--sl-color-gray-5)',
                          borderRadius: '4px',
                          color: 'var(--sl-color-gray-3)',
                          cursor: 'pointer',
                          fontSize: '16px',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Volume Mounts */}
          <section style={{ marginBottom: '24px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--sl-color-white)',
                }}
              >
                Volume Mounts
              </h3>
              <button
                onClick={addVolume}
                style={{
                  padding: '4px 12px',
                  fontSize: '12px',
                  background: 'var(--sl-color-accent)',
                  color: 'var(--sl-color-black)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                + Add
              </button>
            </div>
            {volumes.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--sl-color-gray-3)', margin: 0 }}>
                No volumes configured
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {volumes.map((volume, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Source"
                      value={volume.source}
                      onChange={(e) => updateVolume(index, 'source', e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        fontSize: '13px',
                        background: 'var(--sl-color-gray-6)',
                        border: '1px solid var(--sl-color-gray-5)',
                        borderRadius: '4px',
                        color: 'var(--sl-color-white)',
                        fontFamily: 'var(--sl-font-mono)',
                      }}
                    />
                    <span style={{ color: 'var(--sl-color-gray-3)' }}>→</span>
                    <input
                      type="text"
                      placeholder="Target"
                      value={volume.target}
                      onChange={(e) => updateVolume(index, 'target', e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        fontSize: '13px',
                        background: 'var(--sl-color-gray-6)',
                        border: '1px solid var(--sl-color-gray-5)',
                        borderRadius: '4px',
                        color: 'var(--sl-color-white)',
                        fontFamily: 'var(--sl-font-mono)',
                      }}
                    />
                    <button
                      onClick={() => removeVolume(index)}
                      style={{
                        padding: '8px',
                        background: 'transparent',
                        border: '1px solid var(--sl-color-gray-5)',
                        borderRadius: '4px',
                        color: 'var(--sl-color-gray-3)',
                        cursor: 'pointer',
                        fontSize: '16px',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Replicas */}
          <section style={{ marginBottom: '24px' }}>
            <h3
              style={{
                margin: '0 0 8px 0',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--sl-color-white)',
              }}
            >
              Replicas
            </h3>
            <input
              type="number"
              min="1"
              max="100"
              value={replicas}
              onChange={(e) => setReplicas(parseInt(e.target.value) || 1)}
              style={{
                width: '100px',
                padding: '8px',
                fontSize: '13px',
                background: 'var(--sl-color-gray-6)',
                border: '1px solid var(--sl-color-gray-5)',
                borderRadius: '4px',
                color: 'var(--sl-color-white)',
                fontFamily: 'var(--sl-font-mono)',
              }}
            />
          </section>

          {/* Persistent (for databases) */}
          {isDatabase && (
            <section style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={persistent}
                  onChange={(e) => setPersistent(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                  }}
                />
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--sl-color-white)',
                  }}
                >
                  Persistent Container Lifetime
                </span>
              </label>
              <p style={{ fontSize: '12px', color: 'var(--sl-color-gray-3)', margin: '4px 0 0 24px' }}>
                Data will persist across container restarts
              </p>
            </section>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--sl-color-gray-5)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              background: 'transparent',
              color: 'var(--sl-color-gray-3)',
              border: '1px solid var(--sl-color-gray-5)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              background: 'var(--sl-color-accent)',
              color: 'var(--sl-color-black)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
