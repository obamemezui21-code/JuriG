# OHADA Legal Templates Library Module

## Overview

The OHADA Legal Templates Library is a comprehensive module for managing legal document templates that comply with OHADA (Organization for the Harmonization of Business Law in Africa) standards. It provides a professional interface for accessing, creating, and managing legal templates used for document generation.

## Features

### 1. **Template Management**
- **System Models**: Official templates maintained by the application (protected, read-only)
- **Custom Models**: User-created templates that can be customized and modified
- Full CRUD operations for custom templates
- Template duplication from system or custom models

### 2. **Advanced Search & Filtering**
- Search by template name, description, or OHADA act reference
- Filter by:
  - Category (Company, Contracts, Financial, Delivery, Legal Acts, Correspondence)
  - Country (all 23 OHADA member states)
  - Template type (System or Custom)
  - Status (Draft, In Review, Validated, Archived)
- Real-time search results with result count

### 3. **Template Preview**
- Comprehensive preview modal with multiple tabs:
  - **Overview**: Legal information, applicable articles, countries
  - **Clauses**: Mandatory, optional, and conditional clauses
  - **Variables**: All dynamic variables with types and requirements
  - **Metadata**: Template information and custom metadata
- Quick actions: Preview, Edit, Delete, Duplicate

### 4. **Version Control**
- Complete version history for each template
- Track changes with changelog
- Restore previous versions
- Author and date tracking

### 5. **Legal Compliance**
- **OHADA Uniform Acts**: References to specific acts
- **Applicable Articles**: Legal article references
- **Member Countries**: Support for all 23 OHADA member states
- **Legal Versioning**: Track legal changes and updates

## Architecture

### Directory Structure

```
frontend/src/modules/legal-templates/
├── components/
│   ├── LegalTemplatesModule.jsx    # Main module component
│   ├── TemplateList.jsx              # Template listing and filtering
│   └── TemplatePreview.jsx           # Template detail preview
├── services/
│   └── templateService.js            # API communication service
├── hooks/
│   └── useTemplates.js               # Custom hook for state management
├── styles/
│   ├── legalTemplatesModule.css      # Main module styles
│   ├── templateList.css              # List component styles
│   └── templatePreview.css           # Preview component styles
├── data/
│   └── systemTemplates.js            # Pre-built system templates
└── types.js                           # Type definitions and constants
```

### Component Hierarchy

```
LegalTemplatesModule (Main)
├── View Selector (All/System/Custom)
├── TemplateList
│   ├── Search Bar
│   ├── Filters (Category, Country, Type)
│   └── Template Cards (Grid/List View)
└── TemplatePreview (Modal)
    ├── Tabs (Overview, Clauses, Variables, Metadata)
    └── Actions (Close, Edit, Duplicate)
```

## System Templates Included

The module includes 11 pre-built system templates:

1. **company-bylaws-sarl** - SARL Private Limited Company Bylaws
2. **company-bylaws-sa** - SA Public Limited Company Bylaws
3. **pv-shareholders-meeting** - Shareholders Meeting Minutes
4. **commercial-contract** - General Commercial Contract
5. **invoice** - Commercial Invoice
6. **quotation** - Quotation/Offer
7. **delivery-receipt** - Delivery Note/Packing Slip
8. **purchase-order** - Purchase Order
9. **receipt** - Payment Receipt
10. **power-of-attorney** - Legal Power of Attorney
11. **demand-letter** - Legal Demand Letter/Cease & Desist

Each template includes:
- Category classification
- OHADA act reference
- Applicable legal articles
- Dynamic variables with types
- Mandatory, optional, and conditional clauses
- Support for multiple countries

## API Integration

The module expects the following backend endpoints:

```javascript
// Template Management
GET    /api/legal-templates                    // Get all templates
POST   /api/legal-templates                    // Create template
GET    /api/legal-templates/:id                // Get specific template
PUT    /api/legal-templates/:id                // Update template
DELETE /api/legal-templates/:id                // Delete template

// System Templates
GET    /api/legal-templates/system             // Get system templates
GET    /api/legal-templates/system?category=:cat  // Get by category

// Custom Templates
GET    /api/legal-templates/custom             // Get user's custom templates

// Template Operations
POST   /api/legal-templates/:id/duplicate      // Duplicate template
GET    /api/legal-templates/:id/versions       // Get version history
GET    /api/legal-templates/:id/versions/:vid  // Get specific version
POST   /api/legal-templates/:id/versions/:vid/restore // Restore version
PATCH  /api/legal-templates/:id/status        // Update status

// Search & Export
GET    /api/legal-templates/search             // Search templates
GET    /api/legal-templates/:id/export         // Export template
POST   /api/legal-templates/import             // Import template
GET    /api/legal-templates/stats              // Get statistics
```

## Usage

### Basic Integration

```jsx
import LegalTemplatesModule from './modules/legal-templates/components/LegalTemplatesModule';

export default function App() {
  return (
    <div>
      <LegalTemplatesModule />
    </div>
  );
}
```

### Using the Hook

