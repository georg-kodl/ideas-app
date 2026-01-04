// AI-powered categorization with fallback to keyword matching

const CATEGORIES = [
  'Work',
  'Household',
  'DIY',
  'Vacation',
  'Cottage',
  'Long-term Vision',
  'Health & Fitness',
  'Finance',
  'Learning',
  'Social',
  'Other'
]

// Keyword-based categorization (fallback)
const CATEGORY_KEYWORDS = {
  'Work': ['meeting', 'project', 'deadline', 'task', 'email', 'presentation', 'client', 'boss', 'office', 'work'],
  'Household': ['clean', 'organize', 'grocery', 'repair', 'fix', 'home', 'kitchen', 'bedroom', 'laundry', 'dishes'],
  'DIY': ['build', 'make', 'craft', 'woodwork', 'paint', 'install', 'diy', 'tool', 'drill', 'saw'],
  'Vacation': ['travel', 'trip', 'holiday', 'vacation', 'beach', 'hotel', 'flight', 'visit', 'tour'],
  'Cottage': ['cottage', 'cabin', 'lake', 'deck', 'dock', 'property', 'land'],
  'Long-term Vision': ['goal', 'future', 'dream', 'vision', 'plan', 'career', 'life', 'retirement', 'invest'],
  'Health & Fitness': ['workout', 'exercise', 'gym', 'diet', 'health', 'doctor', 'fitness', 'run', 'yoga'],
  'Finance': ['budget', 'money', 'save', 'invest', 'bank', 'bill', 'expense', 'income', 'tax'],
  'Learning': ['learn', 'study', 'course', 'book', 'read', 'skill', 'education', 'practice'],
  'Social': ['friend', 'family', 'party', 'event', 'birthday', 'call', 'visit', 'dinner']
}

export async function categorizeIdea(text) {
  // Try AI categorization first if API key is available
  if (import.meta.env.VITE_OPENAI_API_KEY) {
    try {
      const aiCategory = await categorizeWithAI(text)
      if (aiCategory) return aiCategory
    } catch (error) {
      console.warn('AI categorization failed, falling back to keywords:', error)
    }
  }

  // Fallback to keyword matching
  return categorizeWithKeywords(text)
}

async function categorizeWithAI(text) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) return null

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a categorization assistant. Categorize the following idea into ONE of these categories: ${CATEGORIES.join(', ')}. Respond with ONLY the category name, nothing else.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 20,
        temperature: 0.3
      })
    })

    if (!response.ok) throw new Error('API request failed')

    const data = await response.json()
    const category = data.choices[0]?.message?.content?.trim()

    // Validate that the response is one of our categories
    if (CATEGORIES.includes(category)) {
      return category
    }
  } catch (error) {
    console.error('AI categorization error:', error)
  }

  return null
}

function categorizeWithKeywords(text) {
  const lowerText = text.toLowerCase()
  const scores = {}

  // Calculate scores for each category based on keyword matches
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[category] = keywords.reduce((score, keyword) => {
      return score + (lowerText.includes(keyword) ? 1 : 0)
    }, 0)
  }

  // Find category with highest score
  const bestCategory = Object.entries(scores).reduce((best, [category, score]) => {
    return score > best.score ? { category, score } : best
  }, { category: 'Other', score: 0 })

  return bestCategory.score > 0 ? bestCategory.category : 'Other'
}

export { CATEGORIES }
