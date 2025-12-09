import { useState, useEffect, useCallback } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  requireTypedConfirmation?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = '#DC2626',
  requireTypedConfirmation,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [typedValue, setTypedValue] = useState('');

  // Reset typed value when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTypedValue('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onCancel();
      }
      if (e.key === 'Enter' && !requireTypedConfirmation) {
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel, onConfirm, requireTypedConfirmation]);

  const isConfirmEnabled = requireTypedConfirmation
    ? typedValue.toLowerCase() === requireTypedConfirmation.toLowerCase()
    : true;

  const handleConfirm = useCallback(() => {
    if (isConfirmEnabled) {
      onConfirm();
    }
  }, [isConfirmEnabled, onConfirm]);

  if (!isOpen) return null;

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
      onClick={onCancel}
    >
      <div
        style={{
          background: 'var(--sl-color-gray-6)',
          borderRadius: '12px',
          border: '1px solid var(--sl-color-gray-5)',
          padding: '24px',
          maxWidth: '420px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--sl-color-white)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            {title}
          </h3>
        </div>

        {/* Message */}
        <p style={{
          margin: '0 0 20px 0',
          fontSize: '14px',
          color: 'var(--sl-color-gray-2)',
          lineHeight: '1.6',
        }}>
          {message}
        </p>

        {/* Typed confirmation input */}
        {requireTypedConfirmation && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              color: 'var(--sl-color-gray-3)',
              marginBottom: '8px',
            }}>
              Type <strong style={{ color: 'var(--sl-color-accent-high)' }}>"{requireTypedConfirmation}"</strong> to confirm:
            </label>
            <input
              type="text"
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isConfirmEnabled) {
                  handleConfirm();
                }
              }}
              autoFocus
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                background: 'var(--sl-color-gray-7)',
                border: `1px solid ${isConfirmEnabled ? 'var(--sl-color-accent)' : 'var(--sl-color-gray-5)'}`,
                borderRadius: '6px',
                color: 'var(--sl-color-white)',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              placeholder={requireTypedConfirmation}
            />
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              background: 'var(--sl-color-gray-5)',
              color: 'var(--sl-color-white)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--sl-color-gray-4)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--sl-color-gray-5)'}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isConfirmEnabled}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              background: isConfirmEnabled ? confirmColor : 'var(--sl-color-gray-5)',
              color: isConfirmEnabled ? 'white' : 'var(--sl-color-gray-3)',
              border: 'none',
              borderRadius: '6px',
              cursor: isConfirmEnabled ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              transition: 'all 0.2s',
              opacity: isConfirmEnabled ? 1 : 0.6,
            }}
            onMouseEnter={(e) => {
              if (isConfirmEnabled) {
                e.currentTarget.style.filter = 'brightness(1.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'none';
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
