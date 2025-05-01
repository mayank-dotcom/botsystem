(function() {
  // Configuration
  const config = {
    apiBaseUrl: window.location.origin, // Will use the host site as base for API calls
    containerId: 'embedded-chatbot',
    targetUrl: null, // New property to store manually provided URL
    idleTimeout: 60000, // 1 minute in milliseconds
    chatbotStyles: `
      #embedded-chatbot-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 450px;
        height: 500px;
        border-radius: 10px;
        border: 1px solid black;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        overflow: hidden;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        background: white;
      }
      #embedded-chatbot-header {
        display: none;
      }
      #embedded-chatbot-title {
        display: none;
      }
      #embedded-chatbot-toggle {
        position: absolute;
        top: 5px;
        right: 5px;
        background: none;
        border: none;
        color: black;
        cursor: pointer;
        font-size: 20px;
        z-index: 10000;
      }
      #embedded-chatbot-iframe {
        flex: 1;
        width: 100%;
        height: 100%;
        position: relative;
      }
      #embedded-chatbot-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: #000000;
        color: #FFD700;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        font-size: 24px;
      }
      .embedded-chatbot-hidden {
        display: none !important;
      }
      /* Add these styles to control text colors in chat boxes */
      #chatbox1 {
        color: #000000 !important; /* Black text for user's messages */
      }
      #chatbox2, #chatbox3 {
        color: #FFD700 !important; /* Gold text for chatbot's responses */
      }
      #resp, #resp2 {
        color: #FFD700 !important; /* Gold text for chatbot's responses */
      }
      #query {
        color: #000000 !important; /* Black text for user's messages */
      }
      /* Document button styles */
      .document-button, 
      button.document-btn, 
      .doc-button,
      .document-selection button {
        background-color: #FFD700 !important; /* Gold background */
        color: #000000 !important; /* Black text */
        border: 1px solid #000000 !important;
      }
      /* Target any buttons in document selection area */
      [class*="document"] button,
      [id*="document"] button,
      .doc-selector button {
        background-color: #FFD700 !important;
        color: #000000 !important;
      }
    `
  };

  // Variables for idle timer
  let idleTimer = null;
  let lastActivity = Date.now();

  // Create and inject styles
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = config.chatbotStyles;
    document.head.appendChild(style);
  }

  // Create chat button
  function createChatButton() {
    const button = document.createElement('div');
    button.id = 'embedded-chatbot-button';
    button.innerHTML = '<i class="fa-solid fa-bolt"></i>';
    button.addEventListener('click', function() {
      resetIdleTimer();
      toggleChatbot();
    });
    document.body.appendChild(button);
    return button;
  }

  // Create chatbot container
  function createChatbotContainer() {
    const container = document.createElement('div');
    container.id = 'embedded-chatbot-container';
    container.classList.add('embedded-chatbot-hidden');
    
    // Create toggle button (without header)
    const toggle = document.createElement('button');
    toggle.id = 'embedded-chatbot-toggle';
    toggle.innerHTML = '&times;';
    toggle.addEventListener('click', function() {
      resetIdleTimer();
      toggleChatbot();
    });
    
    // Create iframe with URL parameters to pass the embedding site information
    const iframe = document.createElement('iframe');
    iframe.id = 'embedded-chatbot-iframe';
    
    // Get URL information - either from config or fallback to current page
    const targetUrl = config.targetUrl || window.location.href;
    const currentUrl = encodeURIComponent(targetUrl);
    const pageTitle = encodeURIComponent(document.title);
    
    // Append URL parameters to the iframe src - use absolute URL to ensure correct routing
    iframe.src = `https://botsystem-production.up.railway.app/user-side?embedded=true&embedUrl=${currentUrl}&embedTitle=${pageTitle}`;
    
    // Assemble container (without header)
    container.appendChild(toggle);
    container.appendChild(iframe);
    
    document.body.appendChild(container);
    return container;
  }

  // Toggle chatbot visibility
  function toggleChatbot() {
    const container = document.getElementById('embedded-chatbot-container');
    const button = document.getElementById('embedded-chatbot-button');
    
    if (container.classList.contains('embedded-chatbot-hidden')) {
      container.classList.remove('embedded-chatbot-hidden');
      button.classList.add('embedded-chatbot-hidden');
    } else {
      container.classList.add('embedded-chatbot-hidden');
      button.classList.remove('embedded-chatbot-hidden');
    }
  }

  // Reset idle timer
  function resetIdleTimer() {
    lastActivity = Date.now();
    
    // Clear existing timer
    if (idleTimer) {
      clearTimeout(idleTimer);
    }
    
    // Set new timer
    idleTimer = setTimeout(handleIdle, config.idleTimeout);
  }

  // Handle idle timeout
  function handleIdle() {
    console.log("User idle for 1 minute, resetting chat interface");
    
    // Get the iframe and send a message to reset the chat
    const iframe = document.getElementById('embedded-chatbot-iframe');
    if (iframe) {
      // Send a message to the iframe content to reset the chat and show document selection
      iframe.contentWindow.postMessage({
        type: 'CHATBOT_COMMAND',
        command: 'RESET_CHAT',
        payload: {
          showDocumentSelection: true
        }
      }, '*');
      
      // If the iframe content doesn't respond, fall back to reloading it
      setTimeout(() => {
        if (iframe) {
          const currentSrc = iframe.src;
          iframe.src = currentSrc;
        }
      }, 500); // Wait 500ms for the message to be processed
    }
  }

  // Setup event listeners for user activity
  function setupIdleDetection() {
    // List of events that indicate user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Add event listeners to document
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer);
    });
    
    // Add event listeners to iframe content if possible
    const iframe = document.getElementById('embedded-chatbot-iframe');
    if (iframe && iframe.contentDocument) {
      events.forEach(event => {
        iframe.contentDocument.addEventListener(event, resetIdleTimer);
      });
    }
    
    // Start the initial timer
    resetIdleTimer();
  }

  // Initialize the embedded chatbot
  function init() {
    // Check if FontAwesome is loaded, if not, load it
    if (!document.querySelector('link[href*="fontawesome"]')) {
      const fontAwesome = document.createElement('link');
      fontAwesome.rel = 'stylesheet';
      fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
      document.head.appendChild(fontAwesome);
    }

    // Get the script tag that loaded this script
    const scriptTags = document.querySelectorAll('script');
    const currentScript = Array.from(scriptTags).find(script => 
      script.src && script.src.includes('embed.js')
    );

    // Check if the script has a data-url attribute
    if (currentScript && currentScript.dataset.url) {
      config.targetUrl = currentScript.dataset.url;
      console.log('Using manually provided URL:', config.targetUrl);
    }

    // Inject our styles
    injectStyles();
    
    // Create UI elements
    const chatButton = createChatButton();
    const chatContainer = createChatbotContainer();
    
    // Check if there's a target container specified by the user
    const targetContainer = document.getElementById(config.containerId);
    if (targetContainer) {
      // If a target container exists, we'll use that instead of the floating button
      // Don't hide the button completely - we need it to open the chat
      // chatButton.classList.add('embedded-chatbot-hidden');
      
      // Keep the chatbot hidden initially
      // container.classList.remove('embedded-chatbot-hidden');
      
      // Remove fixed positioning and shadows for in-page embedding
      chatContainer.style.position = 'relative';
      chatContainer.style.bottom = 'auto';
      chatContainer.style.right = 'auto';
      chatContainer.style.width = '90%';
      chatContainer.style.maxWidth = '350px';
      chatContainer.style.height = '550px';
      
      // Move the chatbot into the target container
      targetContainer.appendChild(chatContainer);
    }
    
    // Setup idle detection after everything is initialized
    // We need to wait a bit for the iframe to load
    setTimeout(setupIdleDetection, 1000);
    
    // Add message listener for communication with iframe
    window.addEventListener('message', function(event) {
      // Reset idle timer when we receive a message from the iframe
      // This handles user activity inside the iframe
      if (event.data && (event.data.type === 'CHATBOT_RESPONSE' || 
                         event.data.type === 'CHATBOT_RESET' ||
                         event.data.type === 'CHATBOT_ACTIVITY')) {
        resetIdleTimer();
      }
    });
  }

  // Run initialization when DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();