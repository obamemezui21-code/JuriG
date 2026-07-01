/**
 * Icon Library
 * Centralized icon components with semantic meaning
 * Only adds icons when they improve UX
 */

export const Icons = {
  // Navigation
  Home: '🏠',
  Dashboard: '📊',
  Search: '🔍',
  Profile: '👤',
  Settings: '⚙️',
  Menu: '☰',
  Back: '←',
  
  // Communication
  Notifications: '🔔',
  Message: '💬',
  Mail: '📧',
  
  // Actions
  Download: '⬇️',
  Upload: '⬆️',
  Delete: '🗑️',
  Edit: '✎',
  Add: '➕',
  Check: '✓',
  Close: '✕',
  
  // Finance
  Payment: '💳',
  Cart: '🛒',
  Wallet: '👜',
  Invoice: '📄',
  Money: '💰',
  
  // Status
  Favorites: '❤️',
  Star: '⭐',
  Warning: '⚠️',
  Error: '❌',
  Success: '✅',
  
  // Location & Time
  Location: '📍',
  Calendar: '📅',
  Clock: '🕐',
  
  // Security
  Lock: '🔒',
  Unlock: '🔓',
  Shield: '🛡️',
  
  // Organization
  Organization: '🏢',
  Users: '👥',
  Clients: '🤝',
  Cases: '📋',
  Procedures: '📑',
  Services: '🔧',
  
  // Additional
  Help: '❓',
  Info: 'ⓘ',
  ThemeDark: '🌙',
  ThemeLight: '☀️',
  Export: '📤',
  Share: '📤',
  Refresh: '🔄'
};

/**
 * Get icon for a given action/page
 * @param {string} type - Icon type/action name
 * @returns {string} Icon emoji or empty string if not found
 */
export const getIcon = (type) => {
  return Icons[type] || '';
};

/**
 * Icon component wrapper for consistent styling
 * @param {object} props - Component props
 * @returns {JSX.Element} Icon element
 */
export const Icon = ({ 
  type, 
  size = '1em', 
  margin = '0.25em', 
  title = '',
  onClick = null,
  style = {}
}) => {
  const icon = getIcon(type);
  
  if (!icon) return null;
  
  return (
    <span
      className="icon"
      style={{
        display: 'inline-block',
        fontSize: size,
        marginRight: margin,
        marginLeft: margin,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        ...style
      }}
      onClick={onClick}
      title={title}
      role="img"
      aria-label={title || type}
    >
      {icon}
    </span>
  );
};

export default Icons;
