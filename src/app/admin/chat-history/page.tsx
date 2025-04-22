'use client';

import { useState } from 'react';
import './style.css';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

export default function ChatHistory() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - replace with actual data from your backend
  const conversations = [
    {
      id: 1,
      userId: 'user123',
      startTime: '2024-04-10 14:30:00',
      messages: [
        { role: 'user', content: 'Hello, I need help with my order' },
        { role: 'bot', content: 'I\'d be happy to help you with your order. Could you please provide your order number?' },
      ],
    },
    // Add more mock conversations
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Chat History</h1>
        <div className="flex items-center space-x-4" id='searchfilter'>
          <div className="relative">
            <input
              type="text"
              placeholder="Search conversations..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2" />
          </div>
          <button className="flex items-center px-4 py-2 border rounded-lg hover:bg-gray-50">
            <FunnelIcon className="h-5 w-5 mr-2 text-gray-400" />
            Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation List */}
        <div className="lg:col-span-1 bg-white shadow rounded-lg" id='conversation-list'>
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">Conversations</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-4 cursor-pointer hover:bg-gray-50 ${
                  selectedConversation?.id === conversation.id ? 'bg-indigo-50' : ''
                }`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      User ID: {conversation.userId}
                    </p>
                    <p className="text-sm text-gray-500">
                      {conversation.startTime}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600 truncate">
                  {conversation.messages[0].content}
                </p>
              </div>
            ))}
          </div>
          {/* Pagination */}
          <div className="px-4 py-3 flex items-center justify-between border-t">
            <div className="flex-1 flex justify-between">
              <button className="relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <ChevronLeftIcon className="h-5 w-5" />
                Previous
              </button>
              <button className="ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Next
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Conversation Details */}
        <div className="lg:col-span-2 bg-white shadow rounded-lg" id='convos'>
          {selectedConversation ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                <h2 className="text-lg font-medium">Conversation Details</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConversation.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t">
                <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Export Conversation
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Select a conversation to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 