```jsx
import useTemplates from './modules/legal-templates/hooks/useTemplates';

export default function MyComponent() {
  const {
    templates,
    systemTemplates,
    customTemplates,
    loading,
    error,
    loadTemplates,
    createNewTemplate,
    duplicateExistingTemplate
  } = useTemplates();

  useEffect(() => {
    loadTemplates();
  }, []);

  return (
    <div>
      {/* Use templates data */}
    </div>
  );
}
```

### Creating a Custom Template

```jsx
const newTemplate = await createNewTemplate({
  name: 'My Custom Contract',
  category: 'CONTRACTS',
  description: 'Custom commercial contract',
  countries: ['GA', 'CM'],
  ohada_act: 'ACT1',
  applicable_articles: ['Art. 105-110'],
  legal_version: '2022',
  model_version: '1.0.0',
  variables: {
    party_a_name: { label: 'Party A Name', type: 'text', required: true },
    party_b_name: { label: 'Party B Name', type: 'text', required: true }
  },
  mandatory_clauses: ['Parties', 'Consideration', 'Signatures'],
  optional_clauses: ['Dispute Resolution'],
  conditional_clauses: []
});
```

## Data Model

### Template Schema

```javascript
{
  id: string,                      // Unique identifier
  name: string,                    // Template name
  category: string,                // Template category (enum)
  description: string,             // Description
  countries: string[],             // OHADA member countries
  ohada_act: string,              // Reference Uniform Act
  applicable_articles: string[],   // Legal article references
  legal_version: string,           // Legal framework version
  model_version: string,           // Template version
  variables: {                     // Dynamic variables
    [key: string]: {
      label: string,
      type: string,
      required: boolean,
      default_value: any,
      options: any
    }
  },
  mandatory_clauses: string[],     // Required clauses
  optional_clauses: string[],      // Optional clauses
  conditional_clauses: string[],   // Conditional clauses
  metadata: Object,                // Custom metadata
  status: string,                  // Draft, In Review, Validated, Archived
  type: string,                    // SYSTEM or CUSTOM
  content: string,                 // HTML content
  created_by: string,              // Creator user ID
  created_at: Date,                // Creation date
  updated_at: Date,                // Last update
  versions: string[]               // Version history IDs
}
```

## Constants

### Template Categories
- `COMPANY` - Constitutive Acts
- `CONTRACTS` - Contracts
- `FINANCIAL` - Financial Documents
- `DELIVERY` - Delivery Documents
- `LEGAL_ACTS` - Legal Acts
- `CORRESPONDENCE` - Correspondence
- `OTHER` - Other

### Template Status
- `DRAFT` - Draft state
- `IN_REVIEW` - Under review
- `VALIDATED` - Approved
- `ARCHIVED` - Archived

### Template Types
- `SYSTEM` - Application-provided templates
- `CUSTOM` - User-created templates

### OHADA Member Countries
All 23 member countries supported: Cameroon, Congo, DRC, Gabon, Equatorial Guinea, Côte d'Ivoire, CAR, Madagascar, Mali, Niger, Senegal, Togo, Benin, Burkina Faso, The Gambia, Guinea-Bissau, Comoros, Cape Verde, Djibouti, Guinea, Liberia, Mauritania, Saint Helena

## Styling

The module uses CSS variables that integrate with the application's theme system:

```css
--gemini-brand: #17345f
--gemini-sidebar-start: #0c1525
--gemini-sidebar-mid: #16243d
--gemini-sidebar-end: #22375d
```

All styles are responsive and support:
- Desktop (1400px+)
- Tablet (900px - 1399px)
- Mobile (< 600px)

## Future Enhancements

1. **Template Editor**: Rich text editor for creating/editing templates
2. **Document Generation**: Generate final documents from templates
3. **Collaboration**: Share templates with team members
4. **Advanced Analytics**: Usage statistics and insights
5. **Integration**: Connect with document management systems
6. **API Access**: Expose templates via API for external systems
7. **Multi-language**: Support for multiple languages
8. **Digital Signatures**: Built-in signature functionality
9. **PDF Export**: Direct PDF generation
10. **Template Library**: Marketplace for template sharing

## Error Handling

All API calls include error handling with user-friendly messages:

```javascript
try {
  const templates = await fetchTemplates(token);
} catch (error) {
  // Error automatically captured and displayed
  console.error(error.message);
}
```

## Performance

- Lazy loading of templates
- Pagination support (future)
- Optimized re-renders with React hooks
- Efficient search and filtering
- Cached template data

## Accessibility

- ARIA labels on all interactive elements
- Semantic HTML structure
- Keyboard navigation support
- High contrast colors
- AccessibleText components throughout

## Security

- System templates are read-only (cannot be deleted)
- Custom templates are user-specific
- API authentication required
- Input validation on all forms
- XSS protection

## Database Requirements

Backend should maintain:
- Templates collection with indexing
- Template versions collection
- User templates with ownership
- Full-text search capability

## Support

For issues, feature requests, or documentation updates, please contact the development team.

---

**Module Version**: 1.0.0  
**Last Updated**: 2024  
**OHADA Compliance**: Yes
