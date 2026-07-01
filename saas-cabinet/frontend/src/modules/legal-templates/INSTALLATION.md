/**
 * INSTALLATION & INTEGRATION GUIDE
 * OHADA Legal Templates Module
 */

/**
 * STEP 1: Copy Module Files
 * 
 * The module is located at:
 * frontend/src/modules/legal-templates/
 * 
 * Structure:
 * - components/          (React components)
 * - services/            (API services)
 * - hooks/               (Custom hooks)
 * - styles/              (CSS files)
 * - data/                (System templates)
 * - types.js             (Type definitions)
 * - config.js            (Configuration)
 * - index.js             (Entry point)
 * - README.md            (Documentation)
 */

/**
 * STEP 2: Add Module Route to Router
 * 
 * File: frontend/src/App.jsx or your main router file
 * 
 * Example:
 */

// Import at the top
import { LEGAL_TEMPLATES_ROUTE } from './modules/legal-templates/config';

// In your router configuration:
const routes = [
  // ... existing routes
  {
    path: LEGAL_TEMPLATES_ROUTE.path,
    element: <LEGAL_TEMPLATES_ROUTE.component />,
    name: LEGAL_TEMPLATES_ROUTE.name
  }
];

/**
 * STEP 3: Add Navigation Item
 * 
 * File: frontend/src/components/Navigation.jsx or your navigation component
 * 
 * Example:
 */

import { LEGAL_TEMPLATES_NAV_ITEM } from './modules/legal-templates/config';

const navigationItems = [
  // ... existing nav items
  LEGAL_TEMPLATES_NAV_ITEM
];

/**
 * STEP 4: Backend API Implementation
 * 
 * Create the following endpoints in your backend:
 * 
 * GET  /api/legal-templates
 *   - Returns: { templates: [] }
 *   - Query: ?category=X&status=Y&type=Z&country=A
 * 
 * POST /api/legal-templates
 *   - Body: { name, category, description, ... }
 *   - Returns: { template: {...} }
 * 
 * GET  /api/legal-templates/:id
 *   - Returns: { template: {...} }
 * 
 * PUT  /api/legal-templates/:id
 *   - Body: { name, description, ... }
 *   - Returns: { template: {...} }
 * 
 * DELETE /api/legal-templates/:id
 *   - Returns: { success: true }
 * 
 * GET  /api/legal-templates/system
 *   - Returns: { templates: [...systemTemplates] }
 * 
 * GET  /api/legal-templates/custom
 *   - Returns: { templates: [...userTemplates] }
 * 
 * POST /api/legal-templates/:id/duplicate
 *   - Body: { name, description, ... }
 *   - Returns: { template: {...} }
 * 
 * GET  /api/legal-templates/:id/versions
 *   - Returns: { versions: [...] }
 * 
 * See backend implementation guide for more details
 */

/**
 * STEP 5: Authentication Context
 * 
 * Ensure your AuthContext provides:
 * - token: JWT authentication token
 * - user: Current user object
 * 
 * Example:
 */

const { token, user } = useAuth();
// Used in templateService.js for API calls

/**
 * STEP 6: Theme Context
 * 
 * Ensure your ThemeContext provides:
 * - palette: Color palette object
 * 
 * Example:
 */

const { palette } = useTheme();
// Used for consistent theming across components

/**
 * STEP 7: Database Schema (Backend)
 * 
 * Create collections/tables:
 * 
 * legal_templates:
 * - id (string, primary key)
 * - name (string)
 * - category (string)
 * - description (text)
 * - countries (array of strings)
 * - ohada_act (string)
 * - applicable_articles (array)
 * - legal_version (string)
 * - model_version (string)
 * - variables (JSON object)
 * - mandatory_clauses (array)
 * - optional_clauses (array)
 * - conditional_clauses (array)
 * - metadata (JSON object)
 * - status (string: DRAFT, IN_REVIEW, VALIDATED, ARCHIVED)
 * - type (string: SYSTEM, CUSTOM)
 * - content (text)
 * - created_by (string, foreign key to users)
 * - created_at (timestamp)
 * - updated_at (timestamp)
 * - versions (array of version IDs)
 * - created_index on created_at
 * - type_index on type
 * - created_by_index on created_by
 * - fulltext_index on name, description
 * 
 * template_versions:
 * - id (string, primary key)
 * - template_id (string, foreign key)
 * - version_number (string)
 * - content (text)
 * - metadata (JSON)
 * - changelog (text)
 * - author (string)
 * - created_at (timestamp)
 * - is_archived (boolean)
 */

