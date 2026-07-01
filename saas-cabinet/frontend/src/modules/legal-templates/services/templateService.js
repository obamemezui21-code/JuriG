/**
 * Legal Templates API Service
 * Handles all API calls for template management
 */

import { api } from '../../../services/api';

const BASE_ENDPOINT = '/legal-templates';

/**
 * Fetch all templates (system + custom)
 */
export const fetchTemplates = async (token, filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.country) params.append('country', filters.country);
    if (filters.search) params.append('search', filters.search);

    const response = await api.get(`${BASE_ENDPOINT}?${params.toString()}`, token);
    return response;
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
};

/**
 * Get a specific template by ID
 */
export const fetchTemplateById = async (token, templateId) => {
  try {
    const response = await api.get(`${BASE_ENDPOINT}/${templateId}`, token);
    return response;
  } catch (error) {
    console.error('Error fetching template:', error);
    throw error;
  }
};

/**
 * Get system templates (protected, read-only)
 */
export const fetchSystemTemplates = async (token, category = null) => {
  try {
    let endpoint = `${BASE_ENDPOINT}/system`;
    if (category) {
      endpoint += `?category=${category}`;
    }
    const response = await api.get(endpoint, token);
    return response;
  } catch (error) {
    console.error('Error fetching system templates:', error);
    throw error;
  }
};

/**
 * Get user custom templates
 */
export const fetchCustomTemplates = async (token) => {
  try {
    const response = await api.get(`${BASE_ENDPOINT}/custom`, token);
    return response;
  } catch (error) {
    console.error('Error fetching custom templates:', error);
    throw error;
  }
};

/**
 * Create a new custom template
 */
export const createTemplate = async (token, templateData) => {
  try {
    const response = await api.post(BASE_ENDPOINT, templateData, token);
    return response;
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
};

/**
 * Create a custom template based on a system template
 */
export const duplicateTemplate = async (token, sourceTemplateId, customData = {}) => {
  try {
    const response = await api.post(`${BASE_ENDPOINT}/${sourceTemplateId}/duplicate`, customData, token);
    return response;
  } catch (error) {
    console.error('Error duplicating template:', error);
    throw error;
  }
};

/**
 * Update a custom template
 */
export const updateTemplate = async (token, templateId, updateData) => {
  try {
    const response = await api.put(`${BASE_ENDPOINT}/${templateId}`, updateData, token);
    return response;
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
};

/**
 * Delete a custom template
 */
export const deleteTemplate = async (token, templateId) => {
  try {
    const response = await api.delete(`${BASE_ENDPOINT}/${templateId}`, token);
    return response;
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
};

/**
 * Search templates
 */
export const searchTemplates = async (token, query, filters = {}) => {
  try {
    const params = new URLSearchParams({ q: query });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const response = await api.get(`${BASE_ENDPOINT}/search?${params.toString()}`, token);
    return response;
  } catch (error) {
    console.error('Error searching templates:', error);
    throw error;
  }
};

/**
 * Get template versions
 */
export const fetchTemplateVersions = async (token, templateId) => {
  try {
    const response = await api.get(`${BASE_ENDPOINT}/${templateId}/versions`, token);
    return response;
  } catch (error) {
    console.error('Error fetching template versions:', error);
    throw error;
  }
};

/**
 * Get a specific version of a template
 */
export const fetchTemplateVersion = async (token, templateId, versionId) => {
  try {
    const response = await api.get(`${BASE_ENDPOINT}/${templateId}/versions/${versionId}`, token);
    return response;
  } catch (error) {
    console.error('Error fetching template version:', error);
    throw error;
  }
};

/**
 * Restore a previous version
 */
export const restoreTemplateVersion = async (token, templateId, versionId) => {
  try {
    const response = await api.post(
      `${BASE_ENDPOINT}/${templateId}/versions/${versionId}/restore`,
      {},
      token
    );
    return response;
  } catch (error) {
    console.error('Error restoring template version:', error);
    throw error;
  }
};

/**
 * Change template status
 */
export const updateTemplateStatus = async (token, templateId, newStatus) => {
  try {
    const response = await api.patch(
      `${BASE_ENDPOINT}/${templateId}/status`,
      { status: newStatus },
      token
    );
    return response;
  } catch (error) {
    console.error('Error updating template status:', error);
    throw error;
  }
};

/**
 * Export template
 */
export const exportTemplate = async (token, templateId, format = 'html') => {
  try {
    const response = await api.get(
      `${BASE_ENDPOINT}/${templateId}/export?format=${format}`,
      token
    );
    return response;
  } catch (error) {
    console.error('Error exporting template:', error);
    throw error;
  }
};

/**
 * Import a template
 */
export const importTemplate = async (token, templateFile) => {
  try {
    const formData = new FormData();
    formData.append('file', templateFile);

    const response = await api.post(`${BASE_ENDPOINT}/import`, formData, token);
    return response;
  } catch (error) {
    console.error('Error importing template:', error);
    throw error;
  }
};

/**
 * Get template statistics
 */
export const fetchTemplateStats = async (token) => {
  try {
    const response = await api.get(`${BASE_ENDPOINT}/stats`, token);
    return response;
  } catch (error) {
    console.error('Error fetching template statistics:', error);
    throw error;
  }
};

export default {
  fetchTemplates,
  fetchTemplateById,
  fetchSystemTemplates,
  fetchCustomTemplates,
  createTemplate,
  duplicateTemplate,
  updateTemplate,
  deleteTemplate,
  searchTemplates,
  fetchTemplateVersions,
  fetchTemplateVersion,
  restoreTemplateVersion,
  updateTemplateStatus,
  exportTemplate,
  importTemplate,
  fetchTemplateStats
};
