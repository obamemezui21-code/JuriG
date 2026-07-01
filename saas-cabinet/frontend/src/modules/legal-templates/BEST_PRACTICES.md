/**
 * BEST PRACTICES GUIDE
 * OHADA Legal Templates Module
 */

/**
 * 1. COMPONENT USAGE
 * 
 * ✅ DO: Use the LegalTemplatesModule component as-is
 */
import { LegalTemplatesModule } from './modules/legal-templates';

export default function TemplatesPage() {
  return <LegalTemplatesModule />;
}

/**
 * ❌ DON'T: Modify component internals directly
 */

/**
 * 2. HOOK USAGE
 * 
 * ✅ DO: Use useTemplates hook to manage template state
 */
import { useTemplates } from './modules/legal-templates';

function MyComponent() {
  const {
    templates,
    loading,
    error,
    loadTemplates,
    createNewTemplate
  } = useTemplates();

  useEffect(() => {
    loadTemplates();
  }, []);

  return (
    // Render templates
  );
}

/**
 * ✅ DO: Handle loading and error states
 */
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;

/**
 * ❌ DON'T: Call API functions directly without using the hook
 */

/**
 * 3. SEARCH AND FILTERING
 * 
 * ✅ DO: Use enum values for category and type filters
 */
import { TEMPLATE_CATEGORIES, TEMPLATE_TYPE } from './modules/legal-templates';

const filters = {
  category: TEMPLATE_CATEGORIES.CONTRACTS,
  type: TEMPLATE_TYPE.SYSTEM
};

/**
 * ❌ DON'T: Use hardcoded string values
 */
const badFilters = {
  category: 'contracts', // Wrong!
  type: 'system'         // Wrong!
};

/**
 * 4. API CALLS
 * 
 * ✅ DO: Always include error handling
 */
try {
  const template = await templateService.fetchTemplateById(token, templateId);
  // Use template
} catch (error) {
  console.error('Error:', error);
  // Show user-friendly error message
  setError('Failed to load template');
}

/**
 * ✅ DO: Use templateService for all API operations
 */
import * as templateService from './modules/legal-templates';

await templateService.createTemplate(token, templateData);
await templateService.updateTemplate(token, templateId, updateData);
await templateService.deleteTemplate(token, templateId);

/**
 * ❌ DON'T: Make API calls directly without using the service
 */

/**
 * 5. TEMPLATE DATA STRUCTURE
 * 
 * ✅ DO: Follow the template schema
 */
const newTemplate = {
  name: 'Professional Contract',
  category: TEMPLATE_CATEGORIES.CONTRACTS,
  description: 'A comprehensive commercial contract template',
  countries: ['GA', 'CM'],
  ohada_act: 'ACT1',
  applicable_articles: ['Art. 105-146'],
  legal_version: '2022',
  model_version: '1.0.0',
  variables: {
    party_name: {
      label: 'Party Name',
      type: 'text',
      required: true,
      default_value: null
    }
  },
  mandatory_clauses: ['Terms', 'Conditions', 'Signatures'],
  optional_clauses: ['Dispute Resolution'],
  conditional_clauses: []
};

/**
 * ❌ DON'T: Add arbitrary fields not in the schema
 */

/**
 * 6. STYLING
 * 
 * ✅ DO: Use CSS variables for colors
 */
.custom-element {
  background: var(--gemini-brand);
  border: 1px solid var(--gemini-sidebar-mid);
  color: #42b883; /* Accent green */
}

/**
 * ✅ DO: Follow existing naming conventions
 */
.template-list__item { }
.template-card__header { }
.template-preview__modal { }

/**
 * ❌ DON'T: Use hardcoded colors
 */
.element {
  background: #17345f; /* Use CSS variable instead */
}

/**
 * 7. ACCESSIBILITY
 * 
 * ✅ DO: Use AccessibleText component for all text
 */
import AccessibleText from './components/AccessibleText';

<AccessibleText as="h2">Template List</AccessibleText>
<AccessibleText as="p">Description</AccessibleText>

/**
 * ✅ DO: Include aria-labels on interactive elements
 */
<button aria-label="Delete template">
  <Icon name="trash" />
</button>

/**
 * ✅ DO: Use semantic HTML
 */
<section> /* Instead of <div> */
<button>   /* Instead of <div onClick> */
<select>   /* Instead of custom dropdown */

/**
 * ❌ DON'T: Use generic divs for text content
 */

/**
 * 8. PERFORMANCE
 * 
 * ✅ DO: Use proper dependency arrays in useEffect
 */
useEffect(() => {
  loadTemplates();
}, [loadTemplates]); // Only when function changes

/**
 * ✅ DO: Memoize expensive operations
 */
const filteredTemplates = useMemo(
  () => templates.filter(/* filter logic */),
  [templates, filterCriteria]
);

/**
 * ❌ DON'T: Recalculate on every render
 */

/**
 * 9. STATE MANAGEMENT
 * 
 * ✅ DO: Use the useTemplates hook for shared state
 */
const { templates, customTemplates } = useTemplates();

/**
 * ✅ DO: Keep local state for UI-only concerns
 */
const [searchQuery, setSearchQuery] = useState('');
const [sortBy, setSortBy] = useState('name');

/**
 * ❌ DON'T: Duplicate API data in local state
 */

/**
 * 10. ERROR HANDLING
 * 
 * ✅ DO: Provide user-friendly error messages
 */
