import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style = {},
  ...props
}) {
  const [isHovered, setIsHovered] = useState(false);

  const colors = {
    primary: '#6366f1',
    primaryHover: '#4f46e5',
    secondary: 'rgba(255, 255, 255, 0.05)',
    secondaryHover: 'rgba(255, 255, 255, 0.1)',
    danger: 'rgba(239, 68, 68, 0.1)',
    dangerHover: 'rgba(239, 68, 68, 0.2)',
    dangerText: '#ef4444',
    borderDark: 'rgba(255, 255, 255, 0.1)',
    textWhite: '#ffffff',
    textMuted: 'rgba(255, 255, 255, 0.5)',
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: isHovered ? colors.primaryHover : colors.primary,
          color: '#ffffff',
          border: 'none',
        };
      case 'secondary':
        return {
          backgroundColor: isHovered ? colors.secondaryHover : colors.secondary,
          color: colors.textWhite,
          border: `1px solid ${isHovered ? 'rgba(99,102,241,0.4)' : colors.borderDark}`,
        };
      case 'danger':
        return {
          backgroundColor: isHovered ? colors.dangerHover : colors.danger,
          color: colors.dangerText,
          border: `1px solid rgba(239, 68, 68, 0.2)`,
        };
      case 'ghost':
        return {
          backgroundColor: isHovered ? colors.secondary : 'transparent',
          color: isHovered ? colors.textWhite : colors.textMuted,
          border: 'none',
        };
      default:
        return { backgroundColor: colors.primary, color: '#fff', border: 'none' };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { padding: '8px 16px', fontSize: '13px', borderRadius: '8px' };
      case 'lg':
        return { padding: '14px 28px', fontSize: '15px', borderRadius: '12px' };
      case 'md':
      default:
        return { padding: '12px 24px', fontSize: '14px', borderRadius: '10px' };
    }
  };

  const isDisabled = disabled || loading;

  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isDisabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: 600,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        transition: 'all 0.2s ease',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style,
      }}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
