import { useState, useEffect, useRef, useCallback } from 'react'
import { sendMessage, parseAddIdeas } from '../utils/aiChat'
import { categorizeIdea } from '../utils/categorizer'

export default function EnquiryPage({ storage }) {
  const [messages, setMessages] = useState([])
  const [ideas, setIdeas] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)

  const loadIdeas = useCallback(async () => {
    if (!storage) return
    try {
      const ideasData = await storage.getIdeas()
      setIdeas(ideasData)
    } catch (error) {
      console.error('Error fetching ideas:', error)
    }
  }, [storage])

  const loadChatHistory = useCallback(async () => {
    if (!storage) return
    try {
      const chatData = await storage.getChatHistory()
      setMessages(chatData)
    } catch (error) {
      console.error('Error fetching chat history:', error)
    }
  }, [storage])

  // Load ideas for AI context
  useEffect(() => {
    loadIdeas()
    if (storage) {
      storage.on('ideasChanged', loadIdeas)
      return () => storage.off('ideasChanged', loadIdeas)
    }
  }, [storage, loadIdeas])

  // Load chat history
  useEffect(() => {
    loadChatHistory()
    if (storage) {
      storage.on('chatChanged', loadChatHistory)
      return () => storage.off('chatChanged', loadChatHistory)
    }
  }, [storage, loadChatHistory])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading || !storage) return

    const userContent = input.trim()
    setInput('')
    setIsLoading(true)
    setError('')

    try {
      // Save user message
      await storage.saveChatMessage({
        role: 'user',
        content: userContent
      })

      // Get AI response with ideas context
      const response = await sendMessage(userContent, messages, ideas)
      const { cleanContent, suggestions } = parseAddIdeas(response)

      // Save assistant message
      await storage.saveChatMessage({
        role: 'assistant',
        content: cleanContent,
        suggestions: suggestions.map(text => ({ text, added: false }))
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddIdea = async (messageId, suggestionIndex) => {
    const message = messages.find(m => m.id === messageId)
    if (!message?.suggestions?.[suggestionIndex] || !storage) return

    const suggestion = message.suggestions[suggestionIndex]
    const category = await categorizeIdea(suggestion.text)

    // Save idea using storage provider
    await storage.saveIdea({
      text: suggestion.text,
      category,
      type: 'ai-suggested'
    })
  }

  const handleClear = async () => {
    if (!window.confirm('Clear all chat history?') || !storage) return

    try {
      await storage.clearChatHistory()
    } catch (error) {
      console.error('Error clearing chat:', error)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="bg-white rounded-t-2xl shadow-xl p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">AI Assistant</h2>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="text-sm text-gray-500 hover:text-red-500 transition"
          >
            Clear History
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 bg-white overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="text-lg mb-2">Ask me anything about your ideas!</p>
            <p className="text-sm">Try: "Summarize my ideas" or "What patterns do you see?"</p>
          </div>
        ) : (
          messages.map(message => (
            <div key={message.id}>
              <div
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-indigo-200' : 'text-gray-400'
                  }`}>
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Suggested Ideas */}
              {message.suggestions?.length > 0 && (
                <div className="mt-2 ml-4 space-y-2">
                  {message.suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200"
                    >
                      <span className="flex-1 text-sm text-gray-700">
                        {suggestion.text}
                      </span>
                      {suggestion.added ? (
                        <span className="text-green-600 text-sm font-medium">
                          Added!
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAddIdea(message.id, idx)}
                          className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
                        >
                          Add Idea
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-t border-red-200 p-3 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="bg-white rounded-b-2xl shadow-xl p-4 border-t">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your ideas..."
            className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-none"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`px-6 rounded-lg font-medium transition ${
              !input.trim() || isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
