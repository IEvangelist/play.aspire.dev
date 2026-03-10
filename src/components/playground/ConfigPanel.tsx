import { useState, useEffect, useCallback } from 'react';
import type { Node } from '@xyflow/react';
import type { AspireNodeData } from './AspireNode';
import { aspireResources } from '../../data/aspire-resources';

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

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px',
  fontSize: '13px',
  background: 'var(--sl-color-gray-6)',
  border: '1px solid var(--sl-color-gray-5)',
  borderRadius: '4px',
  color: 'var(--sl-color-white)',
  fontFamily: 'var(--sl-font-mono)',
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--sl-color-white)',
};

const addButtonStyle: React.CSSProperties = {
  padding: '4px 12px',
  fontSize: '12px',
  background: 'var(--sl-color-accent)',
  color: 'var(--sl-color-black)',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 500,
};

const removeButtonStyle: React.CSSProperties = {
  padding: '8px',
  background: 'transparent',
  border: '1px solid var(--sl-color-gray-5)',
  borderRadius: '4px',
  color: 'var(--sl-color-gray-3)',
  cursor: 'pointer',
  fontSize: '16px',
};

export default function ConfigPanel({ selectedNode, onUpdateNode, onClose }: ConfigPanelProps) {
  const [envVars, setEnvVars] = useState<EnvironmentVariable[]>([]);
  const [ports, setPorts] = useState<PortMapping[]>([]);
  const [volumes, setVolumes] = useState<VolumeMount[]>([]);
  const [replicas, setReplicas] = useState<number>(1);
  const [persistent, setPersistent] = useState(true);
  const [instanceName, setInstanceName] = useState('');
  const [databaseName, setDatabaseName] = useState('');

  useEffect(() => {
    if (!selectedNode) return;

    setEnvVars(selectedNode.data.envVars || []);
    setPorts(selectedNode.data.ports || []);
    setVolumes(selectedNode.data.volumes || []);
    setReplicas(selectedNode.data.replicas || 1);
    setPersistent(selectedNode.data.persistent !== false);
    setInstanceName(selectedNode.data.instanceName || '');
    setDatabaseName(selectedNode.data.databaseName || '');
  }, [selectedNode]);

  if (!selectedNode) return null;

  const resourceDef = aspireResources.find(r => r.id === selectedNode.data.resourceType);
  const isDatabase = resourceDef?.category === 'database';
  const isContainer = selectedNode.data.resourceType === 'container';

  const handleSave = () => {
    onUpdateNode(selectedNode.id, {
      envVars,
      ports,
      volumes,
      replicas,
      persistent,
      instanceName: instanceName.trim() || selectedNode.data.instanceName,
      databaseName: databaseName.trim() || undefined,
    });
    onClose();
  };

  const addEnvVar = () => setEnvVars([...envVars, { key: '', value: '' }]);
  const removeEnvVar = (index: number) => setEnvVars(envVars.filter((_, i) => i !== index));
  const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...envVars];
    updated[index][field] = value;
    setEnvVars(updated);
  };

  const addPort = () => setPorts([...ports, { container: '', host: '' }]);
  const removePort = (index: number) => setPorts(ports.filter((_, i) => i !== index));
  const updatePort = (index: number, field: 'container' | 'host', value: string) => {
    const updated = [...ports];
    updated[index][field] = value;
    setPorts(updated);
  };

  const addVolume = () => setVolumes([...volumes, { source: '', target: '' }]);
  const removeVolume = (index: number) => setVolumes(volumes.filter((_, i) => i !== index));
  const updateVolume = useCallback((index: number, field: 'source' | 'target', value: string) => {
    setVolumes(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const pickFolder = useCallback(async (index: number) => {
    try {
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker();
        updateVolume(index, 'source', `./${dirHandle.name}`);
      }
    } catch {
      // User cancelled or API not available
    }
  }, [updateVolume]);

  const docsUrl = resourceDef
    ? `https://www.nuget.org/packages/${resourceDef.package}`
    : null;

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
          width: '680px',
          maxHeight: '85vh',
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
            {selectedNode.data.icon ? (
              <img src={selectedNode.data.icon} alt="" style={{ height: '32px', maxWidth: '56px', width: 'auto', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: '28px' }}>📦</span>
            )}
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
              {resourceDef && (
                <p
                  style={{
                    margin: '2px 0 0 0',
                    fontSize: '12px',
                    color: 'var(--sl-color-gray-3)',
                    fontFamily: 'var(--sl-font-mono)',
                  }}
                >
                  {resourceDef.package}
                  {resourceDef.nugetPackage && (
                    <span style={{ color: 'var(--sl-color-gray-4)', marginLeft: '4px' }}>
                      @{resourceDef.nugetPackage.split('@')[1]}
                    </span>
                  )}
                </p>
              )}
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

          {/* Resource Info */}
          {resourceDef && (
            <section style={{
              marginBottom: '24px',
              padding: '16px',
              background: 'var(--sl-color-gray-6)',
              borderRadius: '8px',
              border: '1px solid var(--sl-color-gray-5)',
            }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--sl-color-gray-2)', lineHeight: 1.5 }}>
                {resourceDef.description}
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px' }}>
                <div>
                  <span style={{ color: 'var(--sl-color-gray-4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hosting Method</span>
                  <div style={{ color: 'var(--sl-color-accent)', fontFamily: 'var(--sl-font-mono)', marginTop: '2px' }}>
                    builder.{resourceDef.hostingMethod}()
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--sl-color-gray-4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</span>
                  <div style={{ color: 'var(--sl-color-white)', marginTop: '2px', textTransform: 'capitalize' }}>
                    {resourceDef.category}
                  </div>
                </div>
                {resourceDef.allowsDatabase && (
                  <div>
                    <span style={{ color: 'var(--sl-color-gray-4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Child Resource</span>
                    <div style={{ color: 'var(--sl-color-accent)', fontFamily: 'var(--sl-font-mono)', marginTop: '2px' }}>
                      .{resourceDef.connectionMethod || 'AddDatabase'}()
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                {docsUrl && (
                  <a
                    href={docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '4px 10px',
                      fontSize: '12px',
                      background: 'var(--sl-color-gray-5)',
                      color: 'var(--sl-color-accent)',
                      border: 'none',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}
                  >
                    📖 NuGet Package
                  </a>
                )}
                <a
                  href={`https://learn.microsoft.com/en-us/dotnet/aspire/search/?query=${encodeURIComponent(resourceDef.displayName)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '4px 10px',
                    fontSize: '12px',
                    background: 'var(--sl-color-gray-5)',
                    color: 'var(--sl-color-accent)',
                    border: 'none',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  📚 Microsoft Learn
                </a>
              </div>
            </section>
          )}

          {/* Example Code */}
          {resourceDef?.exampleCode && (
            <section style={{ marginBottom: '24px' }}>
              <h3 style={{ ...sectionTitleStyle, marginBottom: '8px' }}>Example Code</h3>
              <pre style={{
                margin: 0,
                padding: '12px',
                background: 'var(--sl-color-gray-6)',
                border: '1px solid var(--sl-color-gray-5)',
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: 'var(--sl-font-mono)',
                color: 'var(--sl-color-accent)',
                lineHeight: 1.6,
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
              }}>
                {resourceDef.exampleCode}
              </pre>
            </section>
          )}

          {/* Instance Name */}
          <section style={{ marginBottom: '24px' }}>
            <h3 style={{ ...sectionTitleStyle, marginBottom: '8px' }}>Instance Name</h3>
            <input
              type="text"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              placeholder="my-resource"
              style={{
                ...inputStyle,
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </section>

          {/* Database Name (for database resources) */}
          {resourceDef?.allowsDatabase && (
            <section style={{ marginBottom: '24px' }}>
              <h3 style={{ ...sectionTitleStyle, marginBottom: '8px' }}>Database Name</h3>
              <input
                type="text"
                value={databaseName}
                onChange={(e) => setDatabaseName(e.target.value)}
                placeholder="mydb"
                style={{
                  ...inputStyle,
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              <p style={{ fontSize: '12px', color: 'var(--sl-color-gray-3)', margin: '4px 0 0 0' }}>
                Creates a child database via <code style={{ fontFamily: 'var(--sl-font-mono)', color: 'var(--sl-color-accent)' }}>
                  .{resourceDef.connectionMethod || 'AddDatabase'}("{databaseName || 'mydb'}")
                </code>
              </p>
            </section>
          )}

          {/* Environment Variables */}
          <section style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={sectionTitleStyle}>Environment Variables</h3>
              <button onClick={addEnvVar} style={addButtonStyle}>+ Add</button>
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
                      style={inputStyle}
                    />
                    <input
                      type="text"
                      placeholder="value"
                      value={env.value}
                      onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                      style={{ ...inputStyle, flex: 2 }}
                    />
                    <button onClick={() => removeEnvVar(index)} style={removeButtonStyle}>×</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Port Mappings (for containers) */}
          {isContainer && (
            <section style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={sectionTitleStyle}>Port Mappings</h3>
                <button onClick={addPort} style={addButtonStyle}>+ Add</button>
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
                        style={inputStyle}
                      />
                      <span style={{ color: 'var(--sl-color-gray-3)' }}>→</span>
                      <input
                        type="text"
                        placeholder="Host Port"
                        value={port.host}
                        onChange={(e) => updatePort(index, 'host', e.target.value)}
                        style={inputStyle}
                      />
                      <button onClick={() => removePort(index)} style={removeButtonStyle}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Bind Mounts */}
          <section style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={sectionTitleStyle}>Bind Mounts</h3>
              <button onClick={addVolume} style={addButtonStyle}>+ Add</button>
            </div>
            {volumes.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--sl-color-gray-3)', margin: 0 }}>
                No bind mounts configured
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {volumes.map((volume, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ flex: 1, display: 'flex', gap: 0 }}>
                      <input
                        type="text"
                        placeholder="Source path"
                        value={volume.source}
                        onChange={(e) => updateVolume(index, 'source', e.target.value)}
                        style={{ ...inputStyle, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                      />
                      <button
                        onClick={() => pickFolder(index)}
                        title="Browse for folder"
                        style={{
                          padding: '8px 10px',
                          fontSize: '14px',
                          background: 'var(--sl-color-gray-5)',
                          border: '1px solid var(--sl-color-gray-5)',
                          borderTopRightRadius: '4px',
                          borderBottomRightRadius: '4px',
                          borderTopLeftRadius: 0,
                          borderBottomLeftRadius: 0,
                          color: 'var(--sl-color-white)',
                          cursor: 'pointer',
                          lineHeight: 1,
                        }}
                      >
                        📁
                      </button>
                    </div>
                    <span style={{ color: 'var(--sl-color-gray-3)' }}>→</span>
                    <input
                      type="text"
                      placeholder="Container path"
                      value={volume.target}
                      onChange={(e) => updateVolume(index, 'target', e.target.value)}
                      style={inputStyle}
                    />
                    <button onClick={() => removeVolume(index)} style={removeButtonStyle}>×</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Replicas */}
          <section style={{ marginBottom: '24px' }}>
            <h3 style={{ ...sectionTitleStyle, marginBottom: '8px' }}>Replicas</h3>
            <input
              type="number"
              min="1"
              max="100"
              value={replicas}
              onChange={(e) => setReplicas(parseInt(e.target.value) || 1)}
              style={{
                ...inputStyle,
                width: '100px',
              }}
            />
          </section>

          {/* Persistent (for databases) */}
          {isDatabase && (
            <section style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={persistent}
                  onChange={(e) => setPersistent(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--sl-color-white)' }}>
                  Persistent Container Lifetime
                </span>
              </label>
              <p style={{ fontSize: '12px', color: 'var(--sl-color-gray-3)', margin: '4px 0 0 24px' }}>
                Adds <code style={{ fontFamily: 'var(--sl-font-mono)', color: 'var(--sl-color-accent)' }}>.WithLifetime(ContainerLifetime.Persistent)</code> — data persists across restarts
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
