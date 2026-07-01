/**
 * LegalTemplatesModule - Main Component
 * Integrates all components for the legal templates library
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import TemplateList from './TemplateList';
import TemplatePreview from './TemplatePreview';
import useTemplates from '../hooks/useTemplates';
import { TEMPLATE_TYPE } from '../types';
import AccessibleText from '../../../components/AccessibleText';
import { Icon } from '../../../utils/icons';
import '../styles/legalTemplatesModule.css';

const LegalTemplatesModule = () => {
  const { palette } = useTheme();
  const { duplicateExistingTemplate } = useTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeView, setActiveView] = useState('all'); // all, system, custom
  const [duplicating, setDuplicating] = useState(false);

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setSelectedTemplate(null);
  };

  const handleDuplicateTemplate = async () => {
    if (!selectedTemplate) return;

    setDuplicating(true);
    try {
      const customData = {
        name: `${selectedTemplate.name} (Copy)`,
        description: `Custom copy of ${selectedTemplate.description}`,
        original_id: selectedTemplate.id
      };

      await duplicateExistingTemplate(selectedTemplate.id, customData);
      
      // Show success feedback
      const event = new CustomEvent('notification', {
        detail: {
          type: 'success',
          message: `Template "${customData.name}" created successfully!`
        }
      });
      window.dispatchEvent(event);

      handleClosePreview();
    } catch (error) {
      const event = new CustomEvent('notification', {
        detail: {
          type: 'error',
          message: 'Failed to duplicate template. Please try again.'
        }
      });
      window.dispatchEvent(event);
    } finally {
      setDuplicating(false);
    }
  };

  const handleEditTemplate = () => {
    // This would navigate to an edit page or open an editor modal
    const event = new CustomEvent('notification', {
      detail: {
        type: 'info',
        message: 'Template editor coming soon!'
      }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="legal-templates-module">
      {/* Module Header */}
      <div className="legal-templates-module__header">
        <div className="legal-templates-module__title-section">
          <Icon name="book-open" size={32} style={{ color: palette.brand }} />
          <div>
            <AccessibleText as="h1" className="legal-templates-module__title">
              OHADA Legal Templates Library
            </AccessibleText>
            <AccessibleText as="p" className="legal-templates-module__description">
              Professional legal document templates compliant with OHADA standards
            </AccessibleText>
          </div>
        </div>
      </div>

      {/* View Selector */}
      <div className="legal-templates-module__view-selector">
        <button
          className={`legal-templates-module__view-btn ${activeView === 'all' ? 'active' : ''}`}
          onClick={() => setActiveView('all')}
        >
          <Icon name="grid" size={18} />
          All Templates
        </button>
        <button
          className={`legal-templates-module__view-btn ${activeView === 'system' ? 'active' : ''}`}
          onClick={() => setActiveView('system')}
        >
          <Icon name="shield" size={18} />
          System Models
        </button>
        <button
          className={`legal-templates-module__view-btn ${activeView === 'custom' ? 'active' : ''}`}
          onClick={() => setActiveView('custom')}
        >
          <Icon name="edit" size={18} />
          Custom Models
        </button>
      </div>

      {/* Main Content */}
      <div className="legal-templates-module__content">
        {activeView === 'all' && (
          <TemplateList
            onSelectTemplate={handleSelectTemplate}
            filterType={null}
          />
        )}
        {activeView === 'system' && (
          <TemplateList
            onSelectTemplate={handleSelectTemplate}
            filterType={TEMPLATE_TYPE.SYSTEM}
          />
        )}
        {activeView === 'custom' && (
          <TemplateList
            onSelectTemplate={handleSelectTemplate}
            filterType={TEMPLATE_TYPE.CUSTOM}
          />
        )}
      </div>

      {/* Template Preview Modal */}
      {showPreview && (
        <TemplatePreview
          template={selectedTemplate}
          onClose={handleClosePreview}
          onEdit={handleEditTemplate}
          onDuplicate={handleDuplicateTemplate}
        />
      )}

      {/* Info Section */}
      <div className="legal-templates-module__info">
        <div className="legal-templates-module__info-card">
          <Icon name="info" size={24} style={{ color: palette.brand }} />
          <div>
            <AccessibleText as="h3">About OHADA</AccessibleText>
            <AccessibleText as="p">
              The OHADA (Organization for the Harmonization of Business Law in Africa) 
              provides uniform legal frameworks for member states. Our templates are 
              designed to comply with these international standards.
            </AccessibleText>
          </div>
        </div>

        <div className="legal-templates-module__info-card">
          <Icon name="shield-check" size={24} style={{ color: '#42b883' }} />
          <div>
            <AccessibleText as="h3">System vs Custom</AccessibleText>
            <AccessibleText as="p">
              System Models are official templates maintained by the application. 
              Custom Models are templates you create and customize for your needs.
            </AccessibleText>
          </div>
        </div>

        <div className="legal-templates-module__info-card">
          <Icon name="layers" size={24} style={{ color: '#64c8ff' }} />
          <div>
            <AccessibleText as="h3">Full Versioning</AccessibleText>
            <AccessibleText as="p">
              Every template includes complete version history. Track changes, 
              restore previous versions, and maintain audit trails.
            </AccessibleText>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalTemplatesModule;
