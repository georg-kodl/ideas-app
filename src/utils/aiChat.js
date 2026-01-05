// AI Chat utility for enquiry feature - Groq (free, fast)

const CHAT_STORAGE_KEY = 'ideas-app-chat-history'
const IDEAS_STORAGE_KEY = 'ideas-app-ideas'

export function getChatHistory() {
  const stored = localStorage.getItem(CHAT_STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

export function saveChatHistory(messages) {
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
}

export function clearChatHistory() {
  localStorage.removeItem(CHAT_STORAGE_KEY)
}

function getIdeas() {
  const stored = localStorage.getItem(IDEAS_STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

function buildSystemPrompt() {
  const ideas = getIdeas()

  let ideasContext = ''
  if (ideas.length > 0) {
    ideasContext = ideas.map((idea, i) =>
      `${i + 1}. [${idea.category}] ${idea.text}`
    ).join('\n')
  } else {
    ideasContext = 'No ideas saved yet.'
  }

  return `You are a helpful assistant for an idea capture app. The user has saved the following ideas:

${ideasContext}

You can help the user by:
- Summarizing their ideas
- Answering questions about their ideas
- Brainstorming related ideas
- Suggesting new ideas based on patterns

When you want to suggest a new idea that the user might want to add to their collection, format it like this:
[ADD_IDEA: your suggested idea here]

Keep responses concise and helpful. Focus on being a creative thinking partner.`
}

export function parseAddIdeas(content) {
  const regex = /\[ADD_IDEA:\s*(.+?)\]/g
  const suggestions = []
  let match

  while ((match = regex.exec(content)) !== null) {
    suggestions.push(match[1].trim())
  }

  // Remove the ADD_IDEA markers from display content
  const cleanContent = content.replace(/\[ADD_IDEA:\s*.+?\]/g, '').trim()

  return { cleanContent, suggestions }
}

export async function sendMessage(userMessage, chatHistory) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY

  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    throw new Error('Groq API key not configured. Add VITE_GROQ_API_KEY to your .env file. Get one free at https://console.groq.com/keys')
  }

  const messages = [
    { role: 'system', content: buildSystemPrompt() },
    ...chatHistory.map(msg => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: userMessage }
  ]

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 1000,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'Failed to get AI response')
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || 'No response from AI'
}
