import { useState } from 'react';
import { templates, templateCategories, type Template } from '../../data/templates';

interface TemplateGalleryProps {
  onApplyTemplate: (template: Template) => void;
  onClose: () => void;
}

export default function TemplateGallery({ onApplyTemplate, onClose }: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

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
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--sl-color-bg)',
          border: '1px solid var(--sl-color-gray-5)',
          borderRadius: '12px',
          width: '900px',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--sl-color-gray-5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2
              style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: 600,
                color: 'var(--sl-color-white)',
              }}
            >
              Template Gallery
            </h2>
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

          {/* Search */}
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: '14px',
              background: 'var(--sl-color-gray-6)',
              border: '1px solid var(--sl-color-gray-5)',
              borderRadius: '6px',
              color: 'var(--sl-color-white)',
              outline: 'none',
              marginBottom: '12px',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--sl-color-accent)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--sl-color-gray-5)';
            }}
          />

          {/* Category Filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedCategory('all')}
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                background: selectedCategory === 'all' ? 'var(--sl-color-accent)' : 'var(--sl-color-gray-6)',
                color: selectedCategory === 'all' ? 'var(--sl-color-black)' : 'var(--sl-color-gray-2)',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              All
            </button>
            {templateCategories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                style={{
                  padding: '6px 14px',
                  fontSize: '13px',
                  background: selectedCategory === category.id ? 'var(--sl-color-accent)' : 'var(--sl-color-gray-6)',
                  color: selectedCategory === category.id ? 'var(--sl-color-black)' : 'var(--sl-color-gray-2)',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
          }}
        >
          {filteredTemplates.length === 0 ? (
            <div
              style={{
                padding: '48px',
                textAlign: 'center',
                color: 'var(--sl-color-gray-3)',
                fontSize: '14px',
              }}
            >
              No templates found
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px',
              }}
            >
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  style={{
                    background: 'var(--sl-color-gray-6)',
                    border: '1px solid var(--sl-color-gray-5)',
                    borderRadius: '8px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => {
                    onApplyTemplate(template);
                    onClose();
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--sl-color-gray-5)';
                    e.currentTarget.style.borderColor = 'var(--sl-color-accent)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--sl-color-gray-6)';
                    e.currentTarget.style.borderColor = 'var(--sl-color-gray-5)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '32px' }}>{template.icon}</span>
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '16px',
                          fontWeight: 600,
                          color: 'var(--sl-color-white)',
                          marginBottom: '4px',
                        }}
                      >
                        {template.name}
                      </h3>
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--sl-color-gray-3)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          fontWeight: 500,
                        }}
                      >
                        {templateCategories.find(c => c.id === template.category)?.label}
                      </span>
                    </div>
                  </div>

                  <p
                    style={{
                      margin: '0 0 12px 0',
                      fontSize: '13px',
                      color: 'var(--sl-color-gray-2)',
                      lineHeight: '1.5',
                    }}
                  >
                    {template.description}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                      flexWrap: 'wrap',
                      marginBottom: '12px',
                    }}
                  >
                    {template.tags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          padding: '2px 8px',
                          fontSize: '11px',
                          background: 'var(--sl-color-gray-7)',
                          color: 'var(--sl-color-gray-2)',
                          borderRadius: '4px',
                          fontFamily: 'var(--sl-font-mono)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--sl-color-gray-3)',
                    }}
                  >
                    {template.nodes.length} resource{template.nodes.length !== 1 ? 's' : ''} ·{' '}
                    {template.edges.length} connection{template.edges.length !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
