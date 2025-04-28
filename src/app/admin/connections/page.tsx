

'use client';

import { useState, useEffect } from 'react';
import './style.css';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  LinkIcon,
  PlusCircleIcon,
  GlobeAltIcon,
  XMarkIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

// Update the Product interface
interface Product {
  _id?: string;
  id?: number;
  name: string;
  url: string;
  imageUrl?: string;
  org_Id?: string;
  databases?: string[]; // Changed from database to databases array
  useCustomPrompt?: boolean;
  customPrompt?: string;
  botBehavior?: {
    tone: string;
    responseLength: string;
    personality: string;
    outputStructure: string;
    dos: string;
    donts: string;
  } | null; // Change undefined to null
}

interface Dataset {
  _id: string;
  content: string;
  org_Id: string;
}

export default function Connections() {
  const [orgId, setOrgId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [botBehavior, setBotBehavior] = useState({
    tone: 'professional',
    responseLength: 'medium',
    personality: 'helpful',
    outputStructure: 'paragraph',
    dos: '',
    donts: '',
  });
  const [updatingBehavior, setUpdatingBehavior] = useState(false);
  const [selectedDatabases, setSelectedDatabases] = useState<string[]>([]); // New state for multiple databases

  const [newProduct, setNewProduct] = useState({
    name: '',
    url: '',
    imageUrl: '',
  });

  useEffect(() => {
    const fetchUserIdAndConnections = async () => {
      try {
        const response = await axios.get('/api/get-org-details');
        if (response.data.success) {
          const orgId = response.data.orgId;
          setOrgId(orgId);
          await fetchConnections(orgId);
          await fetchDatasets(orgId);
        }
      } catch (error) {
        console.error('Error fetching organization details:', error);
        toast.error('Failed to fetch organization details');
        setIsFetching(false);
      }
    };

    fetchUserIdAndConnections();
  }, []);

  const fetchDatasets = async (userId: string) => {
    setIsLoadingDatasets(true);
    try {
      const response = await axios.get(`/api/datasets?orgId=${userId}`);
      if (response.data.success) {
        // Filter datasets to only include those that belong to the current organization
        const filteredDatasets = response.data.datasets.filter((dataset: Dataset) => 
          dataset.org_Id === userId
        );
        setDatasets(filteredDatasets);
      } else {
        console.error('Failed to fetch datasets:', response.data.message);
        toast.error('Failed to load datasets');
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
      toast.error('Error loading datasets');
    } finally {
      setIsLoadingDatasets(false);
    }
  };

  const fetchConnections = async (orgId: string) => {
    setIsFetching(true);
    try {
      const response = await axios.get(`/api/connections?orgId=${orgId}`);
      if (response.data.success) {
        const formattedConnections = response.data.connections.map((conn: any) => ({
          _id: conn._id,
          name: conn.name,
          url: conn.url,
          imageUrl: conn.imageUrl || `https://via.placeholder.com/150?text=${encodeURIComponent(conn.name)}`,
          org_Id: conn.org_Id,
          databases: conn.databases || [],
          useCustomPrompt: conn.useCustomPrompt,
          customPrompt: conn.customPrompt,
          botBehavior: conn.botBehavior,
        }));
        setProducts(formattedConnections);
      } else {
        console.error('Failed to fetch connections:', response.data.message);
        toast.error('Failed to load connections');
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Error loading connections');
    } finally {
      setIsFetching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewProduct({
      ...newProduct,
      [name]: value,
    });
  };

  const handleAddConnection = () => {
    setIsEditMode(false);
    setCurrentProductId(null);
    setNewProduct({ name: '', url: '', imageUrl: '' });
    setSelectedDatabases([]); // Reset selected databases
    setIsModalOpen(true);
  };

  const handleEditConnection = (product: Product) => {
    setIsEditMode(true);
    setCurrentProductId(product._id || null);
    setNewProduct({
      name: product.name,
      url: product.url,
      imageUrl: product.imageUrl || '',
    });
    // Set selected databases
    setSelectedDatabases(product.databases || []);
    // Set bot behavior configuration
    setUseCustomPrompt(product.useCustomPrompt || false);
    setCustomPrompt(product.customPrompt || '');
    if (product.botBehavior) {
      setBotBehavior(product.botBehavior);
    }
    setIsModalOpen(true);
  };

  // Handle database selection
  const handleDatabaseSelection = (content: string) => {
    setSelectedDatabases(prev => {
      if (prev.includes(content)) {
        return prev.filter(db => db !== content);
      } else {
        return [...prev, content];
      }
    });
  };

  // Filter datasets to show only those not connected to other URLs
  const getAvailableDatasets = () => {
    if (!datasets || !products) return [];
    
    // Get all datasets that are connected to any URL
    const connectedDatasets = new Map();
    
    products.forEach(product => {
      if (product.databases && product.databases.length > 0) {
        product.databases.forEach(db => {
          // If we're in edit mode, don't exclude datasets connected to the current URL
          if (isEditMode && product._id === currentProductId) {
            return;
          }
          connectedDatasets.set(db, product.url);
        });
      }
    });
    
    // Filter datasets to only show those not connected to other URLs
    return datasets.filter(dataset => {
      // If the dataset is not connected to any URL, show it
      if (!connectedDatasets.has(dataset.content)) {
        return true;
      }
      
      // If we're in edit mode and the dataset is connected to the current URL, show it
      if (isEditMode && connectedDatasets.get(dataset.content) === newProduct.url) {
        return true;
      }
      
      return false;
    });
  };

  const handleBehaviorUpdate = async () => {
    setUpdatingBehavior(true);
    try {
      const response = await axios.put('/api/update-behaviour', {
        length: botBehavior.responseLength,
        outputStructure: botBehavior.outputStructure,
        tone: botBehavior.tone,
        personality: botBehavior.personality,
        mustdo: botBehavior.dos,
        dondo: botBehavior.donts,
        orgId: orgId,
      });
      if (response.status === 200) {
        toast.success('Bot behavior updated successfully');
      }
    } catch (error: any) {
      console.error('Error updating bot behavior:', error);
      toast.error(error.response?.data?.error || 'Failed to update bot behavior');
    } finally {
      setUpdatingBehavior(false);
    }
  };

  // Update the handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) {
      toast.error('User ID not available. Please try again later.');
      return;
    }
    setIsLoading(true);
    try {
      // Prepare the connection data including bot behavior
      const connectionData: Product = {
        name: newProduct.name,
        imageUrl: newProduct.imageUrl,
        databases: selectedDatabases, // Use the selected databases array
        useCustomPrompt: useCustomPrompt,
        customPrompt: useCustomPrompt ? customPrompt : '',
        botBehavior: !useCustomPrompt ? botBehavior : null,
      };
      
      if (isEditMode && currentProductId) {
        const response = await axios.put(`/api/connections/${currentProductId}`, connectionData);
        if (response.data.success) {
          setProducts(
            products.map((product) =>
              (product._id || '') === (currentProductId || '')
                ? {
                    ...product,
                    ...connectionData,
                    imageUrl: connectionData.imageUrl || `https://via.placeholder.com/150?text=${encodeURIComponent(connectionData.name)}`,
                  }
                : product
            )
          );
          toast.success('Connection updated successfully!');
        } else {
          throw new Error(response.data.message || 'Failed to update connection');
        }
      } else {
        const response = await axios.post('/api/add-connections', {
          org_Id: orgId,
          ...connectionData,
        });
        if (response.data.success) {
          const newConnection = {
            _id: response.data.insertedId,
            org_Id: orgId,
            url: response.data.insertedId, // Set URL to the insertedId
            ...connectionData,
            imageUrl: connectionData.imageUrl || `https://via.placeholder.com/150?text=${encodeURIComponent(connectionData.name)}`,
          };
          setProducts([...products, newConnection]);
          toast.success('Connection added successfully!');
        } else {
          throw new Error(response.data.message || 'Failed to add connection');
        }
      }
      // Reset form
      setNewProduct({ name: '', url: '', imageUrl: '' });
      setSelectedDatabases([]);
      setUseCustomPrompt(false);
      setCustomPrompt('');
      setBotBehavior({
        tone: 'professional',
        responseLength: 'medium',
        personality: 'helpful',
        outputStructure: 'paragraph',
        dos: '',
        donts: '',
      });
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error with connection:', error);
      toast.error(error.message || 'Failed to process connection. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConnection = async (productId: string) => {
    if (!confirm('Are you sure you want to disconnect this product?')) {
      return;
    }
    try {
      const response = await axios.delete(`/api/connections/${productId}`);
      if (response.data.success) {
        setProducts(products.filter((product) => product._id !== productId));
        toast.success('Connection removed successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to remove connection');
      }
    } catch (error: any) {
      console.error('Error deleting connection:', error);
      toast.error(error.message || 'Failed to remove connection. Please try again.');
    }
  };

  return (
    <div className="space-y-6" id="connections-container">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Connected Products</h1>
        <div className="flex items-center space-x-4">
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            id="add-connection"
            onClick={handleAddConnection}
          >
            <PlusCircleIcon className="h-5 w-5 inline-block mr-2" />
            Add Connection
          </button>
        </div>
      </div>

      <div className="stats-summary">
        <div className="stat-card">
          <div className="stat-value">{products.length}</div>
          <div className="stat-label">Total Connections</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">24/7</div>
          <div className="stat-label">Availability</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">98%</div>
          <div className="stat-label">Uptime</div>
        </div>
      </div>

      <div className="product-grid">
        {isFetching ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading connections...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <p>No connections found. Add your first connection to get started!</p>
          </div>
        ) : (
          products.map((product) => (
            <div key={product._id} className="product-card">
              <div className="product-image">
                <img src={product.imageUrl} alt={product.name} />
              </div>
              <div className="product-details">
                <h3 className="product-name">{product.name}</h3>
                <div className="embed-code-container">
                  <p className="text-sm font-medium text-gray-700 mb-2">Copy this code to embed the chatbot:</p>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                    {`<div id="embedded-chatbot"></div>\n\n<!-- Correct script tag -->\n<script src="http://localhost:3000/embed.js" data-url="${product._id}"></script>`}
                  </pre>
                  <button 
                    className="mt-2 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `<!-- Add this div to contain the embedded chatbot -->\n<div id="embedded-chatbot"></div>\n\n<!-- Correct script tag -->\n<script src="http://localhost:3000/embed.js" data-url="${product._id}"></script>`
                      );
                      toast.success('Embed code copied to clipboard!');
                    }}
                  >
                    <LinkIcon className="h-3 w-3 inline-block mr-1" />
                    Copy Code
                  </button>
                </div>
              </div>
              <div className="product-actions">
                <button className="action-button edit" onClick={() => handleEditConnection(product)}>
                  <PencilIcon className="h-4 w-4 inline-block mr-1" />
                  Edit
                </button>
                <button
                  className="action-button disconnect"
                  onClick={() => handleDeleteConnection(product._id || '')}
                >
                  <TrashIcon className="h-4 w-4 inline-block mr-1" />
                  Disconnect
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">{isEditMode ? 'Edit Connection' : 'Add New Connection'}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)} disabled={isLoading}>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="name">Product Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newProduct.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter product name"
                  className="form-input"
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="imageUrl">Image URL (optional)</label>
                <input
                  type="url"
                  id="imageUrl"
                  name="imageUrl"
                  value={newProduct.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                  className="form-input"
                  disabled={isLoading}
                />
                <p className="form-help">Leave blank to use a placeholder image</p>
              </div>

              <div className="form-group">
                <label>Select Datasets</label>
                {isLoadingDatasets ? (
                  <p>Loading datasets...</p>
                ) : datasets.length === 0 ? (
                  <p>No datasets available</p>
                ) : (
                  <div className="datasets-container">
                    {getAvailableDatasets().map((dataset) => (
                      <div key={dataset._id} className="dataset-checkbox">
                        <input
                          type="checkbox"
                          id={`dataset-${dataset._id}`}
                          checked={selectedDatabases.includes(dataset.content)}
                          onChange={() => handleDatabaseSelection(dataset.content)}
                          disabled={isLoading}
                        />
                        <label htmlFor={`dataset-${dataset._id}`}>{dataset.content}</label>
                      </div>
                    ))}
                    {getAvailableDatasets().length === 0 && (
                      <p className="text-sm text-gray-500">No available datasets found. All datasets are connected to other URLs.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700">Bot Behavior Configuration</label>
                <div className="flex items-center space-x-2 mb-4">
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-lg ${
                      !useCustomPrompt ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                    onClick={() => setUseCustomPrompt(false)}
                  >
                    Use Presets
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-lg ${
                      useCustomPrompt ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                    onClick={() => setUseCustomPrompt(true)}
                  >
                    Custom Prompt
                  </button>
                </div>

                {useCustomPrompt ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Custom Behavior Prompt</label>
                    <textarea
                      rows={5}
                      maxLength={184}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Don't use first person pronouns like I want or we want..."
                      value={customPrompt}
                      onChange={(e) => {
                        const text = e.target.value;
                        const words = text.split(/\s+/).filter((word: string) => word.length > 0);
                        const lines = text.split('\n');
                        if (words.length <= 27 && text.length <= 184 && lines.length <= 5) {
                          setCustomPrompt(text);
                        }
                      }}
                    />
                    <div className="mt-2 flex justify-between text-sm text-gray-500">
                      <span>Words: {customPrompt.split(/\s+/).filter((word: string) => word.length > 0).length}/27</span>
                      <span>Characters: {customPrompt.length}/184</span>
                      <span>Lines: {customPrompt.split('\n').length}/5</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tone</label>
                      <select
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        value={botBehavior.tone}
                        onChange={(e) => setBotBehavior({ ...botBehavior, tone: e.target.value })}
                      >
                        <option value="professional">Professional</option>
                        <option value="casual">Casual</option>
                        <option value="friendly">Friendly</option>
                        <option value="formal">Formal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Response Length</label>
                      <select
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        value={botBehavior.responseLength}
                        onChange={(e) => setBotBehavior({ ...botBehavior, responseLength: e.target.value })}
                      >
                        <option value="short">Short</option>
                        <option value="medium">Medium</option>
                        <option value="long">Long</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Personality</label>
                      <select
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        value={botBehavior.personality}
                        onChange={(e) => setBotBehavior({ ...botBehavior, personality: e.target.value })}
                      >
                        <option value="helpful">Helpful</option>
                        <option value="concise">Concise</option>
                        <option value="detailed">Detailed</option>
                        <option value="enthusiastic">Enthusiastic</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Output Structure</label>
                      
                      <select
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        value={botBehavior.outputStructure}
                        onChange={(e) => setBotBehavior({ ...botBehavior, outputStructure: e.target.value })}
                      >
                        <option value="paragraph">Paragraph</option>
                        <option value="bullets">Bullets</option>
                      </select>
                    </div>
                    <div className="col-span-2 mt-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Do's (What the AI should always do)
                      </label>
                      <input
                        type="text"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter what the AI should do"
                        value={botBehavior.dos}
                        onChange={(e) => setBotBehavior({ ...botBehavior, dos: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2 mt-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Don'ts (What the AI should never do)
                      </label>
                      <input
                        type="text"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Enter what the AI should avoid"
                        value={botBehavior.donts}
                        onChange={(e) => setBotBehavior({ ...botBehavior, donts: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={() => setIsModalOpen(false)} disabled={isLoading}>
                  Cancel
                </button>
                <button type="submit" className="submit-button" disabled={isLoading}>
                  {isLoading ? (isEditMode ? 'Updating...' : 'Adding...') : isEditMode ? 'Update Connection' : 'Add Connection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}