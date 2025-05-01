'use client';
import './trainin.css';

import { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { 
  DocumentArrowUpIcon,
  LinkIcon,
  Cog6ToothIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

import { logActivity } from '@/helpers/activityLogger';

interface TrainingDocument {
  id: number | string;
  name: string;
  type: 'pdf' | 'url';
  url: string;
  uploadedAt: string;
}

export default function TrainingManagement() {
  const [documents, setDocuments] = useState<TrainingDocument[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [botBehavior, setBotBehavior] = useState({
    tone: 'professional',
    responseLength: 'medium',
    personality: 'helpful',
    outputStructure:"paragraph",
    dos: '',  // Changed from array to string
    donts: '' // Changed from array to string
  });
  
  // URL state variables
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // PDF upload state variables
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [pdfResponse, setPdfResponse] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  
  // Database documents state
  const [dbDocuments, setDbDocuments] = useState<TrainingDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [orgId,setOrgId] = useState<string>("");
  const [updatingBehavior, setUpdatingBehavior] = useState<boolean>(false);

  // Fetch documents from database on component mount
  // Modify this useEffect to depend on orgId
  useEffect(() => {
    // Only fetch documents if orgId is available
    if (orgId) {
      fetchDocumentsFromDb();
    }
  }, [orgId]); // Add orgId as a dependency

  // Fetch user's organization ID on component mount
  // Add these state variables at the component level
  const [adminId, setAdminId] = useState<string>(""); // Keep this for backward compatibility
  const [adminEmail, setAdminEmail] = useState<string>("");
  const [adminRole, setAdminRole] = useState<string>("admin");
  
  // Then modify the useEffect
  useEffect(() => {
    const fetchOrgId = async () => {
      try {
        const response = await fetch('/api/get-user-id');
        const data = await response.json();
        if (data.success) {
          // Set admin ID
          setAdminId(data.userId);
          
          // Get the organization ID and user details associated with the user
          const orgResponse = await fetch('/api/get-org-details', {
            headers: {
              'user-id': data.userId
            }
          });
          const orgData = await orgResponse.json();
          if (orgData.success) {
            setOrgId(orgData.orgId);
            // Set admin details if available in the response
            if (orgData.adminEmail) setAdminEmail(orgData.adminEmail);
            if (orgData.adminDesignation) setAdminRole(orgData.adminDesignation);
          } else {
            console.error('Failed to fetch organization details');
          }
        }
      } catch (error: any) {
        console.error('Error in initialization sequence:', 
          error?.response?.data || error?.message || 'Unknown error'
        );
      }
    };

    fetchOrgId();
  }, []);
  
  // Add pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  
  // Function to fetch documents from the database
  const fetchDocumentsFromDb = async (page = currentPage) => {
    setIsLoading(true);
    let retries = 3;
    
    while (retries > 0) {
      try {
        const response = await axios.get('/api/documents', {
          params: {
            page: page,
            limit: pageSize,
            orgId: orgId
          },
          timeout: 10000 // 10 second timeout
        });
        
        // Set pagination information
        setCurrentPage(response.data.currentPage);
        setTotalPages(response.data.totalPages);
        
        // Transform the data to match our TrainingDocument interface
        const formattedDocs = response.data.documents
          .map((doc: any) => {
            // Extract name from content field if available
            let displayName = 'Unknown Document';
            if (doc.content) {
              // Get first two words from content
              const words = doc.content.split(' ');
              if (words.length >= 2) {
                displayName = `${words[0]} ${words[1]}`;
              } else if (words.length === 1) {
                displayName = words[0];
              }
            } else if (doc.metadata?.filename) {
              displayName = doc.metadata.filename;
            }
            
            return {
              id: doc._id,
              name: displayName,
              type: doc.metadata?.source_type || 'pdf',
              url: doc.metadata?.url || '',
              uploadedAt: doc.metadata?.created_at || new Date().toISOString()
            };
          });
        
        setDbDocuments(formattedDocs);
        break; // Exit loop on success
        
      } catch (error) {
        retries--;
        console.error('Error fetching documents:', error);
        
        if (retries > 0) {
          // Wait for 2 seconds before retrying
          await new Promise(resolve => setTimeout(resolve, 2000));
          toast.error(`Connection issue, retrying... (${retries} attempts left)`);
        } else {
          toast.error('Failed to load documents after multiple attempts');
        }
      }
    }
    
    setIsLoading(false);
  };
  
  // Function to handle page changes
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchDocumentsFromDb(newPage);
    }
  };
  
  // Function to delete a document from the database
  const deleteDocument = async (docId: string) => {
    try {
      await axios.delete(`/api/documents/${docId}`);
      // Remove from local state
      const deletedDoc = dbDocuments.find(doc => doc.id === docId);
      setDbDocuments(dbDocuments.filter(doc => doc.id !== docId));
      toast.success('Document removed successfully');
      
      // Log the document deletion activity
      try {
        // For document deletion
        try {
          // For document deletion
          try {
            await logActivity({
              action: 'Document removed',
              adminId: adminId, // Keep for backward compatibility
              adminEmail: adminEmail,
              adminDesignation: adminRole,
              orgId: orgId,
              collectionType: 'assignment_collection',
              details: { documentId: docId, documentName: deletedDoc?.name }
            });
          } catch (logError) {
            console.error('Failed to log activity:', logError);
          }
        } catch (logError) {
          console.error('Failed to log activity:', logError);
        }
      } catch (logError) {
        console.error('Failed to log activity:', logError);
      }
      
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  // URL submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      const res = await axios.post(
        "/api/chunks",
        { 
          source: { type: "url", url },
          orgId: orgId
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setResponse(res.data.message);
      
      // Log the URL submission activity
      try {
        // For URL submissions
        try {
          await logActivity({
            action: 'URL reference added',
            adminId: adminId, // Keep for backward compatibility
            adminEmail: adminEmail,
            adminDesignation: adminRole,
            orgId: orgId,
            collectionType: 'assignment_collection',
            details: { url: url }
          });
        } catch (logError) {
          console.error('Failed to log activity:', logError);
        }
      } catch (logError) {
        console.error('Failed to log activity:', logError);
        // Don't block the main flow if logging fails
      }
      
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string; details?: string }>;
      setError(
        axiosError.response?.data.details ||
        axiosError.response?.data.error ||
        "An error occurred"
      );
    } finally {
      setLoading(false);
    }
};

  // PDF file change handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setPdfFile(selectedFile || null);
  };
  
  // PDF submission handler - FIXED DUPLICATE CATCH BLOCK
  const handlePdfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile) {
      setPdfError("Please select a PDF file");
      toast.error("Please select a PDF file");
      return;
    }

    // Validate file type
    if (pdfFile.type !== 'application/pdf') {
      setPdfError("Please upload a PDF file");
      toast.error("Please upload a PDF file");
      return;
    }

    setPdfLoading(true);
    setPdfResponse(null);
    setPdfError(null);

    const formData = new FormData();
    formData.append('pdf', pdfFile);
    formData.append('orgId', orgId); // Add orgId to form data

    try {
      const res = await axios.post("/api/chunks_pdf", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setPdfResponse(res.data.message);
      toast.success(res.data.message);
      
      // Add the uploaded PDF to the documents list
      const newDoc: TrainingDocument = {
        id: Date.now(),
        name: pdfFile.name,
        type: 'pdf',
        url: '',
        uploadedAt: new Date().toISOString()
      };
      setDocuments([...documents, newDoc]);
      
      // Log the PDF upload activity
      // For PDF uploads
      try {
        // Add this validation before calling logActivity
        if (!adminEmail) {
          console.warn('Admin email not available for activity logging');
          // Optionally show a toast warning
          toast.error('Some actions may not be fully logged due to missing user details');
          return; // Skip logging if details aren't available
        }
        
        // Then proceed with logActivity
        await logActivity({
          action: 'PDF document uploaded',
          adminId: adminId, // Keep for backward compatibility
          adminEmail: adminEmail,
          adminDesignation: adminRole,
          orgId: orgId,
          collectionType: 'assignment_collection',
          details: { fileName: pdfFile.name, fileSize: pdfFile.size }
        });
      } catch (logError) {
        console.error('Failed to log activity:', logError);
      }
      
      // After successful upload, refresh documents from DB
      fetchDocumentsFromDb();
      
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string; details?: string }>;
      const errorMsg = axiosError.response?.data.details ||
        axiosError.response?.data.error ||
        "An error occurred";
      setPdfError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setPdfLoading(false);
    }
  };

  // Bot behavior update handler
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
        orgId: orgId
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

  return (
    <div className="space-y-6" id='training-container'>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Training Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id='dataoptions'>
        {/* Document Upload Section */}
        <div className="space-y-6" id="pdf_url">
          {/* PDF Upload - REPLACED WITH FUNCTIONAL COMPONENT */}
          <div className="bg-white shadow rounded-lg" id='pdf-upload'>
            <div className="p-4 border-b">
              <span><h2 className="text-lg font-medium">Upload PDF Documents</h2></span>
              <span>
                <button
                  id='pdf_button'
                  type="button"
                  onClick={handlePdfSubmit}
                  disabled={pdfLoading || !pdfFile}
                  className="w-1/2 px-4 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
                >
                  {pdfLoading ? "Processing..." : "Add PDF"}
                </button>
              </span>
            </div>
          
            <div className="p-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <DocumentArrowUpIcon className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PDF files only</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleFileChange}
                    disabled={pdfLoading}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* URL Input */}
          <div className="bg-white shadow rounded-lg" id='url-input'>
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium">Add URL References</h2>
            </div>
            <div className="p-4">
              <form  className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                    URL
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                      <LinkIcon className="h-5 w-5" />
                    </span>
                    <input
                      type="url"
                      name="url"
                      id="url"
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  disabled={loading || !url}>
                  {loading ? "Processing..." : "Add URL"}
          
                 
                </button>
              </form>
          
              {response && toast.success(response)}
              {error && toast.error(error)}
            </div>
          </div>
        </div>

      
      </div>

      {/* Uploaded Documents List - FIXED PLACEMENT */}
      <div className="bg-white shadow rounded-lg" id='uploaded-documents'>
        <div className="p-4 border-b" >
          <h2 className="text-lg font-medium">Uploaded Documents</h2>
        </div>
        <div className="divide-y divide-gray-200" id='upto'>
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              Loading documents...
            </div>
          ) : dbDocuments.length > 0 ? (
            dbDocuments.map((doc) => (
              <div key={doc.id} className="p-4" id='docs'>
                <div className="flex items-center">
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-gray-50">
                    {doc.type === 'pdf' ? (
                      <DocumentTextIcon className="h-5 w-5 text-indigo-500" id='pdf_ic'/>
                    ) : (
                      <LinkIcon className="h-5 w-5 text-indigo-500" />
                    )}
                  </div>
                  <div className="ml-4 flex-1" id='doclist'>
                    <p id="doc-name"className="text-sm font-medium text-gray-900">{doc.name}...</p>
                    <p className="text-sm text-gray-500">
                     • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    className="ml-4 text-sm text-red-600 hover:text-red-900"
                    id='remove_bt'
                    onClick={() => deleteDocument(doc.id.toString())}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              No documents found in database
            </div>
          )}
        </div>
        
        {/* Add pagination controls */}
        <div className="p-4 border-t flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
            >
              Next
            </button>
          </div>
          
          <button
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            onClick={() => fetchDocumentsFromDb(1)}
            disabled={isLoading}
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
