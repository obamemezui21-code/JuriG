/**
 * Legal Templates Module - Integration Configuration
 * Add this configuration to your main router
 */

import LegalTemplatesModule from './components/LegalTemplatesModule';

/**
 * Route Configuration for Legal Templates Module
 * Add this object to your application routes
 */
export const LEGAL_TEMPLATES_ROUTE = {
  path: '/legal-templates',
  name: 'Legal Templates',
  component: LegalTemplatesModule,
  icon: 'book-open',
  description: 'OHADA Legal Templates Library',
  requiresAuth: true,
  category: 'documents'
};

/**
 * Navigation Item Configuration
 * Add this to your navigation menu
 */
export const LEGAL_TEMPLATES_NAV_ITEM = {
  label: 'Legal Templates',
  icon: 'book-open',
  path: '/legal-templates',
  color: '#42b883',
  badge: null,
  submenu: [
    {
      label: 'All Templates',
      path: '/legal-templates?view=all',
      icon: 'grid'
    },
    {
      label: 'System Models',
      path: '/legal-templates?view=system',
      icon: 'shield'
    },
    {
      label: 'Custom Models',
      path: '/legal-templates?view=custom',
      icon: 'edit'
    }
  ]
};

/**
 * Router Integration Example (for React Router v6)
 * 
 * import { LEGAL_TEMPLATES_ROUTE } from './modules/legal-templates/config';
 * 
 * const routes = [
 *   // ... other routes
 *   {
 *     ...LEGAL_TEMPLATES_ROUTE,
 *     element: <LEGAL_TEMPLATES_ROUTE.component />
 *   }
 * ];
 */

/**
 * Navigation Integration Example
 * 
 * import { LEGAL_TEMPLATES_NAV_ITEM } from './modules/legal-templates/config';
 * 
 * const navItems = [
 *   // ... other nav items
 *   LEGAL_TEMPLATES_NAV_ITEM
 * ];
 */

/**
 * Module Metadata
 */
export const MODULE_METADATA = {
  id: 'legal-templates',
  name: 'OHADA Legal Templates',
  version: '1.0.0',
  author: 'JuriGabon Development Team',
  description: 'Professional legal document templates compliant with OHADA standards',
  features: [
    'Template management',
    'Advanced search and filtering',
    'Version control',
    'System and custom templates',
    'OHADA compliance',
    'Multi-country support'
  ],
  dependencies: [
    'react',
    'AuthContext',
    'ThemeContext'
  ],
  requiredPermissions: [
    'view_templates',
    'create_templates',
    'edit_templates',
    'delete_templates'
  ],
  databaseCollections: [
    'legal_templates',
    'template_versions'
  ]
};

/**
 * Default Configuration
 */
export const DEFAULT_CONFIG = {
  itemsPerPage: 12,
  maxUploadSize: 5242880, // 5MB
  allowedFileTypes: ['html', 'docx', 'pdf'],
  cacheDuration: 3600000, // 1 hour
  enableVersioning: true,
  maxVersions: 50,
  autoArchiveAfterDays: 365
};

export default {
  LEGAL_TEMPLATES_ROUTE,
  LEGAL_TEMPLATES_NAV_ITEM,
  MODULE_METADATA,
  DEFAULT_CONFIG
};
