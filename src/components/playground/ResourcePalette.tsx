import { useState, useMemo } from 'react';
import { aspireResources, resourceCategories, type AspireResource } from '../../data/aspire-resources';
import paletteLogo from '/favicon.svg';

interface ResourcePaletteProps {
  onResourceDragStart: (event: React.DragEvent, resource: AspireResource) => void;
  onAddResource?: (resource: AspireResource) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function ResourcePalette({ onResourceDragStart, onAddResource, isCollapsed, onToggleCollapse, theme, onToggleTheme }: ResourcePaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredResources = useMemo(() => {
    return aspireResources.filter(resource => {
      const matchesSearch = 
        searchQuery === '' ||
        resource.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.package.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = 
        selectedCategory === 'all' || 
        resource.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Collapsed state - show only a thin bar with expand button
  if (isCollapsed) {
    return (
      <div
        style={{
          width: '48px',
          height: '100%',
          background: 'var(--sl-color-gray-7)',
          borderRight: '1px solid var(--sl-color-gray-5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '16px',
        }}
      >
        <button
          onClick={onToggleCollapse}
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
          title="Expand Resource Palette"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sl-color-white)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        <img 
          src={paletteLogo} 
          alt="Aspire Playground" 
          style={{ 
            height: '28px', 
            width: 'auto', 
            marginTop: '16px',
            opacity: 0.9,
          }} 
        />
        
        {/* Bottom icons when collapsed */}
        <div
          style={{
            marginTop: 'auto',
            paddingBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
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
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--sl-color-gray-5)';
              e.currentTarget.style.borderColor = 'var(--sl-color-accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'var(--sl-color-gray-5)';
            }}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sl-color-gray-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sl-color-gray-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {/* GitHub Link */}
          <a
            href="https://github.com/IEvangelist/play.aspire.dev"
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
            title="View on GitHub"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--sl-color-gray-3)">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
          <span style={{ fontSize: '10px', color: 'var(--sl-color-accent-high)' }}>
            v{__APP_VERSION__.split('.')[0]}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '320px',
        height: '100%',
        background: 'var(--sl-color-gray-7)',
        borderRight: '1px solid var(--sl-color-gray-5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid var(--sl-color-gray-5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '22px',
              fontWeight: 600,
              color: 'var(--sl-color-white)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <img src={paletteLogo} alt="Aspire Playground" style={{ height: '32px', width: 'auto', paddingRight: '4px' }} />
            Resource <span style={{ color: 'var(--sl-color-accent-high)' }}>Palette</span>
          </h2>
          <button
            onClick={onToggleCollapse}
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
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--sl-color-gray-5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title="Collapse Resource Palette"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sl-color-gray-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            fontSize: '15px',
            background: 'var(--sl-color-gray-6)',
            border: '1px solid var(--sl-color-gray-5)',
            borderRadius: '6px',
            color: 'var(--sl-color-white)',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--sl-color-accent)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--sl-color-gray-5)';
          }}
        />
      </div>

      {/* Category Filters */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--sl-color-gray-5)',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setSelectedCategory('all')}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            background: selectedCategory === 'all' ? 'var(--sl-color-accent)' : 'var(--sl-color-gray-6)',
            color: selectedCategory === 'all' ? 'var(--sl-color-black)' : 'var(--sl-color-gray-2)',
            border: 'none',
            borderRadius: '16px',
            cursor: 'pointer',
            fontWeight: 500,
            transition: 'all 0.2s',
          }}
        >
          🔍 All
        </button>
        {resourceCategories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              background: selectedCategory === category.id ? 'var(--sl-color-accent)' : 'var(--sl-color-gray-6)',
              color: selectedCategory === category.id ? 'var(--sl-color-black)' : 'var(--sl-color-gray-2)',
              border: 'none',
              borderRadius: '16px',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            {category.icon} {category.name}
          </button>
        ))}
      </div>

      {/* Resource List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
        }}
      >
        {filteredResources.length === 0 ? (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              color: 'var(--sl-color-gray-3)',
              fontSize: '15px',
            }}
          >
            No resources found
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredResources.map(resource => (
              <div
                key={resource.id}
                draggable
                onDragStart={(e) => onResourceDragStart(e, resource)}
                style={{
                  padding: '16px',
                  background: 'var(--sl-color-gray-6)',
                  border: '1px solid var(--sl-color-gray-5)',
                  borderRadius: '10px',
                  cursor: 'grab',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `color-mix(in srgb, ${resource.color} 15%, var(--sl-color-gray-5))`;
                  e.currentTarget.style.borderColor = resource.color;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 4px 12px ${resource.color}33`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--sl-color-gray-6)';
                  e.currentTarget.style.borderColor = 'var(--sl-color-gray-5)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: 'var(--sl-color-white)',
                        marginBottom: '4px',
                      }}
                    >
                      {resource.displayName}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--sl-color-gray-3)',
                        fontFamily: 'var(--sl-font-mono)',
                      }}
                    >
                      {resource.package}
                    </div>
                  </div>
                  <img src={resource.icon} alt="" style={{ height: '36px', maxWidth: '64px', width: 'auto', objectFit: 'contain' }} />
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    color: 'var(--sl-color-gray-2)',
                    lineHeight: '1.5',
                    marginBottom: '10px',
                  }}
                >
                  {resource.description}
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                  <a
                    href={`https://www.nuget.org/packages/${resource.package}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    onDragStart={(e) => e.preventDefault()}
                    style={{
                      padding: '7px 14px',
                      fontSize: '13px',
                      background: 'transparent',
                      color: 'var(--sl-color-accent)',
                      border: '1px solid var(--sl-color-accent)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 500,
                      transition: 'all 0.2s',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--sl-color-accent)';
                      e.currentTarget.style.color = 'var(--sl-color-black)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--sl-color-accent)';
                    }}
                  >
                    📖 Docs
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddResource?.(resource);
                    }}
                    onDragStart={(e) => e.preventDefault()}
                    style={{
                      padding: '7px 14px',
                      fontSize: '13px',
                      background: 'var(--sl-color-accent)',
                      color: 'var(--sl-color-black)',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--sl-color-accent-high)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--sl-color-accent)';
                    }}
                  >
                    Add →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            style={{
              width: '32px',
              height: '32px',
              background: 'transparent',
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
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'var(--sl-color-gray-5)';
            }}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sl-color-gray-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--sl-color-gray-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {/* GitHub Link */}
          <a
            href="https://github.com/IEvangelist/play.aspire.dev"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              width: '32px',
              height: '32px',
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
            title="View on GitHub"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--sl-color-gray-3)">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        </div>

        <span style={{ fontSize: '11px', color: 'var(--sl-color-accent-high)' }}>
          v{__APP_VERSION__}
        </span>
      </div>
    </div>
  );
}
