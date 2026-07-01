/**
 * Gemini AI Chat Widget
 * Enhanced floating chat interface with modern design, copy/export features
 */

import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToGemini, isGeminiConfigured } from '../services/geminiService';
import { AccessibleText, AccessibleHeading, AccessibleLabel } from './AccessibleText';
import { Icon } from '../utils/icons';
import { useTheme } from '../context/ThemeContext';
import '../styles/geminiChat.css';

export const GeminiChat = ({ position = 'bottom-right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Bonjour! Je suis l\'assistant IA du cabinet. Comment puis-je vous aider?',
      sender: 'bot',
      timestamp: new Date(),
      status: 'completed'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [configError, setConfigError] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    // Check if backend is available
    const checkConfiguration = async () => {
      try {
        const configured = await isGeminiConfigured();
        setIsConfigured(configured);
        if (!configured) {
          setConfigError('Serveur Gemini non disponible. Assurez-vous qu\'il est en cours d\'exécution.');
        }
      } catch (err) {
        setIsConfigured(false);
        setConfigError('Erreur de connexion au serveur Gemini.');
      }
    };
    checkConfiguration();
    // Recheck every 30 seconds
    const interval = setInterval(checkConfiguration, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = async (text, msgId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const exportConversation = () => {
    const conversationText = messages
      .map(msg => {
        const who = msg.sender === 'user' ? 'Vous' : 'Assistant IA';
        const time = formatTime(msg.timestamp);
        return `[${time}] ${who}:\n${msg.text}`;
      })
      .join('\n\n---\n\n');

    const element = document.createElement('a');
    const file = new Blob([conversationText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `conversation-ia-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
      status: 'sent'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Get response from Gemini
      const response = await sendMessageToGemini(inputValue);

      // Add bot message
      const botMessage = {
        id: messages.length + 2,
        text: response,
        sender: 'bot',
        timestamp: new Date(),
        status: 'completed'
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: messages.length + 2,
        text: 'Désolé, une erreur est survenue. Veuillez vérifier la connexion et réessayer.',
        sender: 'bot',
        timestamp: new Date(),
        status: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer l\'historique de conversation?')) {
      setMessages([
        {
          id: 1,
          text: 'Bonjour! Je suis l\'assistant IA du cabinet. Comment puis-je vous aider?',
          sender: 'bot',
          timestamp: new Date(),
          status: 'completed'
        }
      ]);
    }
  };

  const positionClasses = {
    'bottom-right': 'gemini-chat--bottom-right',
    'bottom-left': 'gemini-chat--bottom-left',
    'top-right': 'gemini-chat--top-right',
    'top-left': 'gemini-chat--top-left'
  };

  // Not configured state
  if (!isConfigured) {
    return (
      <div className={`gemini-chat-button ${positionClasses[position]}`} title={configError}>
        <button
          className="gemini-chat-button__btn gemini-chat-button__btn--disabled"
          disabled
          aria-label={configError}
        >
          <Icon type="Message" size="1.5em" title={configError} />
        </button>
      </div>
    );
  }

  return (
    <div className={`gemini-chat ${positionClasses[position]} ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Chat Widget */}
      {isOpen && (
        <div className="gemini-chat__window">
          {/* Header */}
          <div className="gemini-chat__header">
            <div className="gemini-chat__header-title">
              <div className="gemini-chat__title-icon">✨</div>
              <div>
                <h3 className="gemini-chat__title">Assistant IA</h3>
                <p className="gemini-chat__subtitle">Alimenté par Google Gemini</p>
              </div>
            </div>
            <div className="gemini-chat__header-actions">
              <button
                className="gemini-chat__action-btn"
                onClick={exportConversation}
                title="Télécharger la conversation"
                aria-label="Télécharger la conversation"
              >
                📥
              </button>
              <button
                className="gemini-chat__action-btn"
                onClick={handleClearHistory}
                title="Effacer l'historique"
                aria-label="Effacer l'historique"
              >
                🔄
              </button>
              <button
                className="gemini-chat__close-btn"
                onClick={() => setIsOpen(false)}
                title="Fermer"
                aria-label="Fermer le chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="gemini-chat__messages">
            {messages.length === 1 && (
              <div className="gemini-chat__welcome-state">
                <div className="gemini-chat__welcome-icon">💬</div>
                <p>Posez-moi n'importe quelle question</p>
              </div>
            )}

            {messages.map(message => (
              <div
                key={message.id}
                className={`gemini-chat__message gemini-chat__message--${message.sender} gemini-chat__message--${message.status}`}
              >
                <div className="gemini-chat__message-bubble">
                  <div className="gemini-chat__message-content">
                    {message.text}
                  </div>
                  <div className="gemini-chat__message-footer">
                    <span className="gemini-chat__message-time">
                      {formatTime(message.timestamp)}
                    </span>
                    {message.status === 'error' && <span className="gemini-chat__status-icon">⚠️</span>}
                    {message.sender === 'bot' && message.status !== 'error' && (
                      <button
                        className="gemini-chat__copy-btn"
                        onClick={() => copyToClipboard(message.text, message.id)}
                        title="Copier le message"
                        aria-label="Copier le message"
                      >
                        {copiedId === message.id ? '✓ Copié' : '📋'}
                      </button>
                    )}
                    {message.sender === 'user' && <span className="gemini-chat__status-icon">✓</span>}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="gemini-chat__message gemini-chat__message--bot gemini-chat__message--loading">
                <div className="gemini-chat__message-bubble">
                  <div className="gemini-chat__loading-dots">
                    <span className="gemini-chat__dot"></span>
                    <span className="gemini-chat__dot"></span>
                    <span className="gemini-chat__dot"></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="gemini-chat__input-area">
            <textarea
              className="gemini-chat__input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message... (Shift+Entrée pour nouvelle ligne)"
              disabled={isLoading}
              aria-label="Message à envoyer"
              rows="1"
            />
            <button
              className="gemini-chat__send-btn"
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              title="Envoyer le message"
              aria-label="Envoyer le message"
            >
              {isLoading ? '⏳' : '➤'}
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        className="gemini-chat-button__btn"
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Fermer le chat' : 'Ouvrir le chat'}
        aria-label={isOpen ? 'Fermer le chat' : 'Ouvrir le chat'}
        aria-expanded={isOpen}
      >
        {isOpen ? '✕' : '✨'}
      </button>
    </div>
  );
};

export default GeminiChat;
