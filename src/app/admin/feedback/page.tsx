'use client';
import './style.css';

import { useState } from 'react';
import { 
  EnvelopeIcon,
  StarIcon,
  ChatBubbleLeftIcon,
  BellIcon
} from '@heroicons/react/24/outline';

interface Feedback {
  id: number;
  userId: string;
  conversationId: number;
  rating: number;
  comment: string;
  timestamp: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export default function FeedbackMonitoring() {
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Mock data - replace with actual data from your backend
  const feedbacks: Feedback[] = [
    {
      id: 1,
      userId: 'user123',
      conversationId: 1,
      rating: 5,
      comment: 'The bot was very helpful and understood my needs perfectly!',
      timestamp: '2024-04-10 15:30:00',
      sentiment: 'positive',
    },
    {
      id: 2,
      userId: 'user456',
      conversationId: 2,
      rating: 2,
      comment: 'The bot didn\'t understand my question and kept giving irrelevant answers.',
      timestamp: '2024-04-10 16:45:00',
      sentiment: 'negative',
    },
  ];

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6" id='feedback_contain'>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Feedback Monitoring</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center" id='email-notifications'>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                Email Notifications
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feedback List */}
        <div className="lg:col-span-1 bg-white shadow rounded-lg">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">Recent Feedback</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {feedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className={`p-4 cursor-pointer hover:bg-gray-50 ${
                  selectedFeedback?.id === feedback.id ? 'bg-indigo-50' : ''
                }`}
                onClick={() => setSelectedFeedback(feedback)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      User ID: {feedback.userId}
                    </p>
                    <p className="text-sm text-gray-500">
                      {feedback.timestamp}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSentimentColor(
                      feedback.sentiment
                    )}`}
                  >
                    {feedback.sentiment}
                  </span>
                </div>
                <div className="mt-2 flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`h-4 w-4 ${
                        i < feedback.rating
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-2 text-sm text-gray-600 truncate">
                  {feedback.comment}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback Details */}
        <div className="lg:col-span-2 space-y-6" id='column2'>
          {/* Feedback Analysis */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium">Feedback Analysis</h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">75%</div>
                  <div className="text-sm text-green-700">Positive Feedback</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">15%</div>
                  <div className="text-sm text-red-700">Negative Feedback</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">10%</div>
                  <div className="text-sm text-gray-700">Neutral Feedback</div>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Feedback Details */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium">Feedback Details</h2>
            </div>
            <div className="p-4">
              {selectedFeedback ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        User ID: {selectedFeedback.userId}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedFeedback.timestamp}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSentimentColor(
                        selectedFeedback.sentiment
                      )}`}
                    >
                      {selectedFeedback.sentiment}
                    </span>
                  </div>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-5 w-5 ${
                          i < selectedFeedback.rating
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-900">Comment:</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {selectedFeedback.comment}
                    </p>
                  </div>
                  <div className="mt-4">
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                      <ChatBubbleLeftIcon className="h-5 w-5 inline-block mr-2" />
                      View Conversation
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  Select a feedback to view details
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 