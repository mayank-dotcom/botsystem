

"use client"
import './userside.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect, useRef } from 'react'
import { toast } from "react-hot-toast"
import React from 'react';
import axios from 'axios';
import { useSearchParams } from 'next/navigation';

export default function Userside() {
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

  const generateUserId = () => {
    return "user_" + Math.random().toString(36).substr(2, 9);
  };

  // Check if we're in an iframe
  const [isEmbedded, setIsEmbedded] = useState(false);
  // Add state for embedding information
  const [embeddedInfo, setEmbeddedInfo] = useState({ url: '', title: '' });
  const searchParams = useSearchParams();

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
    }
  }, [searchParams]);

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
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [isEmbedded]);

  const run = async () => {
    try {
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
          rank: user.rank
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
    <div id={containerClass}>
      {/* Display embedding information if available */}
      {/* {isEmbedded && embeddedInfo.url && (
        <div style={{ fontSize: '12px', padding: '5px', color: '#666', borderBottom: '1px solid #eee' }}>
          Embedded on: {embeddedInfo.title || embeddedInfo.url}
        </div>
      )} */}
      
      <div id='chatsection'>
        {/* Map through the entire chat history */}
        {chatHistory.map((item, index) => (
          <React.Fragment key={index}>
            <div id='chatbox1'>
              <div id='resp'>{item.question}</div>
            </div>
            <div id='chatbox2'>
              <div id='resp2'>
                <i className="fa-solid fa-bolt" id="bolt" style={{color:"black",border:"2px solid",borderRadius:"15px",padding:"4px 6px 4px 6px", scale:"90%", fontSize:"15px"}}></i>  
                <ul className="bullet-list" style={{ listStyleType: "disc", paddingLeft: "64px", color: "white!important" }}>
                  {item.response.split('\n')
                    .filter(line => line.trim() !== '')
                    .map((line, lineIndex) => (
                      <li
                        key={`${index}-${lineIndex}`}
                        style={{ color: "white", marginBottom: "5px" }}
                        dangerouslySetInnerHTML={{ __html: line }}
                      />
                    ))}
                </ul>
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
        <div ref={chatEndRef} /> {/* Reference for auto-scrolling */}
      </div>
      <div id="inputcontainer">
        <div className="input-group dropup" id='inbar'>
          <input 
            type="text" 
            className="form-control" 
            placeholder='Enter your query and select document name' 
            aria-label="Text input with segmented dropdown button" 
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
            disabled={loading}
          >
            <i className="fa-solid fa-bolt"></i>
          </button>
          <button 
            type="button" 
            className="btn btn-outline-secondary dropdown-toggle dropdown-toggle-split" 
            data-bs-toggle="dropdown" 
            aria-expanded="false" 
            id='arrowbt'
          >
            <span className="visually-hidden">Toggle Dropdown</span>
          </button>
          <ul className="dropdown-menu dropdown-menu-end" id='ranksel' style={{backgroundColor: "white!important"}}>
            <li id="one" onClick={() => setUser({...user, rank: 1})}>1</li>
            <li id="two" onClick={() => setUser({...user, rank: 2})}>2</li>
            <li id="three" onClick={() => setUser({...user, rank: 3})}>3</li>
          </ul>
        </div>
      </div>
    </div>
  );
}