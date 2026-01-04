import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore'
import { CATEGORIES } from '../utils/categorizer'

export default function IdeasList({ userId }) {
  const [ideas, setIdeas] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!userId) return

    // Real-time listener for ideas
    const q = query(
      collection(db, 'ideas'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ideasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setIdeas(ideasData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [userId])

  const handleDeleteIdea = async (ideaId) => {
    if (window.confirm('Delete this idea?')) {
      try {
        await deleteDoc(doc(db, 'ideas', ideaId))
      } catch (error) {
        console.error('Error deleting idea:', error)
      }
    }
  }

  // Filter ideas
  const filteredIdeas = ideas.filter(idea => {
    const matchesCategory = selectedCategory === 'All' || idea.category === selectedCategory
    const matchesSearch = idea.text.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Group ideas by category
  const groupedIdeas = filteredIdeas.reduce((acc, idea) => {
    const category = idea.category || 'Other'
    if (!acc[category]) acc[category] = []
    acc[category].push(idea)
    return acc
  }, {})

  // Category stats
  const categoryStats = ideas.reduce((acc, idea) => {
    const category = idea.category || 'Other'
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {})

  if (loading) {
    return (
      <div className="text-white text-center text-xl">
        Loading your ideas...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Your Ideas ({ideas.length})
        </h2>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search ideas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none mb-4"
        />

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-full font-medium transition ${
              selectedCategory === 'All'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All ({ideas.length})
          </button>
          {CATEGORIES.map(category => {
            const count = categoryStats[category] || 0
            if (count === 0) return null
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-medium transition ${
                  selectedCategory === category
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Ideas List - Grouped by Category */}
      {filteredIdeas.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 text-center text-white">
          <p className="text-2xl mb-2">No ideas yet!</p>
          <p className="text-gray-200">Start capturing your ideas to see them here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedIdeas).map(([category, categoryIdeas]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-xl font-bold text-white px-2">
                {category} ({categoryIdeas.length})
              </h3>
              <div className="space-y-3">
                {categoryIdeas.map(idea => (
                  <div
                    key={idea.id}
                    className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-gray-800 text-lg mb-2">{idea.text}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                            {idea.category}
                          </span>
                          <span>
                            {idea.createdAt?.toDate().toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteIdea(idea.id)}
                        className="text-red-500 hover:text-red-700 text-2xl ml-4"
                        title="Delete idea"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