/**
 * STEP 8: Permissions & Authorization
 * 
 * Define backend permissions:
 * - view_templates: Can view all templates
 * - create_templates: Can create custom templates
 * - edit_templates: Can edit own templates
 * - delete_templates: Can delete own templates
 * - edit_system_templates: Admin only - edit system templates
 * - manage_templates: Admin only - manage all templates
 * 
 * Implement authorization checks in:
 * - template creation (only users with create_templates)
 * - template editing (only creator or admin)
 * - template deletion (only creator or admin)
 * - system template editing (admin only)
 */

/**
 * STEP 9: Testing
 * 
 * Test the following workflows:
 * 
 * 1. View all templates
 *    - Load system templates
 *    - Load custom templates
 *    - Filter by category
 *    - Filter by country
 *    - Search by keyword
 * 
 * 2. Template details
 *    - Open template preview
 *    - View all tabs (Overview, Clauses, Variables, Metadata)
 *    - Check variable information
 * 
 * 3. Create custom template
 *    - Duplicate system template
 *    - Edit custom template
 *    - Save changes
 *    - Verify version created
 * 
 * 4. Template operations
 *    - Delete template
 *    - Restore from version
 *    - Update status
 *    - Export template
 * 
 * 5. Search & filtering
 *    - Search by name
 *    - Filter combinations
 *    - Clear filters
 */

/**
 * STEP 10: Customization
 * 
 * To customize the module:
 * 
 * 1. Add custom templates to data/systemTemplates.js
 * 2. Modify colors in styles/templateList.css
 * 3. Add new categories in types.js
 * 4. Create custom components extending existing ones
 * 5. Add new API endpoints in services/templateService.js
 */

/**
 * TROUBLESHOOTING
 * 
 * Issue: Templates not loading
 * Solution: Check API endpoint is available and authentication token is valid
 * 
 * Issue: Styles not applying
 * Solution: Ensure all CSS files are imported and CSS variables are defined
 * 
 * Issue: Auth errors
 * Solution: Verify AuthContext is properly configured and token is being passed
 * 
 * Issue: Filter not working
 * Solution: Check filter values match the enum values in types.js
 * 
 * Issue: Template preview modal not appearing
 * Solution: Verify onClick handlers are properly connected
 */

/**
 * FILE IMPORTS REFERENCE
 * 
 * To use the module in your components:
 * 
 * // Import entire module
 * import { LegalTemplatesModule } from './modules/legal-templates';
 * 
 * // Import specific components
 * import { TemplateList, TemplatePreview } from './modules/legal-templates';
 * 
 * // Import hook
 * import { useTemplates } from './modules/legal-templates';
 * 
 * // Import types
 * import { TEMPLATE_CATEGORIES, OHADA_COUNTRIES } from './modules/legal-templates';
 * 
 * // Import service
 * import * as templateService from './modules/legal-templates';
 * 
 * // Import configuration
 * import { LEGAL_TEMPLATES_ROUTE, LEGAL_TEMPLATES_NAV_ITEM } from './modules/legal-templates/config';
 */

/**
 * ENVIRONMENT VARIABLES
 * 
 * No specific environment variables required, but ensure:
 * - REACT_APP_API_BASE_URL is set to your backend
 * - REACT_APP_AUTH_ENABLED is true
 */

/**
 * DEPENDENCIES
 * 
 * Required packages (should already be in your project):
 * - react (16.8+)
 * - react-dom
 * 
 * The module uses existing app dependencies:
 * - AuthContext (your authentication system)
 * - ThemeContext (your theming system)
 * - API service utilities
 * - Icon components
 * - AccessibleText components
 */

/**
 * VERSION HISTORY
 * 
 * v1.0.0 (Initial Release)
 * - Complete template management system
 * - System and custom templates
 * - Search and filtering
 * - Version control
 * - 11 pre-built system templates
 */

export const INSTALLATION_STEPS = [
  '1. Copy module files to frontend/src/modules/legal-templates/',
  '2. Add route to main router using LEGAL_TEMPLATES_ROUTE',
  '3. Add navigation item using LEGAL_TEMPLATES_NAV_ITEM',
  '4. Implement backend API endpoints',
  '5. Create database collections',
  '6. Set up permissions/authorization',
  '7. Verify authentication context is available',
  '8. Verify theme context is available',
  '9. Test all workflows',
  '10. Deploy and monitor'
];

export const API_ENDPOINTS = [
  'GET /api/legal-templates',
  'POST /api/legal-templates',
  'GET /api/legal-templates/:id',
  'PUT /api/legal-templates/:id',
  'DELETE /api/legal-templates/:id',
  'GET /api/legal-templates/system',
  'GET /api/legal-templates/custom',
  'POST /api/legal-templates/:id/duplicate',
  'GET /api/legal-templates/:id/versions',
  'GET /api/legal-templates/:id/versions/:versionId',
  'POST /api/legal-templates/:id/versions/:versionId/restore',
  'PATCH /api/legal-templates/:id/status'
];

export default {
  INSTALLATION_STEPS,
  API_ENDPOINTS
};
