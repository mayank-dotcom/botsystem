'use client';

import { useState } from 'react';
import './style.css';
import { 
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface Message {
  role: 'user' | 'bot';
  content: string;
}

interface Conversation {
  id: number;
  userId: string;
  messages: Message[];
}

export default function FineTuning() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<number[]>([]);
  const [instruction, setInstruction] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Mock data - replace with actual data from your backend
  const conversations: Conversation[] = [
    {
      id: 1,
      userId: 'user123',
      messages: [
        { role: 'user', content: 'Hello, I need help with my order' },
        { role: 'bot', content: 'I\'d be happy to help you with your order. Could you please provide your order number?' },
        { role: 'user', content: 'My order number is #12345' },
        { role: 'bot', content: 'I found your order. How can I assist you with it?' },
      ],
    },
  ];

  const handleMessageSelect = (index: number) => {
    setSelectedMessages((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const handleSaveInstruction = () => {
    // Save instruction to backend
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Fine-Tuning Interface</h1>
        <div className="flex items-center space-x-4">
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            onClick={() => setIsEditing(true)} id='pencil'
          >
            <PencilIcon className="h-5 w-5 inline-block mr-2" />
            Edit Instructions
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id='rancont1'>
        {/* Conversation Selection */}
        <div className="lg:col-span-1 bg-white shadow rounded-lg" id='convosel'>
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">Select Conversation</h2>
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
                      {conversation.messages.length} messages
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Selection and Instructions */}
        <div className="lg:col-span-2 space-y-6" id='selected-messages'>
          {/* Selected Messages */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium">Selected Messages</h2>
            </div>
            <div className="p-4 space-y-4">
              {selectedConversation?.messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg cursor-pointer ${
                    selectedMessages.includes(index)
                      ? 'bg-indigo-50 border-2 border-indigo-500'
                      : 'bg-gray-50'
                  }`}
                  onClick={() => handleMessageSelect(index)}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {selectedMessages.includes(index) ? (
                        <CheckIcon className="h-5 w-5 text-indigo-600" />
                      ) : (
                        <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {message.role === 'user' ? 'User' : 'Bot'}
                      </p>
                      <p className="text-sm text-gray-500">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions Editor */}
          <div className="bg-white shadow rounded-lg">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium">Training Instructions</h2>
            </div>
            <div className="p-4">
              {isEditing ? (
                <div className="space-y-4">
                  <textarea
                    className="w-full h-32 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="Enter instructions for training the bot..."
                  />
                  <div className="flex justify-end space-x-4">
                    <button
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                      onClick={() => setIsEditing(false)}
                    >
                      <XMarkIcon className="h-5 w-5 inline-block mr-2" />
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      onClick={handleSaveInstruction}
                    >
                      <CheckIcon className="h-5 w-5 inline-block mr-2" />
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="prose max-w-none">
                  <p className="text-gray-600">
                    {instruction || 'No instructions have been set yet.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 