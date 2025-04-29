

"use client"
import './userside.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect, useState, useRef, Suspense } from 'react'
import { toast } from "react-hot-toast"
import axios from 'axios';
import { useSearchParams } from 'next/navigation';

// Inner component that uses useSearchParams
function UsersideInner() {
  // State for userId and question
  interface UserState {
    question: string;
    userId: string;
    rank: number;
  }

  interface HistoryItem {
    question: string;
    response: string;
    timestamp?: Date;
  }

  // Define interface for document items
  interface DocumentItem {
    id: number;
    title: string;
  }

  const generateUserId = () => {
    return "user_" + Math.random().toString(36).substr(2, 9);
  };

  // Check if we're in an iframe
  const [isEmbedded, setIsEmbedded] = useState(false);
  // Add state for embedding information
  const [embeddedInfo, setEmbeddedInfo] = useState({ url: '', title: '' });
  // Add state for available documents
  const [availableDocuments, setAvailableDocuments] = useState<DocumentItem[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const searchParams = useSearchParams();
  // Add state for idle timer
  const [idleTime, setIdleTime] = useState(0);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Detect if we're in an iframe
    try {
      setIsEmbedded(window.self !== window.top);
    } catch (e) {
      // If we can't access window.top due to cross-origin, we're in an iframe
      setIsEmbedded(true);
    }

    // Check if the page is embedded and get embedding information
    const embedded = searchParams.get('embedded');
    const embedUrl = searchParams.get('embedUrl');
    const embedTitle = searchParams.get('embedTitle');
    
    if (embedded === 'true' && embedUrl) {
      setEmbeddedInfo({
        url: decodeURIComponent(embedUrl),
        title: embedTitle ? decodeURIComponent(embedTitle) : ''
      });
      
      // Log the embedding information
      console.log('Chatbot embedded on:', decodeURIComponent(embedUrl));
      
      // Fetch documents for this URL
      fetchDocumentsForUrl(decodeURIComponent(embedUrl));
    }
  }, [searchParams]);
  
  // Function to fetch documents for a specific URL
  const fetchDocumentsForUrl = async (url: string) => {
    try {
      setIsLoadingDocuments(true);
      
      // Determine the base URL for API calls
      let apiBaseUrl = '';
      if (isEmbedded) {
        // When embedded, we need to use the parent origin or a fixed API endpoint
        apiBaseUrl = window.location.origin;
      }
      
      const response = await axios.post(`${apiBaseUrl}/api/documents-for-url`, {
        url: url
      });
      
      if (response.data.documents && response.data.documents.length > 0) {
        setAvailableDocuments(response.data.documents);
        console.log("Documents fetched for URL:", response.data.documents);
        
        // Auto-select the first document if available
        if (response.data.documents.length > 0) {
          setUser(prev => ({ ...prev, rank: response.data.documents[0].id }));
        }
      } else {
        // If no documents found for this URL, show an empty list instead of defaults
        setAvailableDocuments([]);
        console.log("No specific documents found for URL");
        
        // Reset rank to 0 since no documents are available
        setUser(prev => ({ ...prev, rank: 0 }));
      }
    } catch (error) {
      console.error("Error fetching documents for URL:", error);
      // Show empty list on error instead of defaults
      setAvailableDocuments([]);
      
      // Reset rank to 0 since no documents are available
      setUser(prev => ({ ...prev, rank: 0 }));
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const [user, setUser] = useState<UserState>(() => {
    // Check if userId exists in localStorage, otherwise generate a new one
    const storedUserId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    const userId = storedUserId || generateUserId();
    if (!storedUserId && typeof window !== "undefined") {
      localStorage.setItem("userId", userId); // Persist userId in localStorage
    }
    return {
      question: "",
      userId, // Initialize userId
      rank: 0
    };
  });

  const [loading, setLoading] = React.useState(false);
  const [chatHistory, setChatHistory] = React.useState<HistoryItem[]>([]);
  const [disable, setDisable] = React.useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat whenever history updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Handle messages from parent window when embedded
  useEffect(() => {
    if (isEmbedded) {
      const handleMessage = (event: MessageEvent) => {
        // Validate origin if needed
        if (event.data && event.data.type === 'CHATBOT_COMMAND') {
          const { command, payload } = event.data;
          
          if (command === 'SEND_MESSAGE' && payload && payload.message) {
            // Set the message and rank, then trigger the run function
            setUser(prev => ({ ...prev, question: payload.message, rank: payload.rank || 1 }));
            // We need to call run in the next tick after state is updated
            setTimeout(() => run(), 0);
          }
          
          // Handle the RESET_CHAT command from parent window
          if (command === 'RESET_CHAT') {
            console.log("Received RESET_CHAT command from parent window");
            setChatHistory([]);
            setIdleTime(0);
            
            // If we have embedded URL info, refetch documents
            if (embeddedInfo.url) {
              fetchDocumentsForUrl(embeddedInfo.url);
            }
            
            // Notify parent that we've reset the chat
            window.parent.postMessage({
              type: 'CHATBOT_RESET',
              message: 'Chat reset due to inactivity'
            }, '*');
          }
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [isEmbedded]);

  // Setup idle timer
  useEffect(() => {
    // Reset idle timer whenever there's user activity
    const resetIdleTimer = () => {
      setIdleTime(0);
      
      // Clear existing timer
      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current);
      }
      
      // Start a new timer that increments idleTime every second
      idleTimerRef.current = setInterval(() => {
        setIdleTime(prevIdleTime => prevIdleTime + 1);
      }, 1000);
    };
    
    // Reset timer on initial load
    resetIdleTimer();
    
    // Add event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetIdleTimer);
    });
    
    // Cleanup function
    return () => {
      // Remove all event listeners
      events.forEach(event => {
        window.removeEventListener(event, resetIdleTimer);
      });
      
      // Clear the interval
      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current);
      }
    };
  }, []);
  
  // Check if idle time exceeds 60 seconds (1 minute) and reset chat if it does
  useEffect(() => {
    if (idleTime >= 60 && chatHistory.length > 0) {
      console.log("User idle for 1 minute, resetting chat interface");
      setChatHistory([]);
      setIdleTime(0);
      
      // If embedded, notify the parent window that the chat has been reset
      if (isEmbedded) {
        window.parent.postMessage({
          type: 'CHATBOT_RESET',
          message: 'Chat reset due to inactivity'
        }, '*');
      }
      
      // Refetch documents if we're in embedded mode
      if (isEmbedded && embeddedInfo.url) {
        fetchDocumentsForUrl(embeddedInfo.url);
      }
    }
  }, [idleTime, chatHistory.length]);

  const run = async () => {
    try {
      // Reset idle timer when user sends a message
      setIdleTime(0);
      
      if (user.question.length > 0 && user.rank > 0 && user.userId.length > 0) {
        
        setLoading(true);
        const currentQuestion = user.question;
        
        // Clear input field immediately after submission
        setUser({ ...user, question: "" });
        
        // Add user question to chat history immediately
        setChatHistory(prevHistory => [
          ...prevHistory, 
          { question: currentQuestion, response: "" }
        ]);

        console.log("Sending request to /api/use");
        
        // Determine the base URL for API calls
        let apiBaseUrl = '';
        if (isEmbedded) {
          // When embedded, we need to use the parent origin or a fixed API endpoint
          apiBaseUrl = window.location.origin;
        }
        
        const result = await axios.post(`${apiBaseUrl}/api/use/`, {
          question: currentQuestion,
          userId: user.userId, // Include userId in the request
          rank: user.rank,
          embedUrl: isEmbedded && embeddedInfo.url ? embeddedInfo.url : null // Pass the embedded URL
        });
      
        if (result.data.text !== undefined) {
          console.log(result.data.text);
          setLoading(false);
          
          // Update the last chat item with the response
          setChatHistory(prevHistory => {
            const updatedHistory = [...prevHistory];
            updatedHistory[updatedHistory.length - 1].response = result.data.text;
            return updatedHistory;
          });

          // If embedded, send the response back to the parent
          if (isEmbedded) {
            window.parent.postMessage({
              type: 'CHATBOT_RESPONSE',
              response: result.data.text,
              question: currentQuestion
            }, '*');
          }
        } else {
          console.log("API error or rate limit reached");
          setLoading(false);
          
          // Update the last chat item with the error message
          const errorMessage = "Please wait a few seconds then retry. Either there is a network connectivity issue or you might have hit the hugging face api limit. If reaching the limit is the case than please try next day once the API limit resets.";
          setChatHistory(prevHistory => {
            const updatedHistory = [...prevHistory];
            updatedHistory[updatedHistory.length - 1].response = errorMessage;
            return updatedHistory;
          });

          // If embedded, send the error back to the parent
          if (isEmbedded) {
            window.parent.postMessage({
              type: 'CHATBOT_ERROR',
              error: errorMessage,
              question: currentQuestion
            }, '*');
          }
        }
      } else {
        setDisable(true);
        toast.error("Please enter a question and select a topic before submitting.");
        console.log("Please enter a question and select a topic before submitting.");
      }

    } catch (error) {
      console.error("Full error:", error);
      if (axios.isAxiosError(error)) {
        console.error("Axios Error:", error.response?.data);
        console.error("Status:", error.response?.status);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.post("/api/chat_history", {
          userId: user.userId, // Pass the userId to the API
        });
        
        if (response.data.latestHistory && response.data.latestHistory.length > 0) {
          console.log("History fetched successfully", response.data.latestHistory);
          setChatHistory(response.data.latestHistory);
        } else {
          console.log("No history found for the given userId");
        }

      } catch (error) {
        console.log("fetchHistory function failed", error);
      }
    };
    
    fetchHistory();
  }, [user.userId]);

  // Add a class to the container when embedded
  const containerClass = isEmbedded ? 'user-container-embedded' : 'user-container';

  return (
    <div className={containerClass}>
      <div id='chatsection'>
        {/* Show document selection at the start if no chat history */}
        {chatHistory.length === 0 && (
          <div id='chatbox2'>
            <div id='resp2'>
              <i className="fa-solid fa-bolt" id="bolt" style={{color:"black",border:"2px solid",borderRadius:"15px",padding:"4px 6px 4px 6px", scale:"90%", fontSize:"15px"}}></i>  
              <div className="response-content" style={{ paddingLeft: "64px", color: "white", whiteSpace: "pre-wrap" }}>
                <p style={{ marginBottom: "10px" }}>What do you want to discuss today ?</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {isLoadingDocuments ? (
                    <p>Loading documents...</p>
                  ) : (
                    availableDocuments.length > 0 ? (
                      availableDocuments.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => setUser({...user, rank: doc.id})}
                          style={{
                            padding: "8px 16px",
                            background: user.rank === doc.id ? "#4f46e5" : "#374151",
                            color: "white",
                            border: "none",
                            borderRadius: "20px",
                            cursor: "pointer",
                            marginBottom: "8px"
                          }}
                        >
                          {doc.title}
                        </button>
                      ))
                    ) : (
                      <p>No documents available for this site</p>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Map through the chat history */}
        {chatHistory.map((item, index) => (
          <React.Fragment key={index}>
            <div id='chatbox1'>
              <div id='resp'>{item.question}</div>
            </div>
            <div id='chatbox2'>
              <div id='resp2'>
                <i className="fa-solid fa-bolt" id="bolt" style={{color:"black",border:"2px solid",borderRadius:"15px",padding:"4px 6px 4px 6px", scale:"90%", fontSize:"15px"}}></i>  
                <div className="response-content" style={{ paddingLeft: "64px", color: "white", whiteSpace: "pre-wrap" }}>
                  <div 
                    dangerouslySetInnerHTML={{ __html: item.response }}
                    style={{ color: "white" }}
                  />
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}
        
        {/* Loading indicator */}
        {loading && (
          <div className="typewriter">
            <div className="slide"><i></i></div>
            <div className="paper"></div>
            <div className="keyboard"></div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div id="inputcontainer">
        <div className="input-group" id='inbar'>
          <input 
            type="text" 
            className="form-control" 
            placeholder='Enter your query...' 
            aria-label="Text input with button" 
            onChange={(e) => setUser({ ...user, question: e.target.value })}
            value={user.question}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && user.rank > 0) {
                run();
              }
            }}
          />
          <button 
            onClick={run} 
            type="button" 
            className="btn btn-outline-secondary" 
            id='actionbt'
            disabled={loading || user.rank === 0}
          >
            <i className="fa-solid fa-bolt"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function Userside() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UsersideInner />
    </Suspense>
  );
}