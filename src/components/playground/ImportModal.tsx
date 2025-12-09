import { useState, useRef } from 'react';
import csharpIcon from '../../assets/icons/csharp.svg';
import dockerIcon from '../../assets/icons/docker.svg';

export type ImportType = 'apphost' | 'docker-compose' | 'dockerfile';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (type: ImportType, content: string, fileName: string) => void;
}

interface ImportOption {
  id: ImportType;
  title: string;
  description: string;
  icon: string;
  accept: string;
  color: string;
}

const importOptions: ImportOption[] = [
  {
    id: 'apphost',
    title: 'AppHost.cs',
    description: 'Import from an existing .NET Aspire AppHost Program.cs file',
    icon: csharpIcon,
    accept: '.cs',
    color: '#512BD4',
  },
  {
    id: 'docker-compose',
    title: 'Docker Compose',
    description: 'Import services from a docker-compose.yml or docker-compose.yaml file',
    icon: dockerIcon,
    accept: '.yml,.yaml',
    color: '#2496ED',
  },
  {
    id: 'dockerfile',
    title: 'Dockerfile',
    description: 'Import a Dockerfile as a container resource',
    icon: dockerIcon,
    accept: 'Dockerfile,Dockerfile.*,.dockerfile',
    color: '#0db7ed',
  },
];

export default function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [selectedType, setSelectedType] = useState<ImportType | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleBack = () => {
    setSelectedType(null);
    setError(null);
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedType) return;

    const file = files[0];
    
    // Validate file type
    if (selectedType === 'apphost' && !file.name.endsWith('.cs')) {
      setError('Please select a .cs file');
      return;
    }
    
    if (selectedType === 'docker-compose' && !file.name.match(/\.(yml|yaml)$/i)) {
      setError('Please select a .yml or .yaml file');
      return;
    }
    
    if (selectedType === 'dockerfile') {
      // Dockerfile can be named "Dockerfile", "Dockerfile.dev", etc.
      const isDockerfile = file.name.toLowerCase().includes('dockerfile') || 
                          file.name.endsWith('.dockerfile');
      if (!isDockerfile) {
        setError('Please select a Dockerfile (e.g., Dockerfile, Dockerfile.dev)');
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onImport(selectedType, content, file.name);
      onClose();
      setSelectedType(null);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const getAcceptPattern = (): string => {
    if (!selectedType) return '';
    const option = importOptions.find(o => o.id === selectedType);
    if (selectedType === 'dockerfile') {
      // Dockerfile doesn't have a standard extension
      return '*';
    }
    return option?.accept || '';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--sl-color-gray-6)',
          borderRadius: '12px',
          border: '1px solid var(--sl-color-gray-5)',
          padding: '24px',
          maxWidth: selectedType ? '500px' : '600px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {selectedType && (
              <button
                onClick={handleBack}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--sl-color-gray-3)',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--sl-color-gray-5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                ←
              </button>
            )}
            <h3 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 600,
              color: 'var(--sl-color-white)',
            }}>
              {selectedType 
                ? `Import ${importOptions.find(o => o.id === selectedType)?.title}`
                : 'Import Configuration'
              }
            </h3>
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
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--sl-color-white)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--sl-color-gray-3)';
            }}
          >
            ×
          </button>
        </div>

        {!selectedType ? (
          // Import type selection
          <>
            <p style={{
              color: 'var(--sl-color-gray-3)',
              fontSize: '14px',
              marginBottom: '20px',
            }}>
              Select the type of configuration you want to import:
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {importOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setSelectedType(option.id);
                    setError(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px',
                    background: 'var(--sl-color-gray-7)',
                    border: '1px solid var(--sl-color-gray-5)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = option.color;
                    e.currentTarget.style.background = 'var(--sl-color-gray-6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--sl-color-gray-5)';
                    e.currentTarget.style.background = 'var(--sl-color-gray-7)';
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      background: `${option.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      flexShrink: 0,
                    }}
                  >
                    <img 
                      src={option.icon} 
                      alt={option.title}
                      style={{ width: '28px', height: '28px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--sl-color-white)',
                      marginBottom: '4px',
                    }}>
                      {option.title}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: 'var(--sl-color-gray-3)',
                    }}>
                      {option.description}
                    </div>
                  </div>
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="var(--sl-color-gray-4)" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              ))}
            </div>
          </>
        ) : (
          // File upload area
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={getAcceptPattern()}
              onChange={(e) => handleFileSelect(e.target.files)}
              style={{ display: 'none' }}
            />
            
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={handleBrowseClick}
              style={{
                border: `2px dashed ${dragActive ? 'var(--sl-color-accent)' : 'var(--sl-color-gray-4)'}`,
                borderRadius: '8px',
                padding: '40px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: dragActive ? 'var(--sl-color-gray-7)' : 'transparent',
              }}
            >
              <div style={{
                fontSize: '48px',
                marginBottom: '16px',
              }}>
                {importOptions.find(o => o.id === selectedType)?.icon}
              </div>
              <p style={{
                color: 'var(--sl-color-white)',
                fontSize: '16px',
                fontWeight: 500,
                marginBottom: '8px',
              }}>
                Drop your file here
              </p>
              <p style={{
                color: 'var(--sl-color-gray-3)',
                fontSize: '14px',
                marginBottom: '16px',
              }}>
                or click to browse
              </p>
              <p style={{
                color: 'var(--sl-color-gray-4)',
                fontSize: '12px',
              }}>
                {selectedType === 'apphost' && 'Accepts: .cs files'}
                {selectedType === 'docker-compose' && 'Accepts: .yml, .yaml files'}
                {selectedType === 'dockerfile' && 'Accepts: Dockerfile, Dockerfile.*, *.dockerfile'}
              </p>
            </div>

            {error && (
              <div style={{
                marginTop: '12px',
                padding: '12px',
                background: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                borderRadius: '6px',
                color: '#DC2626',
                fontSize: '13px',
              }}>
                ⚠️ {error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
