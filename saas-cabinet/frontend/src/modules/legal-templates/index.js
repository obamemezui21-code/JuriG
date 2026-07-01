/**
 * Legal Templates Module - Entry Point
 * Export all public components, hooks, and utilities
 */

// Components
export { default as LegalTemplatesModule } from './components/LegalTemplatesModule';
export { default as TemplateList } from './components/TemplateList';
export { default as TemplatePreview } from './components/TemplatePreview';

// Hooks
export { useTemplates as default } from './hooks/useTemplates';
export { useTemplates } from './hooks/useTemplates';

// Services
export * as templateService from './services/templateService';

// Types & Constants
export {
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
} from './types';

// System Templates
export {
  SYSTEM_TEMPLATES,
  getSystemTemplateById,
  getSystemTemplatesByCategory,
  getSystemTemplatesByCountry
} from './data/systemTemplates';
