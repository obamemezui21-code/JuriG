/**
 * TemplateList Component
 * Displays list of legal templates with search and filtering
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import useTemplates from '../hooks/useTemplates';
import { 
  TEMPLATE_CATEGORIES, 
  CATEGORY_LABELS, 
  TEMPLATE_TYPE, 
  TYPE_LABELS,
  OHADA_COUNTRIES 
} from '../types';
import AccessibleText from '../../../components/AccessibleText';
import { Icon } from '../../../utils/icons';
import '../styles/templateList.css';

const TemplateList = ({ onSelectTemplate, filterType = null }) => {
  const { palette } = useTheme();
  const { 
    templates, 
    systemTemplates, 
    customTemplates,
    loading, 
    error,
    loadTemplates,
    loadSystemTemplates,
    loadCustomTemplates,
    deleteExistingTemplate
  } = useTemplates();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedType, setSelectedType] = useState(filterType || '');
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  // Load templates on mount
  useEffect(() => {
    if (filterType === TEMPLATE_TYPE.SYSTEM) {
      loadSystemTemplates();
    } else if (filterType === TEMPLATE_TYPE.CUSTOM) {
      loadCustomTemplates();
    } else {
      loadTemplates();
    }
  }, [filterType]);

  // Filter templates
  useEffect(() => {
    let items = templates.length > 0 ? templates : [...systemTemplates, ...customTemplates];
    
    if (selectedCategory) {
      items = items.filter(t => t.category === selectedCategory);
    }
    
    if (selectedType) {
      items = items.filter(t => t.type === selectedType);
    }
    
    if (selectedCountry) {
      items = items.filter(t => t.countries.includes(selectedCountry));
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.ohada_act.toLowerCase().includes(query)
      );
    }
    
    setFilteredTemplates(items);
  }, [templates, systemTemplates, customTemplates, searchQuery, selectedCategory, selectedCountry, selectedType]);

  const handleDelete = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteExistingTemplate(templateId);
      } catch (err) {
        console.error('Error deleting template:', err);
      }
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedCountry('');
    setSelectedType(filterType || '');
  };

  return (
    <div className="template-list">
      {/* Header */}
      <div className="template-list__header">
        <div className="template-list__title">
          <Icon name="file-text" size={24} style={{ color: palette.brand }} />
          <AccessibleText as="h2" className="template-list__heading">
            Legal Templates Library
          </AccessibleText>
        </div>
        <div className="template-list__view-toggle">
          <button
            className={`template-list__view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <Icon name="grid" size={20} />
          </button>
          <button
            className={`template-list__view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <Icon name="list" size={20} />
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="template-list__controls">
        {/* Search Box */}
        <div className="template-list__search">
          <Icon name="search" size={18} className="template-list__search-icon" />
          <input
            type="text"
            placeholder="Search templates by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="template-list__search-input"
            aria-label="Search templates"
          />
        </div>

        {/* Filter Row */}
        <div className="template-list__filters">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="template-list__filter-select"
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          {/* Country Filter */}
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="template-list__filter-select"
            aria-label="Filter by country"
          >
            <option value="">All Countries</option>
            {OHADA_COUNTRIES.map(country => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          {!filterType && (
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="template-list__filter-select"
              aria-label="Filter by type"
            >
              <option value="">All Types</option>
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          )}

          {/* Clear Button */}
          <button
            onClick={clearFilters}
            className="template-list__clear-btn"
            title="Clear all filters"
          >
            <Icon name="x" size={18} />
            Clear Filters
          </button>
        </div>

        {/* Results Count */}
        <div className="template-list__results-info">
          <AccessibleText as="p" className="template-list__count">
            Found {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
          </AccessibleText>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="template-list__loading">
          <div className="template-list__spinner"></div>
          <AccessibleText as="p">Loading templates...</AccessibleText>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="template-list__error">
          <Icon name="alert-circle" size={20} />
          <AccessibleText as="p">{error}</AccessibleText>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredTemplates.length === 0 && (
        <div className="template-list__empty">
          <Icon name="inbox" size={48} />
          <AccessibleText as="h3">No templates found</AccessibleText>
          <AccessibleText as="p">
            Try adjusting your search or filters
          </AccessibleText>
        </div>
      )}

      {/* Templates Grid/List */}
      <div className={`template-list__grid ${viewMode === 'list' ? 'template-list__grid--list' : ''}`}>
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            className={`template-card ${viewMode === 'list' ? 'template-card--list' : ''}`}
            onClick={() => onSelectTemplate && onSelectTemplate(template)}
          >
            {/* Badge */}
            <div className="template-card__badges">
              <span className={`template-card__badge template-card__badge--${template.type.toLowerCase()}`}>
                {TYPE_LABELS[template.type]}
              </span>
              {template.status !== 'DRAFT' && (
                <span className={`template-card__badge template-card__badge--${template.status.toLowerCase()}`}>
                  {template.status}
                </span>
              )}
            </div>

            {/* Icon */}
            <div className="template-card__icon">
              <Icon name="file-text" size={40} style={{ color: palette.brand }} />
            </div>

            {/* Content */}
            <div className="template-card__content">
              <AccessibleText as="h3" className="template-card__name">
                {template.name}
              </AccessibleText>
              <AccessibleText as="p" className="template-card__description">
                {template.description}
              </AccessibleText>

              {/* Meta */}
              <div className="template-card__meta">
                <span className="template-card__category">
                  {CATEGORY_LABELS[template.category]}
                </span>
                <span className="template-card__act">
                  {template.ohada_act}
                </span>
              </div>

              {/* Countries */}
              <div className="template-card__countries">
                {template.countries.slice(0, 3).map(code => (
                  <span key={code} className="template-card__country" title={code}>
                    {code}
                  </span>
                ))}
                {template.countries.length > 3 && (
                  <span className="template-card__country-more">
                    +{template.countries.length - 3}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            {viewMode === 'list' && (
              <div className="template-card__actions">
                <button
                  className="template-card__action-btn template-card__action-btn--preview"
                  title="Preview"
                >
                  <Icon name="eye" size={18} />
                </button>
                {template.type === TEMPLATE_TYPE.CUSTOM && (
                  <>
                    <button
                      className="template-card__action-btn template-card__action-btn--edit"
                      title="Edit"
                    >
                      <Icon name="edit-2" size={18} />
                    </button>
                    <button
                      className="template-card__action-btn template-card__action-btn--delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(template.id);
                      }}
                      title="Delete"
                    >
                      <Icon name="trash-2" size={18} />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateList;
