import React, { useState } from 'react';
import {
  FaWater,
  FaBolt,
  FaCar,
  FaShieldAlt,
  FaGraduationCap,
  FaShoppingCart,
  FaInfoCircle
} from 'react-icons/fa';

const LocalityInsightsForm = ({ onInsightsChange, initialInsights = null }) => {
  const [insights, setInsights] = useState(initialInsights || {
    waterSupply: { rating: 'Good', description: '' },
    powerSupply: { rating: 'Good', description: '' },
    traffic: { rating: 'Good', description: '' },
    safety: { rating: 'Good', description: '' },
    schools: { rating: 'Good', description: '' },
    dailyNeeds: { rating: 'Good', description: '' },
  });

  const [localityName, setLocalityName] = useState('');
                    
  const categories = [
    { key: 'waterSupply', name: 'Water Supply', icon: FaWater, color: 'text-blue-600' },
    { key: 'powerSupply', name: 'Power Supply', icon: FaBolt, color: 'text-yellow-600' },
    { key: 'traffic', name: 'Traffic', icon: FaCar, color: 'text-gray-600' },
    { key: 'safety', name: 'Safety', icon: FaShieldAlt, color: 'text-green-600' },
    { key: 'schools', name: 'Schools', icon: FaGraduationCap, color: 'text-purple-600' },
    { key: 'dailyNeeds', name: 'Daily Needs', icon: FaShoppingCart, color: 'text-orange-600' },
  ];

  const ratings = ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'];

  const ratingButtonStyles = {
    Excellent: 'bg-emerald-100 text-emerald-800',
    Good: 'bg-lime-100 text-lime-800',
    Average: 'bg-yellow-100 text-yellow-800',
    Poor: 'bg-orange-100 text-orange-800',
    'Very Poor': 'bg-red-100 text-red-800',
  };

  const handleRatingChange = (category, rating) => {
    const updatedInsights = {
      ...insights,
      [category]: {
        ...insights[category],
        rating
      }
    };
    setInsights(updatedInsights);
    onInsightsChange(updatedInsights, localityName);
  };

  const handleDescriptionChange = (category, description) => {
    const updatedInsights = {
      ...insights,
      [category]: {
        ...insights[category],
        description
      }
    };
    setInsights(updatedInsights);
    onInsightsChange(updatedInsights, localityName);
  };

  const handleLocalityNameChange = (name) => {
    setLocalityName(name);
    onInsightsChange(insights, name);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <FaInfoCircle className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Local Insights</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-6">
        Help potential buyers/renters understand the locality better by providing insights about the area.
      </p>

      {/* Locality Name */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Locality Name *
        </label>
        <input
          type="text"
          value={localityName}
          onChange={(e) => handleLocalityNameChange(e.target.value)}
          placeholder="e.g., Downtown, Suburbia, Tech Park"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <div key={category.key} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Icon className={`h-5 w-5 ${category.color}`} />
                <h4 className="font-medium text-gray-900">{category.name}</h4>
              </div>
              
              {/* Rating Selection */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <div className="flex space-x-2">
                  {ratings.map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleRatingChange(category.key, rating)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        insights[category.key].rating === rating
                          ? ratingButtonStyles[rating]
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Details (Optional)
                </label>
                <textarea
                  value={insights[category.key].description}
                  onChange={(e) => handleDescriptionChange(category.key, e.target.value)}
                  placeholder={`Describe ${category.name.toLowerCase()} in this area...`}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20 resize-none"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> These insights will be visible to all users viewing your property. 
          Community members can vote on the accuracy of your insights and ask additional questions.
        </p>
      </div>
    </div>
  );
};

export default LocalityInsightsForm;

