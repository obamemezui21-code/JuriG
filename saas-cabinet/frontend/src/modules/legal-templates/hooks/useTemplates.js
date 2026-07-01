/**
 * useTemplates Hook
 * Manages legal templates state and operations
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import * as templateService from '../services/templateService';

export const useTemplates = () => {
  const { token } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [systemTemplates, setSystemTemplates] = useState([]);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all templates
  const loadTemplates = useCallback(async (filters = {}) => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await templateService.fetchTemplates(token, filters);
      setTemplates(response.templates || []);
    } catch (err) {
      setError(err.message || 'Failed to load templates');
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch system templates
  const loadSystemTemplates = useCallback(async (category = null) => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await templateService.fetchSystemTemplates(token, category);
      setSystemTemplates(response.templates || []);
    } catch (err) {
      setError(err.message || 'Failed to load system templates');
      console.error('Error loading system templates:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch custom templates
  const loadCustomTemplates = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await templateService.fetchCustomTemplates(token);
      setCustomTemplates(response.templates || []);
    } catch (err) {
      setError(err.message || 'Failed to load custom templates');
      console.error('Error loading custom templates:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Create template
  const createNewTemplate = useCallback(async (templateData) => {
    if (!token) return null;
    
    setError(null);
    try {
      const response = await templateService.createTemplate(token, templateData);
      setCustomTemplates(prev => [...prev, response.template]);
      return response.template;
    } catch (err) {
      const errorMsg = err.message || 'Failed to create template';
      setError(errorMsg);
      throw err;
    }
  }, [token]);

  // Duplicate template
  const duplicateExistingTemplate = useCallback(async (sourceId, customData = {}) => {
    if (!token) return null;
    
    setError(null);
    try {
      const response = await templateService.duplicateTemplate(token, sourceId, customData);
      setCustomTemplates(prev => [...prev, response.template]);
      return response.template;
    } catch (err) {
      const errorMsg = err.message || 'Failed to duplicate template';
      setError(errorMsg);
      throw err;
    }
  }, [token]);

  // Update template
  const updateExistingTemplate = useCallback(async (templateId, updateData) => {
    if (!token) return null;
    
    setError(null);
    try {
      const response = await templateService.updateTemplate(token, templateId, updateData);
      setCustomTemplates(prev => 
        prev.map(t => t.id === templateId ? response.template : t)
      );
      return response.template;
    } catch (err) {
      const errorMsg = err.message || 'Failed to update template';
      setError(errorMsg);
      throw err;
    }
  }, [token]);

  // Delete template
  const deleteExistingTemplate = useCallback(async (templateId) => {
    if (!token) return;
    
    setError(null);
    try {
      await templateService.deleteTemplate(token, templateId);
      setCustomTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (err) {
      const errorMsg = err.message || 'Failed to delete template';
      setError(errorMsg);
      throw err;
    }
  }, [token]);

  // Search templates
  const searchTemplates = useCallback(async (query, filters = {}) => {
    if (!token) return [];
    
    setLoading(true);
    setError(null);
    try {
      const response = await templateService.searchTemplates(token, query, filters);
      return response.templates || [];
    } catch (err) {
      setError(err.message || 'Failed to search templates');
      console.error('Error searching templates:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Get template versions
  const getVersions = useCallback(async (templateId) => {
    if (!token) return [];
    
    setError(null);
    try {
      const response = await templateService.fetchTemplateVersions(token, templateId);
      return response.versions || [];
    } catch (err) {
      setError(err.message || 'Failed to fetch versions');
      console.error('Error fetching versions:', err);
      return [];
    }
  }, [token]);

  // Restore version
  const restoreVersion = useCallback(async (templateId, versionId) => {
    if (!token) return null;
    
    setError(null);
    try {
      const response = await templateService.restoreTemplateVersion(token, templateId, versionId);
      setCustomTemplates(prev => 
        prev.map(t => t.id === templateId ? response.template : t)
      );
      return response.template;
    } catch (err) {
      const errorMsg = err.message || 'Failed to restore version';
      setError(errorMsg);
      throw err;
    }
  }, [token]);

  // Update status
  const changeStatus = useCallback(async (templateId, newStatus) => {
    if (!token) return null;
    
    setError(null);
    try {
      const response = await templateService.updateTemplateStatus(token, templateId, newStatus);
      setCustomTemplates(prev => 
        prev.map(t => t.id === templateId ? response.template : t)
      );
      return response.template;
    } catch (err) {
      const errorMsg = err.message || 'Failed to update status';
      setError(errorMsg);
      throw err;
    }
  }, [token]);

  return {
    templates,
    systemTemplates,
    customTemplates,
    loading,
    error,
    loadTemplates,
    loadSystemTemplates,
    loadCustomTemplates,
    createNewTemplate,
    duplicateExistingTemplate,
    updateExistingTemplate,
    deleteExistingTemplate,
    searchTemplates,
    getVersions,
    restoreVersion,
    changeStatus
  };
};

export default useTemplates;
