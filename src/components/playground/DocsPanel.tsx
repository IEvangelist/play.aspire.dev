import { useState } from 'react';
import type { AspireResource } from '../../data/aspire-resources';

interface DocsPanelProps {
  resource: AspireResource | null;
  onClose: () => void;
}

export default function DocsPanel({ resource, onClose }: DocsPanelProps) {
  const [activeSection, setActiveSection] = useState<'overview' | 'example' | 'reference'>('overview');

  if (!resource) return null;

  const getDocumentationUrl = (packageName: string) => {
    // Map package names to aspire.dev documentation URLs
    const docMap: Record<string, string> = {
      'Aspire.Hosting.PostgreSQL': 'https://aspire.dev/docs/database/postgresql-component',
      'Aspire.Hosting.SqlServer': 'https://aspire.dev/docs/database/sql-server-component',
      'Aspire.Hosting.MongoDB': 'https://aspire.dev/docs/database/mongodb-component',
      'Aspire.Hosting.MySql': 'https://aspire.dev/docs/database/mysql-component',
      'Aspire.Hosting.Oracle': 'https://aspire.dev/docs/database/oracle-component',
      'Aspire.Hosting.Redis': 'https://aspire.dev/docs/caching/redis-component',
      'Aspire.Hosting.Valkey': 'https://aspire.dev/docs/caching/valkey-component',
      'Aspire.Hosting.Garnet': 'https://aspire.dev/docs/caching/garnet-component',
      'Aspire.Hosting.RabbitMQ': 'https://aspire.dev/docs/messaging/rabbitmq-component',
      'Aspire.Hosting.Kafka': 'https://aspire.dev/docs/messaging/kafka-component',
      'Aspire.Hosting.Nats': 'https://aspire.dev/docs/messaging/nats-component',
      'Aspire.Hosting.NodeJs': 'https://aspire.dev/docs/get-started/build-aspire-apps-with-nodejs',
      'Aspire.Hosting.Python': 'https://aspire.dev/docs/get-started/build-aspire-apps-with-python',
      'Aspire.Hosting.Ollama': 'https://aspire.dev/docs/azureai/azureai-openai-component',
    };

    return docMap[packageName] || 'https://aspire.dev/docs';
  };

  const renderOverview = () => (
    <div>
      <h3
        style={{
          margin: '0 0 12px 0',
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--sl-color-white)',
        }}
      >
        Overview
      </h3>
      <p
        style={{
          margin: '0 0 16px 0',
          fontSize: '14px',
          color: 'var(--sl-color-gray-2)',
          lineHeight: '1.6',
        }}
      >
        {resource.description}
      </p>

      <div style={{ marginBottom: '16px' }}>
        <h4
          style={{
            margin: '0 0 8px 0',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--sl-color-white)',
          }}
        >
          Package
        </h4>
        <code
          style={{
            display: 'block',
            padding: '8px 12px',
            fontSize: '13px',
            fontFamily: 'var(--sl-font-mono)',
            background: 'var(--sl-color-gray-6)',
            border: '1px solid var(--sl-color-gray-5)',
            borderRadius: '4px',
            color: 'var(--sl-color-accent)',
          }}
        >
          {resource.package}
        </code>
      </div>

      {resource.nugetPackage && (
        <div style={{ marginBottom: '16px' }}>
          <h4
            style={{
              margin: '0 0 8px 0',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--sl-color-white)',
            }}
          >
            NuGet Package
          </h4>
          <code
            style={{
              display: 'block',
              padding: '8px 12px',
              fontSize: '13px',
              fontFamily: 'var(--sl-font-mono)',
              background: 'var(--sl-color-gray-6)',
              border: '1px solid var(--sl-color-gray-5)',
              borderRadius: '4px',
              color: 'var(--sl-color-accent)',
            }}
          >
            {resource.nugetPackage}
          </code>
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <h4
          style={{
            margin: '0 0 8px 0',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--sl-color-white)',
          }}
        >
          Hosting Method
        </h4>
        <span
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            fontSize: '12px',
            background: 'var(--sl-color-gray-6)',
            border: '1px solid var(--sl-color-gray-5)',
            borderRadius: '12px',
            color: 'var(--sl-color-gray-2)',
          }}
        >
          {resource.hostingMethod}
        </span>
      </div>

      {resource.languages && resource.languages.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h4
            style={{
              margin: '0 0 8px 0',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--sl-color-white)',
            }}
          >
            Supported Languages
          </h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {resource.languages.map(lang => (
              <span
                key={lang}
                style={{
                  padding: '4px 12px',
                  fontSize: '12px',
                  background: 'var(--sl-color-gray-6)',
                  border: '1px solid var(--sl-color-gray-5)',
                  borderRadius: '12px',
                  color: 'var(--sl-color-gray-2)',
                }}
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      )}

      {resource.connectionMethod && (
        <div style={{ marginBottom: '16px' }}>
          <h4
            style={{
              margin: '0 0 8px 0',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--sl-color-white)',
            }}
          >
            Connection Method
          </h4>
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              color: 'var(--sl-color-gray-2)',
            }}
          >
            {resource.connectionMethod}
          </p>
        </div>
      )}
    </div>
  );

  const renderExample = () => (
    <div>
      <h3
        style={{
          margin: '0 0 12px 0',
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--sl-color-white)',
        }}
      >
        Example Usage
      </h3>
      <pre
        style={{
          margin: 0,
          padding: '16px',
          fontSize: '13px',
          lineHeight: '1.6',
          fontFamily: 'var(--sl-font-mono)',
          color: 'var(--sl-color-white)',
          background: 'var(--sl-color-gray-7)',
          border: '1px solid var(--sl-color-gray-5)',
          borderRadius: '6px',
          overflow: 'auto',
        }}
      >
        {resource.exampleCode}
      </pre>
    </div>
  );

  const renderReference = () => (
    <div>
      <h3
        style={{
          margin: '0 0 12px 0',
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--sl-color-white)',
        }}
      >
        Official Documentation
      </h3>
      <p
        style={{
          margin: '0 0 16px 0',
          fontSize: '14px',
          color: 'var(--sl-color-gray-2)',
          lineHeight: '1.6',
        }}
      >
        For complete documentation, configuration options, and advanced scenarios, visit the official Aspire
        documentation.
      </p>
      <a
        href={getDocumentationUrl(resource.package)}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          fontSize: '14px',
          background: 'var(--sl-color-accent)',
          color: 'var(--sl-color-black)',
          textDecoration: 'none',
          borderRadius: '6px',
          fontWeight: 600,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--sl-color-accent-high)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--sl-color-accent)';
        }}
      >
        View Documentation →
      </a>

      <div style={{ marginTop: '24px' }}>
        <h4
          style={{
            margin: '0 0 12px 0',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--sl-color-white)',
          }}
        >
          Quick Links
        </h4>
        <ul style={{ margin: 0, padding: '0 0 0 20px', fontSize: '13px' }}>
          <li style={{ marginBottom: '8px' }}>
            <a
              href="https://aspire.dev/docs"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--sl-color-accent)',
                textDecoration: 'none',
              }}
            >
              Aspire Overview
            </a>
          </li>
          <li style={{ marginBottom: '8px' }}>
            <a
              href="https://aspire.dev/docs/get-started/build-your-first-aspire-app"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--sl-color-accent)',
                textDecoration: 'none',
              }}
            >
              Getting Started Guide
            </a>
          </li>
          <li style={{ marginBottom: '8px' }}>
            <a
              href="https://aspire.dev/docs/fundamentals/components-overview"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--sl-color-accent)',
                textDecoration: 'none',
              }}
            >
              Components Overview
            </a>
          </li>
        </ul>
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '400px',
        background: 'var(--sl-color-bg)',
        borderLeft: '1px solid var(--sl-color-gray-5)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--sl-color-gray-5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={resource.icon} alt="" style={{ height: '32px', maxWidth: '56px', width: 'auto', objectFit: 'contain' }} />
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'var(--sl-color-white)',
                }}
              >
                {resource.displayName}
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--sl-color-gray-3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {resource.category}
              </span>
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

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setActiveSection('overview')}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              background: activeSection === 'overview' ? 'var(--sl-color-gray-6)' : 'transparent',
              color: activeSection === 'overview' ? 'var(--sl-color-white)' : 'var(--sl-color-gray-3)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveSection('example')}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              background: activeSection === 'example' ? 'var(--sl-color-gray-6)' : 'transparent',
              color: activeSection === 'example' ? 'var(--sl-color-white)' : 'var(--sl-color-gray-3)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            Example
          </button>
          <button
            onClick={() => setActiveSection('reference')}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              background: activeSection === 'reference' ? 'var(--sl-color-gray-6)' : 'transparent',
              color: activeSection === 'reference' ? 'var(--sl-color-white)' : 'var(--sl-color-gray-3)',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            Reference
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
        }}
      >
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'example' && renderExample()}
        {activeSection === 'reference' && renderReference()}
      </div>
    </div>
  );
}
