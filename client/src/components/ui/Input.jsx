import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Input({
  label,
  icon: Icon,
  error,
  type = 'text',
  className = '',
  inputClassName = '',
  id,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  
  const colors = {
    bg: 'rgba(0, 0, 0, 0.2)',
    border: 'rgba(255, 255, 255, 0.15)',
    borderFocus: '#6366f1',
    text: '#ffffff',
    textMuted: 'rgba(255, 255, 255, 0.4)',
    danger: '#ef4444',
  };

  const currentBorderColor = error ? colors.danger : (isFocused ? colors.borderFocus : colors.border);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', ...props.style }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: 0,
          }}
        >
          {label}
        </label>
      )}
      
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {Icon && (
          <div style={{ position: 'absolute', left: '14px', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: isFocused ? colors.borderFocus : colors.textMuted, transition: 'color 0.2s' }}>
            <Icon size={16} />
          </div>
        )}
        
        <input
          id={id}
          type={inputType}
          onFocus={(e) => { setIsFocused(true); if (props.onFocus) props.onFocus(e); }}
          onBlur={(e) => { setIsFocused(false); if (props.onBlur) props.onBlur(e); }}
          style={{
            width: '100%',
            backgroundColor: colors.bg,
            border: `1.5px solid ${currentBorderColor}`,
            borderRadius: '10px',
            color: props.disabled ? colors.textMuted : colors.text,
            cursor: props.disabled ? 'not-allowed' : 'auto',
            opacity: props.disabled ? 0.6 : 1,
            fontSize: '14px',
            padding: `12px 16px 12px ${Icon ? '38px' : '16px'}`,
            paddingRight: isPassword ? '40px' : '16px',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          {...props}
        />
        
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '12px',
              background: 'none',
              border: 'none',
              color: colors.textMuted,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
            }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      
      {error && (
        <p style={{ fontSize: '12px', color: colors.danger, margin: '2px 0 0 4px' }}>
          {error}
        </p>
      )}
    </div>
  );
}
