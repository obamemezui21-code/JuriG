/**
 * Types and Schemas for Legal Templates Module
 * OHADA-compliant legal documents library
 */

// Template Categories
export const TEMPLATE_CATEGORIES = {
  COMPANY: 'COMPANY',
  CONTRACTS: 'CONTRACTS',
  FINANCIAL: 'FINANCIAL',
  DELIVERY: 'DELIVERY',
  LEGAL_ACTS: 'LEGAL_ACTS',
  CORRESPONDENCE: 'CORRESPONDENCE',
  OTHER: 'OTHER'
};

export const CATEGORY_LABELS = {
  COMPANY: 'Constitutive Acts',
  CONTRACTS: 'Contracts',
  FINANCIAL: 'Financial Documents',
  DELIVERY: 'Delivery Documents',
  LEGAL_ACTS: 'Legal Acts',
  CORRESPONDENCE: 'Correspondence',
  OTHER: 'Other'
};

// OHADA Uniform Acts
export const OHADA_ACTS = {
  ACT1: 'Act 1: General Commercial Law',
  ACT2: 'Act 2: Company Law',
  ACT3: 'Act 3: Organization and Procedures',
  ACT4: 'Act 4: Labor Law',
  ACT5: 'Act 5: Secured Transactions',
  ACT6: 'Act 6: Insolvency Proceedings',
  ACT7: 'Act 7: Contract for Carriage',
  ACT8: 'Act 8: Factoring'
};

// OHADA Member Countries
export const OHADA_COUNTRIES = [
  { code: 'CM', name: 'Cameroon' },
  { code: 'CG', name: 'Congo' },
  { code: 'CD', name: 'Democratic Republic of Congo' },
  { code: 'GA', name: 'Gabon' },
  { code: 'GQ', name: 'Equatorial Guinea' },
  { code: 'CI', name: 'Côte d\'Ivoire' },
  { code: 'CF', name: 'Central African Republic' },
  { code: 'MG', name: 'Madagascar' },
  { code: 'ML', name: 'Mali' },
  { code: 'NE', name: 'Niger' },
  { code: 'SN', name: 'Senegal' },
  { code: 'TG', name: 'Togo' },
  { code: 'BJ', name: 'Benin' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'GM', name: 'The Gambia' },
  { code: 'GW', name: 'Guinea-Bissau' },
  { code: 'KM', name: 'Comoros' },
  { code: 'CV', name: 'Cape Verde' },
  { code: 'DJ', name: 'Djibouti' },
  { code: 'GN', name: 'Guinea' },
  { code: 'LR', name: 'Liberia' },
  { code: 'MR', name: 'Mauritania' },
  { code: 'SH', name: 'Saint Helena' }
];

// Template Status
export const TEMPLATE_STATUS = {
  DRAFT: 'DRAFT',
  IN_REVIEW: 'IN_REVIEW',
  VALIDATED: 'VALIDATED',
  ARCHIVED: 'ARCHIVED'
};

export const STATUS_LABELS = {
  DRAFT: 'Draft',
  IN_REVIEW: 'In Review',
  VALIDATED: 'Validated',
  ARCHIVED: 'Archived'
};

export const STATUS_COLORS = {
  DRAFT: '#ef9a9a',
  IN_REVIEW: '#fff9c4',
  VALIDATED: '#c8e6c9',
  ARCHIVED: '#b0bec5'
};

// Template Type
export const TEMPLATE_TYPE = {
  SYSTEM: 'SYSTEM',     // Provided by the application
  CUSTOM: 'CUSTOM'       // Created by users
};

export const TYPE_LABELS = {
  SYSTEM: 'System Model',
  CUSTOM: 'Custom Model'
};

/**
 * Legal Template Schema
 * @typedef {Object} LegalTemplate
 * @property {string} id - Unique identifier
 * @property {string} name - Template name
 * @property {string} category - Template category
 * @property {string} description - Template description
 * @property {string[]} countries - Applicable countries (OHADA)
 * @property {string} ohada_act - Reference Uniform Act
 * @property {string[]} applicable_articles - Applicable articles
 * @property {string} legal_version - Legal version number
 * @property {string} model_version - Model version number
 * @property {Object} variables - Dynamic variables/placeholders
 * @property {string[]} mandatory_clauses - Mandatory clauses
 * @property {string[]} optional_clauses - Optional clauses
 * @property {string[]} conditional_clauses - Conditional clauses
 * @property {Object} metadata - Additional metadata
 * @property {string} status - Template status
 * @property {string} type - Template type (SYSTEM or CUSTOM)
 * @property {string} content - Template HTML content
 * @property {string} created_by - Creator user ID
 * @property {Date} created_at - Creation timestamp
 * @property {Date} updated_at - Last update timestamp
 * @property {string[]} versions - Version history IDs
 */

/**
 * Template Version Schema
 * @typedef {Object} TemplateVersion
 * @property {string} id - Version ID
 * @property {string} template_id - Parent template ID
 * @property {string} version_number - Version number (e.g., "1.0.0")
 * @property {string} content - Template content at this version
 * @property {Object} metadata - Changes in this version
 * @property {string} changelog - Description of changes
 * @property {string} author - User ID of the modifier
 * @property {Date} created_at - Version creation date
 * @property {boolean} is_archived - Whether version is archived
 */

/**
 * Template Variable Schema
 * @typedef {Object} TemplateVariable
 * @property {string} key - Variable key (placeholder name)
 * @property {string} label - Display label
 * @property {string} type - Data type (text, date, number, select, etc.)
 * @property {string} description - Variable description
 * @property {*} default_value - Default value
 * @property {boolean} required - Is required
 * @property {Object} options - Select options if applicable
 * @property {string} validation_pattern - Regex pattern for validation
 * @property {string} help_text - Help text for users
 */

export const TEMPLATE_VARIABLE_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  SELECT: 'select',
  CHECKBOX: 'checkbox',
  TEXTAREA: 'textarea',
  EMAIL: 'email',
  PHONE: 'phone',
  CURRENCY: 'currency',
  PERCENTAGE: 'percentage'
};

/**
 * Clause Schema
 * @typedef {Object} Clause
 * @property {string} id - Clause ID
 * @property {string} title - Clause title
 * @property {string} content - Clause content (HTML)
 * @property {string} type - Type (mandatory, optional, conditional)
 * @property {string} condition - Condition for conditional clauses
 * @property {string[]} applicable_countries - Applicable countries
 * @property {string} ohada_reference - OHADA Act reference
 * @property {string[]} keywords - Search keywords
 */

export default {
  TEMPLATE_CATEGORIES,
  CATEGORY_LABELS,
  OHADA_ACTS,
  OHADA_COUNTRIES,
  TEMPLATE_STATUS,
  STATUS_LABELS,
  STATUS_COLORS,
  TEMPLATE_TYPE,
  TYPE_LABELS,
  TEMPLATE_VARIABLE_TYPES
};
