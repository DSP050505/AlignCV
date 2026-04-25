import { useState } from 'react';
import { Plus, Trash2, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '../ui/Button';

export default function ProfileSection({
  title,
  icon: Icon,
  items = [],
  renderItem,
  renderForm,
  onAdd,
  onDelete,
  emptyMessage = 'No items yet',
}) {
  const [editingId, setEditingId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const colors = {
    card: 'rgba(255, 255, 255, 0.02)',
    cardHeader: 'rgba(255, 255, 255, 0.04)',
    border: 'rgba(255, 255, 255, 0.08)',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    textMuted: 'rgba(255, 255, 255, 0.4)',
    primaryLight: '#818cf8',
    danger: '#ef4444',
  };

  return (
    <div
      style={{
        backgroundColor: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: '16px',
        overflow: 'hidden',
        marginBottom: '16px',
      }}
    >
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.cardHeader)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          borderBottom: expanded ? `1px solid ${colors.border}` : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {Icon && <Icon size={20} color={colors.primaryLight} />}
          <h3
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: colors.text,
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {title}
          </h3>
          <span
            style={{
              fontSize: '12px',
              color: colors.textMuted,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '2px 8px',
              borderRadius: '12px',
            }}
          >
            {items.length}
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={16} color={colors.textSecondary} />
        ) : (
          <ChevronDown size={16} color={colors.textSecondary} />
        )}
      </div>

      {expanded && (
        <div style={{ padding: '20px 24px' }}>
          {/* Items List */}
          {items.length === 0 && !showAdd ? (
            <p style={{ color: colors.textMuted, fontSize: '14px', textAlign: 'center', padding: '16px 0', margin: 0 }}>
              {emptyMessage}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              {items.map((item) => (
                <div key={item.id} style={{ position: 'relative' }}>
                  {editingId === item.id ? (
                    <div
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '12px',
                        padding: '16px',
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      {renderForm(item, () => setEditingId(null))}
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '12px',
                        padding: '16px',
                        border: `1px solid transparent`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = colors.border;
                        const actions = e.currentTarget.querySelector('.item-actions');
                        if (actions) actions.style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                        const actions = e.currentTarget.querySelector('.item-actions');
                        if (actions) actions.style.opacity = '0';
                      }}
                    >
                      <div style={{ flex: 1, color: colors.text }}>{renderItem(item)}</div>
                      <div
                        className="item-actions"
                        style={{
                          display: 'flex',
                          gap: '4px',
                          opacity: 0,
                          transition: 'opacity 0.2s',
                          marginLeft: '12px',
                          flexShrink: 0,
                        }}
                      >
                        {renderForm && (
                          <button
                            onClick={() => setEditingId(item.id)}
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: 'none',
                              padding: '6px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: colors.primaryLight,
                            }}
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(item.id)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: 'none',
                              padding: '6px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              color: colors.danger,
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add Form */}
          {showAdd ? (
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid rgba(99, 102, 241, 0.3)`,
              }}
            >
              {renderForm(null, () => setShowAdd(false))}
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                color: colors.text,
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              <Plus size={14} />
              Add {title.replace(/s$/, '')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
