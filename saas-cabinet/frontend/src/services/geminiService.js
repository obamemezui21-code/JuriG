/**
 * Gemini AI Service
 * Communicates with backend Gemini server on port 3000
 * Includes error handling, timeout management, and retry logic
 */

const BACKEND_API_URL = 'http://localhost:3000';
const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Fetch with timeout
 * @param {string} url - API endpoint
 * @param {object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>}
 */
const fetchWithTimeout = async (url, options = {}, timeout = DEFAULT_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Send a message to Gemini AI via backend server
 * @param {string} message - User message
 * @param {array} conversationHistory - Previous messages for context (optional)
 * @returns {Promise<string>} - Gemini response
 */
export const sendMessageToGemini = async (message, conversationHistory = []) => {
  try {
    if (!message || typeof message !== 'string') {
      throw new Error('Le message doit être une chaîne de caractères non vide.');
    }

    if (message.trim().length === 0) {
      throw new Error('Le message ne peut pas être vide.');
    }

    const response = await fetchWithTimeout(
      `${BACKEND_API_URL}/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          model: undefined, // Let backend choose the model
        }),
      },
      DEFAULT_TIMEOUT
    );

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = null;
      }

      const errorMessage = errorData?.reply || errorData?.error || `Erreur serveur: HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.reply) {
      throw new Error('Pas de réponse reçue du serveur.');
    }

    return data.reply;
  } catch (error) {
    console.error('Error communicating with Gemini backend:', error);
    
    // Provide user-friendly error messages
    if (error.message.includes('timeout')) {
      return 'Le serveur met trop de temps à répondre. Veuillez réessayer.';
    } else if (error.message.includes('Failed to fetch')) {
      return 'Erreur de connexion au serveur Gemini. Vérifiez que le serveur est en cours d\'exécution.';
    } else if (error.message.includes('HTTP 500')) {
      return 'Erreur serveur interne. Veuillez réessayer plus tard.';
    }
    
    return error.message || 'Une erreur est survenue lors de la communication avec le serveur.';
  }
};

/**
 * Check if Gemini backend is accessible and healthy
 * @returns {Promise<boolean>} - True if backend is reachable and responding
 */
export const isGeminiConfigured = async () => {
  try {
    const response = await fetchWithTimeout(
      `${BACKEND_API_URL}/health`,
      { method: 'GET' },
      5000 // Shorter timeout for health check
    );
    return response.ok;
  } catch (error) {
    console.warn('Gemini backend health check failed:', error.message);
    return false;
  }
};

/**
 * Get available models from Gemini backend
 * @returns {Promise<array>} - List of available models
 */
export const getAvailableModels = async () => {
  try {
    const response = await fetchWithTimeout(
      `${BACKEND_API_URL}/models`,
      { method: 'GET' },
      10000
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch models: HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.models || [];
  } catch (error) {
    console.error('Error fetching available models:', error);
    return [];
  }
};

/**
 * Get backend configuration status
 * @returns {Promise<object>} - Configuration status details
 */
export const getBackendStatus = async () => {
  try {
    const [healthResponse, modelsResponse] = await Promise.all([
      fetchWithTimeout(`${BACKEND_API_URL}/health`, { method: 'GET' }, 5000).catch(() => null),
      fetchWithTimeout(`${BACKEND_API_URL}/models`, { method: 'GET' }, 5000).catch(() => null),
    ]);

    return {
      isHealthy: healthResponse?.ok || false,
      hasModels: modelsResponse?.ok || false,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting backend status:', error);
    return {
      isHealthy: false,
      hasModels: false,
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
};

export default {
  sendMessageToGemini,
  isGeminiConfigured,
  getAvailableModels,
  getBackendStatus,
  BACKEND_API_URL,
};
