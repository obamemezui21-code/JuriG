# 🤖 Gemini AI Chat Plugin - Setup Guide

## Overview

Your application now has an integrated **Gemini AI Chat Widget** that provides:
- 💬 Real-time chat with Google Gemini AI
- 🎨 Seamless integration with UI/UX system (dark/light mode support)
- 📱 Fully responsive and accessible
- 🔒 Secure API communication
- 🌍 French language support

---

## ✅ Setup Instructions

### Step 1: Get a Gemini API Key

1. Go to **[Google AI Studio](https://aistudio.google.com/app/apikey)**
2. Click **"Get API Key"**
3. Create a new API key for your project
4. Copy the API key

### Step 2: Configure Environment Variable

1. Create a `.env` file in the `frontend/` directory (if it doesn't exist)
2. Add your Gemini API key:

```env
REACT_APP_GEMINI_API_KEY=your_api_key_here
```

3. Save the file
4. Restart the development server:

```bash
npm start
```

### Step 3: Verify Installation

1. Open your app at `http://localhost:3001`
2. Look for the **💬 message button** in the bottom-right corner
3. Click to open the chat widget
4. Type a message and hit Enter to chat with Gemini AI

---

## 📁 Files Added

```
frontend/
├── src/
│   ├── services/
│   │   └── geminiService.js          ← Gemini API communication
│   ├── components/
│   │   └── GeminiChat.jsx            ← Chat widget component
│   └── styles/
│       └── geminiChat.css            ← Chat widget styles
└── .env.example                      ← Environment template
```

---

## 🎨 Features

### 1. **Smart Widget**
- ✅ Floating button in bottom-right corner (customizable position)
- ✅ Expandable chat window with smooth animations
- ✅ Auto-scrolling to latest messages
- ✅ Loading indicator during responses

### 2. **Theme Integration**
- ✅ Automatically adapts to dark/light mode
- ✅ Matches your cabinet's color scheme
- ✅ Smooth transitions between modes

### 3. **Accessibility**
- ✅ Full keyboard navigation support
- ✅ ARIA labels for screen readers
- ✅ High contrast text
- ✅ Respects prefers-reduced-motion

### 4. **Responsive Design**
- ✅ Works on mobile (adapts to screen size)
- ✅ Touch-friendly buttons
- ✅ Optimized for all devices

### 5. **Chat Capabilities**
- ✅ Full conversation history
- ✅ Context-aware responses
- ✅ French language support
- ✅ Clear conversation history button
- ✅ Timestamps for each message

---

## 🚀 Usage

### Open the Chat Widget

The chat widget appears as a floating button in the bottom-right corner. Click it to:
- **Open** the chat window
- **Type** your message
- **Press Enter** or click the send button

### Chat Example

**User:** "Quelle est la procédure pour créer une SARL?"

**Gemini:** "Pour créer une SARL (Société À Responsabilité Limitée), voici les étapes principales..."

---

## 🔧 Configuration Options

### Customize Widget Position

In `App.js`, change the position parameter:

```jsx
<GeminiChat position="bottom-left" />  // bottom-left
<GeminiChat position="top-right" />    // top-right
<GeminiChat position="top-left" />     // top-left
```

### Available Positions
- `"bottom-right"` (default)
- `"bottom-left"`
- `"top-right"`
- `"top-left"`

---

## 📊 Customization

### Styling

Edit `src/styles/geminiChat.css` to customize:
- Colors
- Sizes
- Animations
- Responsive breakpoints

### Service Configuration

Edit `src/services/geminiService.js` to:
- Change system prompt
- Adjust temperature (creativity level)
- Modify safety settings
- Add custom instructions

---

## 🔒 Security Considerations

1. **API Key Protection:**
   - Never commit `.env` file to Git
   - Use `.gitignore` to exclude it
   - Rotate keys regularly

2. **Rate Limiting:**
   - Gemini has free tier limits
   - Consider implementing request throttling
   - Monitor API usage

3. **User Input:**
   - All user input is sanitized
   - API includes safety filters
   - No sensitive data stored client-side

---

## 🐛 Troubleshooting

### Chat Widget Not Appearing?

1. Check if API key is set in `.env`
2. Restart the dev server after adding `.env`
3. Check browser console for errors (F12)

### Gemini Not Responding?

1. Verify API key is correct
2. Check internet connection
3. Ensure API key has proper permissions
4. Check Gemini API status at [Google Cloud Console](https://console.cloud.google.com/)

### Styling Issues?

1. Ensure `geminiChat.css` is imported in `App.js`
2. Check if CSS variables are defined in `index.css`
3. Clear browser cache (Ctrl+Shift+Delete)

---

## 📝 API Reference

### `sendMessageToGemini(message, conversationHistory)`

Sends a message to Gemini and returns the response.

**Parameters:**
- `message` (string): User message
- `conversationHistory` (array): Previous messages for context

**Returns:** Promise<string> - Gemini response

**Example:**
```javascript
import { sendMessageToGemini } from '@/services/geminiService';

const response = await sendMessageToGemini('Bonjour!', []);
console.log(response);
```

### `isGeminiConfigured()`

Checks if Gemini API is properly configured.

**Returns:** boolean - True if API key is set

---

## 🎓 Advanced Usage

### Add Custom System Prompt

Edit `src/services/geminiService.js`:

```javascript
const systemPrompt = `Tu es un expert juridique français spécialisé dans...`;
```

### Add Rate Limiting

```javascript
// Add throttling
const throttle = (fn, delay) => {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= delay) {
      fn(...args);
      last = now;
    }
  };
};

const throttledSend = throttle(sendMessageToGemini, 1000);
```

### Persistent Chat History

```javascript
// Save to localStorage
const saveChatHistory = (messages) => {
  localStorage.setItem('chatHistory', JSON.stringify(messages));
};

// Load from localStorage
const loadChatHistory = () => {
  return JSON.parse(localStorage.getItem('chatHistory')) || [];
};
```

---

## 📚 Resources

- [Google Gemini API Docs](https://ai.google.dev/docs)
- [AI Studio](https://aistudio.google.com/)
- [API Pricing](https://ai.google.dev/pricing)
- [Safety Guidelines](https://ai.google.dev/docs/safety_intro)

---

## 🆘 Support

If you encounter issues:

1. **Check Console:** Open DevTools (F12) and look for error messages
2. **Verify API Key:** Ensure it's set correctly in `.env`
3. **Test Connection:** Try accessing `https://aistudio.google.com/` directly
4. **Review Logs:** Check the browser console and network tab

---

## 🎉 What's Next?

Your Gemini AI Chat is now active! You can:

1. **Customize** the prompt for specific use cases
2. **Integrate** with your backend (save conversations, analytics)
3. **Add Features** like file uploads, citations, etc.
4. **Monitor** usage and optimize costs

Enjoy your AI-powered legal assistant! 🚀
