'use client';
import './style.css';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Message {
  role: 'user' | 'bot';
  content: string;
}

interface Conversation {
  _id: string;
  userId: string;
  question: string;
  response: string;
  timestamp: string;
  org_Id?: string;
  url?: string;
}

interface GroupedConversation {
  id: string;
  userId: string;
  startTime: string;
  botName: string;
  messages: Message[];
  date?: string; // Added for filtering
  time?: string; // Added for filtering
}

export default function ChatHistory() {
  const [selectedConversation, setSelectedConversation] = useState<GroupedConversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<GroupedConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [orgId, setOrgId] = useState('');
  const [botConnections, setBotConnections] = useState<{[key: string]: string}>({});
  const [urlToBotMap, setUrlToBotMap] = useState<{[key: string]: string}>({});
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('');
  const [botFilter, setBotFilter] = useState('');
  const [availableBots, setAvailableBots] = useState<string[]>([]);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filters when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch organization ID of the current user
  useEffect(() => {
    const fetchOrgId = async () => {
      try {
        const response = await axios.get('/api/get-org-details');
        if (response.data.success) {
          setOrgId(response.data.orgId);
        } else {
          setError('Failed to fetch organization details');
        }
      } catch (err) {
        console.error('Error fetching organization ID:', err);
        setError('Error fetching organization details');
      }
    };

    fetchOrgId();
  }, []);

  // Fetch bot connections to get bot names
  useEffect(() => {
    const fetchBotConnections = async () => {
      if (!orgId) return;
      
      try {
        const response = await axios.get('/api/connections', {
          params: { orgId }
        });
        
        if (response.data.success) {
          // Create a mapping of org_Id to bot name
          const connections = response.data.connections || [];
          const botMap: {[key: string]: string} = {};
          const urlMap: {[key: string]: string} = {};
          
          connections.forEach((connection: any) => {
            if (connection.org_Id && connection.name) {
              botMap[connection.org_Id] = connection.name;
            }
            
            // Also map URL to bot name
            if (connection._id && connection.name) {
              urlMap[connection._id.toString()] = connection.name;
            }
          });
          
          setBotConnections(botMap);
          setUrlToBotMap(urlMap);
        }
      } catch (err) {
        console.error('Error fetching bot connections:', err);
      }
    };

    fetchBotConnections();
  }, [orgId]);

  // Fetch chat history from the database
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!orgId) return;
      
      setLoading(true);
      try {
        const response = await axios.get('/api/chat-history', {
          params: {
            orgId: orgId,
            page: currentPage,
            limit: 10
          }
        });

        if (response.data.success) {
          // Group conversations by userId and timestamp
          const history = response.data.history || [];
          const groupedConversations: {[key: string]: GroupedConversation} = {};
          const botSet = new Set<string>();
          
          history.forEach((item: Conversation) => {
            const userId = item.userId;
            const timestamp = new Date(item.timestamp);
            const groupKey = `${userId}-${timestamp.getTime()}`;
            
            // Determine bot name based on url or org_Id
            let botName = 'Unknown Bot';
            if (item.url && urlToBotMap[item.url]) {
              botName = urlToBotMap[item.url];
            } else if (item.org_Id && botConnections[item.org_Id]) {
              botName = botConnections[item.org_Id];
            }
            
            botSet.add(botName);
            
            if (!groupedConversations[groupKey]) {
              groupedConversations[groupKey] = {
                id: groupKey,
                userId: userId,
                startTime: timestamp.toLocaleString(),
                botName: botName,
                messages: [],
                date: timestamp.toLocaleDateString(),
                time: timestamp.toLocaleTimeString()
              };
            }
            
            // Add user question
            groupedConversations[groupKey].messages.push({
              role: 'user',
              content: item.question
            });
            
            // Add bot response
            groupedConversations[groupKey].messages.push({
              role: 'bot',
              content: item.response
            });
          });
          
          setConversations(Object.values(groupedConversations));
          setAvailableBots(Array.from(botSet));
          setTotalPages(response.data.totalPages || 1);
        } else {
          setError('Failed to fetch chat history');
        }
      } catch (err) {
        console.error('Error fetching chat history:', err);
        setError('Error fetching chat history');
      } finally {
        setLoading(false);
      }
    };

    fetchChatHistory();
  }, [orgId, currentPage, botConnections, urlToBotMap]);

  // Filter conversations based on search query and filters
  const filteredConversations = conversations.filter(conversation => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        conversation.userId.toLowerCase().includes(query) ||
        conversation.botName.toLowerCase().includes(query) ||
        conversation.messages.some(msg => msg.content.toLowerCase().includes(query));
      
      if (!matchesSearch) return false;
    }
    
    // Date filter
    if (dateFilter && conversation.date !== dateFilter) {
      return false;
    }
    
    // Time filter (partial match for hour)
    if (timeFilter && !conversation.time?.includes(timeFilter)) {
      return false;
    }
    
    // Bot filter
    if (botFilter && conversation.botName !== botFilter) {
      return false;
    }
    
    return true;
  });

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const clearFilters = () => {
    setDateFilter('');
    setTimeFilter('');
    setBotFilter('');
  };

  return (
    <div className="space-y-6" id='chathistcontain'>
      <div className="flex items-center justify-between" id='chhsit'>
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
          <div className="relative" ref={filterRef}>
            <button 
              className="flex items-center px-4 py-2 border rounded-lg hover:bg-gray-50"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FunnelIcon className="h-5 w-5 mr-2 text-gray-400" />
              Filter
              {(dateFilter || timeFilter || botFilter) && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  Active
                </span>
              )}
            </button>
            
            {showFilters && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-10 p-4 border">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-gray-700">Filters</h3>
                  <button 
                    onClick={clearFilters}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    Clear all
                  </button>
                </div>
                
                <div className="space-y-3">
                  {/* Date Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                    />
                  </div>
                  
                  {/* Time Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      value={timeFilter}
                      onChange={(e) => setTimeFilter(e.target.value)}
                    />
                  </div>
                  
                  {/* Bot Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bot
                    </label>
                    <select
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      value={botFilter}
                      onChange={(e) => setBotFilter(e.target.value)}
                    >
                      <option value="">All Bots</option>
                      {availableBots.map((bot, index) => (
                        <option key={index} value={bot}>
                          {bot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active filters display */}
      {(dateFilter || timeFilter || botFilter) && (
        <div className="flex flex-wrap gap-2">
          {dateFilter && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100">
              Date: {dateFilter}
              <XMarkIcon 
                className="h-4 w-4 ml-1 cursor-pointer" 
                onClick={() => setDateFilter('')}
              />
            </span>
          )}
          {timeFilter && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100">
              Time: {timeFilter}
              <XMarkIcon 
                className="h-4 w-4 ml-1 cursor-pointer" 
                onClick={() => setTimeFilter('')}
              />
            </span>
          )}
          {botFilter && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100">
              Bot: {botFilter}
              <XMarkIcon 
                className="h-4 w-4 ml-1 cursor-pointer" 
                onClick={() => setBotFilter('')}
              />
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id='twocards'>
        {/* Conversation List */}
        <div className="lg:col-span-1 bg-white shadow rounded-lg" id='conversation-list'>
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">Conversations</h2>
          </div>
          
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading conversations...</div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">{error}</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No conversations found</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredConversations.map((conversation) => (
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
                      <p className="text-sm text-blue-600">
                        Bot: {conversation.botName}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {conversation.messages.length / 2} messages
                    </span>
                  </div>
                  {conversation.messages.length > 0 && (
                    <p className="mt-2 text-sm text-gray-600 truncate">
                      {conversation.messages[0].content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
         
        </div>

        {/* Conversation Details */}
        <div className="lg:col-span-2 bg-white shadow rounded-lg" id='convos'>
          {selectedConversation ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                <h2 className="text-lg font-medium">Conversation Details</h2>
                <p className="text-sm text-gray-500">Bot: {selectedConversation.botName}</p>
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
                      {message.role === 'user' ? (
                        <p className="text-sm">{message.content}</p>
                      ) : (
                        <div 
                          className="text-sm"
                          dangerouslySetInnerHTML={{ __html: message.content }}
                        />
                      )}
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