if (error) {
  return (
    <div className="error-message">
      <Icon name="alert" />
      <p>Unable to load templates. Please try again.</p>
    </div>
  );
}

/**
 * ✅ DO: Log detailed errors for debugging
 */
try {
  // operation
} catch (error) {
  console.error('Detailed error:', error);
  // Show simplified message to user
}

/**
 * ❌ DON'T: Show technical error messages to users
 */

/**
 * 11. FORM VALIDATION
 * 
 * ✅ DO: Validate all required fields
 */
const errors = {};
if (!templateData.name?.trim()) {
  errors.name = 'Name is required';
}
if (!templateData.category) {
  errors.category = 'Category is required';
}

/**
 * ✅ DO: Show validation errors clearly
 */
{errors.name && <span className="error">{errors.name}</span>}

/**
 * 12. RESPONSIVE DESIGN
 * 
 * ✅ DO: Test on all breakpoints
 */
/* Desktop (1400px+) */
/* Tablet (900px - 1399px) */
/* Mobile (< 600px) */

/**
 * ✅ DO: Use flexbox and grid for layouts
 */
.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

/**
 * ❌ DON'T: Use fixed widths
 */

/**
 * 13. SECURITY
 * 
 * ✅ DO: Always include authentication token
 */
await templateService.fetchTemplates(token);

/**
 * ✅ DO: Sanitize user input
 */
import DOMPurify from 'dompurify';
const cleanContent = DOMPurify.sanitize(userContent);

/**
 * ✅ DO: Validate data types
 */
if (typeof template.name !== 'string') {
  throw new Error('Invalid template data');
}

/**
 * ❌ DON'T: Trust user input without validation
 */

/**
 * 14. DOCUMENTATION
 * 
 * ✅ DO: Add JSDoc comments to functions
 */
/**
 * Creates a new template
 * @param {Object} templateData - Template data
 * @param {string} templateData.name - Template name
 * @param {string} templateData.category - Template category
 * @returns {Promise<Object>} - Created template
 */
export async function createTemplate(templateData) { }

/**
 * ✅ DO: Add comments for complex logic
 */
// Filter templates by category first, then by country
const filtered = templates
  .filter(t => t.category === selectedCategory)
  .filter(t => t.countries.includes(selectedCountry));

/**
 * 15. TESTING
 * 
 * ✅ DO: Write tests for critical functions
 */
describe('templateService', () => {
  test('should fetch templates with filters', async () => {
    const templates = await templateService.fetchTemplates(
      token,
      { category: 'CONTRACTS' }
    );
    expect(templates).toHaveLength(3);
  });
});

/**
 * ✅ DO: Test components with user interactions
 */
test('should display templates after clicking search', async () => {
  const { getByRole } = render(<TemplateList />);
  const button = getByRole('button', { name: /search/i });
  await userEvent.click(button);
  expect(getByRole('list')).toBeInTheDocument();
});

/**
 * COMMON MISTAKES TO AVOID
 * 
 * 1. Not handling loading states
 *    - Always check loading before rendering data
 * 
 * 2. Forgetting error handling
 *    - Every API call should have try-catch
 * 
 * 3. Using hardcoded values
 *    - Use enums from types.js instead
 * 
 * 4. Modifying component internals
 *    - Extend functionality through props and hooks, not modifications
 * 
 * 5. Direct API calls without service
 *    - Always use templateService for consistency
 * 
 * 6. Not following naming conventions
 *    - Use BEM for CSS class names
 * 
 * 7. Neglecting accessibility
 *    - Use semantic HTML and ARIA labels
 * 
 * 8. Hardcoded colors
 *    - Use CSS variables for theming
 * 
 * 9. Missing dependencies in useEffect
 *    - Always specify all dependencies
 * 
 * 10. Not testing edge cases
 *     - Test empty states, errors, loading, etc.
 */

/**
 * PERFORMANCE TIPS
 * 
 * 1. Use pagination for large template lists
 * 2. Implement lazy loading for images and content
 * 3. Memoize expensive calculations
 * 4. Use React.memo for list item components
 * 5. Optimize CSS selectors
 * 6. Use CSS grid instead of nested flexbox
 * 7. Minimize DOM operations
 * 8. Use debouncing for search input
 * 9. Cache API responses when appropriate
 * 10. Profile with React DevTools
 */

/**
 * DEPLOYMENT CHECKLIST
 * 
 * ✅ Backend API endpoints implemented
 * ✅ Database schema created
 * ✅ Authentication configured
 * ✅ Authorization rules set
 * ✅ All components tested
 * ✅ Responsive design verified
 * ✅ Accessibility audit passed
 * ✅ Error handling tested
 * ✅ Performance optimized
 * ✅ Documentation complete
 * ✅ Team trained on usage
 */

export const BEST_PRACTICES = {
  components: 'Use components as-is, extend through props and hooks',
  hooks: 'Use useTemplates for all template state management',
  api: 'Always use templateService, never make direct API calls',
  types: 'Use enum values from types.js, avoid hardcoded strings',
  styles: 'Use CSS variables and follow BEM naming convention',
  accessibility: 'Use AccessibleText, semantic HTML, and ARIA labels',
  performance: 'Memoize, optimize dependencies, implement pagination',
  security: 'Validate input, sanitize output, include auth tokens',
  testing: 'Test components, functions, edge cases, and error scenarios',
  documentation: 'Add JSDoc comments, explain complex logic'
};
