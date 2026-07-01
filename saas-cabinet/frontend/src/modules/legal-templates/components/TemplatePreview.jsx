/**
 * TemplatePreview Component
 * Displays detailed template information and preview
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { 
  TEMPLATE_TYPE, 
  TYPE_LABELS, 
  TEMPLATE_STATUS,
  STATUS_LABELS,
  OHADA_ACTS
} from '../types';
import AccessibleText from '../../../components/AccessibleText';
import { Icon } from '../../../utils/icons';
import '../styles/templatePreview.css';

const TemplatePreview = ({ template, onClose, onEdit, onDuplicate }) => {
  const { palette } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');

  if (!template) {
    return null;
  }

  return (
    <div className="template-preview" onClick={onClose}>
      <div className="template-preview__modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="template-preview__header">
          <div className="template-preview__title-section">
            <Icon name="file-text" size={28} style={{ color: palette.brand }} />
            <div>
              <AccessibleText as="h2" className="template-preview__title">
                {template.name}
              </AccessibleText>
              <AccessibleText as="p" className="template-preview__subtitle">
                {template.description}
              </AccessibleText>
            </div>
          </div>
          <button
            className="template-preview__close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="x" size={24} />
          </button>
        </div>

        {/* Badges */}
        <div className="template-preview__badges">
          <span className={`template-preview__badge template-preview__badge--${template.type.toLowerCase()}`}>
            {TYPE_LABELS[template.type]}
          </span>
          <span className={`template-preview__badge template-preview__badge--${template.status.toLowerCase()}`}>
            {STATUS_LABELS[template.status]}
          </span>
        </div>

        {/* Tabs */}
        <div className="template-preview__tabs">
          <button
            className={`template-preview__tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`template-preview__tab ${activeTab === 'clauses' ? 'active' : ''}`}
            onClick={() => setActiveTab('clauses')}
          >
            Clauses
          </button>
          <button
            className={`template-preview__tab ${activeTab === 'variables' ? 'active' : ''}`}
            onClick={() => setActiveTab('variables')}
          >
            Variables
          </button>
          <button
            className={`template-preview__tab ${activeTab === 'metadata' ? 'active' : ''}`}
            onClick={() => setActiveTab('metadata')}
          >
            Metadata
          </button>
        </div>

        {/* Content */}
        <div className="template-preview__content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="template-preview__tab-content">
              <div className="template-preview__section">
                <AccessibleText as="h3" className="template-preview__section-title">
                  Legal Information
                </AccessibleText>
                <div className="template-preview__info-grid">
                  <div className="template-preview__info-item">
                    <AccessibleText as="p" className="template-preview__info-label">
                      Uniform Act
                    </AccessibleText>
                    <AccessibleText as="p" className="template-preview__info-value">
                      {OHADA_ACTS[template.ohada_act] || template.ohada_act}
                    </AccessibleText>
                  </div>
                  <div className="template-preview__info-item">
                    <AccessibleText as="p" className="template-preview__info-label">
                      Legal Version
                    </AccessibleText>
                    <AccessibleText as="p" className="template-preview__info-value">
                      {template.legal_version}
                    </AccessibleText>
                  </div>
                  <div className="template-preview__info-item">
                    <AccessibleText as="p" className="template-preview__info-label">
                      Model Version
                    </AccessibleText>
                    <AccessibleText as="p" className="template-preview__info-value">
                      {template.model_version}
                    </AccessibleText>
                  </div>
                </div>
              </div>

              <div className="template-preview__section">
                <AccessibleText as="h3" className="template-preview__section-title">
                  Applicable Articles
                </AccessibleText>
                <div className="template-preview__articles">
                  {template.applicable_articles && template.applicable_articles.map((article, idx) => (
                    <span key={idx} className="template-preview__article-tag">
                      {article}
                    </span>
                  ))}
                </div>
              </div>

              <div className="template-preview__section">
                <AccessibleText as="h3" className="template-preview__section-title">
                  Applicable Countries
                </AccessibleText>
                <div className="template-preview__countries">
                  {template.countries && template.countries.map(country => (
                    <span key={country} className="template-preview__country-tag">
                      {country}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Clauses Tab */}
          {activeTab === 'clauses' && (
            <div className="template-preview__tab-content">
              {template.mandatory_clauses && template.mandatory_clauses.length > 0 && (
                <div className="template-preview__section">
                  <AccessibleText as="h3" className="template-preview__section-title">
                    Mandatory Clauses
                  </AccessibleText>
                  <ul className="template-preview__clause-list">
                    {template.mandatory_clauses.map((clause, idx) => (
                      <li key={idx} className="template-preview__clause-item">
                        <Icon name="check-circle" size={18} className="template-preview__clause-icon" />
                        <AccessibleText as="span">{clause}</AccessibleText>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {template.optional_clauses && template.optional_clauses.length > 0 && (
                <div className="template-preview__section">
                  <AccessibleText as="h3" className="template-preview__section-title">
                    Optional Clauses
                  </AccessibleText>
                  <ul className="template-preview__clause-list">
                    {template.optional_clauses.map((clause, idx) => (
                      <li key={idx} className="template-preview__clause-item">
                        <Icon name="circle" size={18} className="template-preview__clause-icon" />
                        <AccessibleText as="span">{clause}</AccessibleText>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {template.conditional_clauses && template.conditional_clauses.length > 0 && (
                <div className="template-preview__section">
                  <AccessibleText as="h3" className="template-preview__section-title">
                    Conditional Clauses
                  </AccessibleText>
                  <ul className="template-preview__clause-list">
                    {template.conditional_clauses.map((clause, idx) => (
                      <li key={idx} className="template-preview__clause-item">
                        <Icon name="git-branch" size={18} className="template-preview__clause-icon" />
                        <AccessibleText as="span">{clause}</AccessibleText>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Variables Tab */}
          {activeTab === 'variables' && (
            <div className="template-preview__tab-content">
              {template.variables && Object.keys(template.variables).length > 0 ? (
                <div className="template-preview__variables-table">
                  <div className="template-preview__table-header">
                    <div className="template-preview__table-cell">Variable</div>
                    <div className="template-preview__table-cell">Type</div>
                    <div className="template-preview__table-cell">Required</div>
                    <div className="template-preview__table-cell">Default</div>
                  </div>
                  {Object.entries(template.variables).map(([key, config]) => (
                    <div key={key} className="template-preview__table-row">
                      <div className="template-preview__table-cell">
                        <code>{key}</code>
                        <small>{config.label}</small>
                      </div>
                      <div className="template-preview__table-cell">{config.type}</div>
                      <div className="template-preview__table-cell">
                        {config.required ? 'Yes' : 'No'}
                      </div>
                      <div className="template-preview__table-cell">
                        {config.default_value || '-'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <AccessibleText as="p" className="template-preview__empty-state">
                  No variables defined for this template
                </AccessibleText>
              )}
            </div>
          )}

          {/* Metadata Tab */}
          {activeTab === 'metadata' && (
            <div className="template-preview__tab-content">
              <div className="template-preview__section">
                <AccessibleText as="h3" className="template-preview__section-title">
                  Template Information
                </AccessibleText>
                <div className="template-preview__info-grid">
                  <div className="template-preview__info-item">
                    <AccessibleText as="p" className="template-preview__info-label">
                      Template ID
                    </AccessibleText>
                    <AccessibleText as="p" className="template-preview__info-value">
                      <code>{template.id}</code>
                    </AccessibleText>
                  </div>
                  <div className="template-preview__info-item">
                    <AccessibleText as="p" className="template-preview__info-label">
                      Type
                    </AccessibleText>
                    <AccessibleText as="p" className="template-preview__info-value">
                      {TYPE_LABELS[template.type]}
                    </AccessibleText>
                  </div>
                  <div className="template-preview__info-item">
                    <AccessibleText as="p" className="template-preview__info-label">
                      Status
                    </AccessibleText>
                    <AccessibleText as="p" className="template-preview__info-value">
                      {STATUS_LABELS[template.status]}
                    </AccessibleText>
                  </div>
                </div>
              </div>

              {template.metadata && (
                <div className="template-preview__section">
                  <AccessibleText as="h3" className="template-preview__section-title">
                    Custom Metadata
                  </AccessibleText>
                  <div className="template-preview__metadata">
                    {Object.entries(template.metadata).map(([key, value]) => (
                      <div key={key} className="template-preview__metadata-item">
                        <AccessibleText as="span" className="template-preview__metadata-key">
                          {key}:
                        </AccessibleText>
                        <AccessibleText as="span" className="template-preview__metadata-value">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </AccessibleText>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="template-preview__actions">
          <button
            className="template-preview__btn template-preview__btn--secondary"
            onClick={onClose}
          >
            Close
          </button>
          {template.type === TEMPLATE_TYPE.SYSTEM && (
            <button
              className="template-preview__btn template-preview__btn--primary"
              onClick={onDuplicate}
            >
              <Icon name="copy" size={16} />
              Duplicate as Custom
            </button>
          )}
          {template.type === TEMPLATE_TYPE.CUSTOM && (
            <button
              className="template-preview__btn template-preview__btn--primary"
              onClick={onEdit}
            >
              <Icon name="edit-2" size={16} />
              Edit Template
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;
