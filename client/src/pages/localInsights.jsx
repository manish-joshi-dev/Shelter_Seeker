import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FaWater,
  FaBolt,
  FaCar,
  FaShieldAlt,
  FaGraduationCap,
  FaShoppingCart,
  FaThumbsUp,
  FaThumbsDown,
  FaQuestionCircle,
  FaMapMarkerAlt,
  FaStar,
  FaArrowLeft,
  FaPlus,
  FaCheck,
  FaTimes
} from 'react-icons/fa';


const LocalInsights = () => {
  const { id: listingId } = useParams();
  const navigate = useNavigate();
  const { curUser } = useSelector((state) => state.user);
  
  const [insights, setInsights] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showAskQuestion, setShowAskQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState({ question: '', category: 'General' });
  const [showAnswerForm, setShowAnswerForm] = useState(null);
  const [newAnswer, setNewAnswer] = useState({ answer: '', userType: 'Resident' });

  const categories = [
    { id: 'all', name: 'All', icon: FaQuestionCircle },
    { id: 'Water', name: 'Water', icon: FaWater },
    { id: 'Power', name: 'Power', icon: FaBolt },
    { id: 'Traffic', name: 'Traffic', icon: FaCar },
    { id: 'Safety', name: 'Safety', icon: FaShieldAlt },
    { id: 'Schools', name: 'Schools', icon: FaGraduationCap },
    { id: 'Daily Needs', name: 'Daily Needs', icon: FaShoppingCart },
  ];

  const ratingIcons = {
    waterSupply: FaWater,
    powerSupply: FaBolt,
    traffic: FaCar,
    safety: FaShieldAlt,
    schools: FaGraduationCap,
    dailyNeeds: FaShoppingCart,
  };

  const ratingColors = {
    Excellent: 'text-emerald-600 bg-emerald-100',
    Good: 'text-green-600 bg-green-100',
    Average: 'text-yellow-600 bg-yellow-100',
    Poor: 'text-orange-600 bg-orange-100',
    'Very Poor': 'text-red-600 bg-red-100',
  };

  const scoreToRating = (score) => {
    if (score >= 4.5) return 'Excellent';
    if (score >= 3.5) return 'Good';
    if (score >= 2.5) return 'Average';
    if (score >= 1.5) return 'Poor';
    if (score >= 0) return 'Very Poor';
    return 'Unknown';
  };

  useEffect(() => {
    fetchInsights();
  }, [listingId]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      console.log("hi");
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/api/locality-insights/get/${listingId}`);
      // const res1 = await fetch(`${backendUrl}/api/locality-insights/nearby/${listingId}`);
      const data = await res.json();
      // const data1 = await res1.json();
      
      console.log('Fetched insights data:', data);
      // console.log('Fetched nearby insights data:', data1);
      
      if (data.success === false || !data.locality) {
        // No insights found for this listing
        setInsights(null);
        setQuestions([]);
        setError(false);
        setLoading(false);
        return;
      }
      console.log('Setting insights:', data.locality);
      setInsights(data.locality);
      setQuestions(data.questions || []);
      console.log('Set questions:', data.questions || []);
      setError(false);
    } catch (error) {
      setError(true);
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!curUser) {
      alert('Please sign in to ask a question');
      return;
    }

    if (!newQuestion.question.trim()) {
      alert('Please enter a question');
      return;
    }

    if (newQuestion.category === 'General') {
      alert('Please select a specific category for your question');
      return;
    }

    try {
      console.log('Current newQuestion state:', newQuestion);
      console.log('Asking question:', {
        localityInsightId: insights._id,
        question: newQuestion.question,
        category: newQuestion.category
      });
      
      const response = await fetch('/api/locality-insights/ask-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          localityInsightId: insights._id,
          question: newQuestion.question,
          category: newQuestion.category,
        }),
      });
      
      const data = await response.json();
      console.log('Question response:', data);
      
      if (response.ok) {
        setNewQuestion({ question: '', category: 'General' });
        setShowAskQuestion(false);
        fetchInsights();
      } else {
        console.error('Error response:', data);
        alert('Failed to post question: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error asking question:', error);
      alert('Failed to post question');
    }
  };

  const handleAnswerQuestion = async (questionId, e) => {
    e.preventDefault();
    if (!curUser) {
      alert('Please sign in to answer');
      return;
    }

    try {
      await fetch('/api/locality-insights/answer-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          questionId,
          answer: newAnswer.answer,
          userType: newAnswer.userType,
        }),
      });
      
      setNewAnswer({ answer: '', userType: 'Resident' });
      setShowAnswerForm(null);
      fetchInsights();
    } catch (error) {
      console.error('Error answering question:', error);
    }
  };

  const handleVoteAnswer = async (questionId, answerIndex, voteType) => {
    if (!curUser) {
      alert('Please sign in to vote');
      return;
    }

    try {
      await fetch('/api/locality-insights/vote-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          questionId,
          answerIndex,
          voteType,
        }),
      });
      fetchInsights();
    } catch (error) {
      console.error('Error voting on answer:', error);
    }
  };

  const filteredQuestions = activeCategory === 'all' 
    ? questions 
    : questions.filter(q => q.category === activeCategory);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading local insights...</p>
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaQuestionCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Local Insights Available</h2>
          <p className="text-gray-600 mb-4">This property doesn't have local insights yet.</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <FaArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Local Insights</h1>
                <p className="text-gray-600 flex items-center">
                  <FaMapMarkerAlt className="h-4 w-4 mr-1" />
                  {insights.localityName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <FaStar className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold text-gray-900">
                {insights.overallScore ? insights.overallScore.toFixed(1) : 'N/A'}
              </span>
              <span className="text-gray-500">/10</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section - Locality Snapshot */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Locality Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {!insights?.ratings || Object.keys(insights.ratings).length === 0 ? (
              <div className="col-span-full text-center py-8">
                <FaQuestionCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No locality insights available yet.</p>
              </div>
            ) : (
              Object.entries(insights.ratings)
                .filter(([, insight]) => insight && (typeof insight.score === 'number' || insight.rating))
                .map(([key, insight]) => {
                  const Icon = ratingIcons[key] || FaCheck;
                  const scoreValue = typeof insight.score === 'number' ? insight.score : null;
                  const ratingLabel = scoreValue !== null ? scoreToRating(scoreValue) : (insight.rating || 'Unknown');
                  return (
                    <div key={key} className="text-center p-4 border border-gray-200 rounded-lg">
                      <div className={`mx-auto flex items-center justify-center w-12 h-12 rounded-full mb-3 ${ratingColors[ratingLabel]}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="font-medium text-gray-900 capitalize mb-2">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      <p className="text-sm font-semibold text-gray-900">
                        {ratingLabel}
                      </p>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Community Q&A Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Community Q&A</h2>
            <button
              onClick={() => setShowAskQuestion(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <FaPlus className="h-4 w-4" />
              <span>Ask Question</span>
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>

          {/* Questions List */}
          <div className="space-y-6">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-8">
                <FaQuestionCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No questions in this category yet.</p>
              </div>
            ) : (
              filteredQuestions.map((question) => (
                <div key={question._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {question.category}
                        </span>
                        <span className="text-sm text-gray-500">
                          Asked by {question.askedByName}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900">{question.question}</h3>
                    </div>
                    <button
                      onClick={() => setShowAnswerForm(question._id)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Answer
                    </button>
                  </div>

                  {/* Answers */}
                  {question.answers.length > 0 && (
                    <div className="space-y-3 mt-4">
                      {question.answers.map((answer, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm">{answer.answeredByName}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                answer.userType === 'Owner' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {answer.userType}
                              </span>
                              {answer.isVerified && (
                                <FaCheck className="h-3 w-3 text-green-600" />
                              )}
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleVoteAnswer(question._id, index, 'agree')}
                                className="text-green-600 hover:text-green-700"
                              >
                                <FaThumbsUp className="h-4 w-4" />
                              </button>
                              <span className="text-xs text-gray-500">
                                {answer.votes.agree}
                              </span>
                              <button
                                onClick={() => handleVoteAnswer(question._id, index, 'disagree')}
                                className="text-red-600 hover:text-red-700"
                              >
                                <FaThumbsDown className="h-4 w-4" />
                              </button>
                              <span className="text-xs text-gray-500">
                                {answer.votes.disagree}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm">{answer.answer}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Answer Form */}
                  {showAnswerForm === question._id && (
                    <form onSubmit={(e) => handleAnswerQuestion(question._id, e)} className="mt-4">
                      <div className="space-y-3">
                        <select
                          value={newAnswer.userType}
                          onChange={(e) => setNewAnswer({ ...newAnswer, userType: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                        >
                          <option value="Resident">Resident</option>
                          <option value="Owner">Owner</option>
                          <option value="Visitor">Visitor</option>
                        </select>
                        <textarea
                          value={newAnswer.answer}
                          onChange={(e) => setNewAnswer({ ...newAnswer, answer: e.target.value })}
                          placeholder="Your answer..."
                          className="w-full p-3 border border-gray-300 rounded-lg h-24 resize-none"
                          required
                        />
                        <div className="flex space-x-2">
                          <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                          >
                            Submit Answer
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAnswerForm(null)}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Ask Question Modal */}
      {showAskQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Ask a Question</h3>
            <form onSubmit={handleAskQuestion} className="space-y-4">
              <select
                value={newQuestion.category}
                onChange={(e) => {
                  console.log('Category changed to:', e.target.value);
                  setNewQuestion({ ...newQuestion, category: e.target.value });
                }}
                className="w-full p-3 border border-gray-300 rounded-lg"
              >
                <option value="General">Select a category...</option>
                {categories.slice(1).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <textarea
                value={newQuestion.question}
                onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                placeholder="What would you like to know about this area?"
                className="w-full p-3 border border-gray-300 rounded-lg h-24 resize-none"
                required
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex-1"
                >
                  Ask Question
                </button>
                <button
                  type="button"
                  onClick={() => setShowAskQuestion(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocalInsights;
