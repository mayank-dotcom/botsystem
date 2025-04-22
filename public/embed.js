(function() {
  // Configuration
  const config = {
    apiBaseUrl: window.location.origin, // Will use the host site as base for API calls
    containerId: 'embedded-chatbot',
    chatbotStyles: `
      #embedded-chatbot-container {
        position: fixed;
        bottom: 20px;
        left: 25rem;
        width: 30rem!important;
        height: 500px;
        border-radius: 10px;
        border: 2px solid #4f46e5;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        overflow: hidden;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        background: white;
      }
      #embedded-chatbot-header {
        background: #4f46e5;
        color: white;
        padding: 10px 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      #embedded-chatbot-title {
        font-weight: bold;
        font-size: 16px;
      }
      #embedded-chatbot-toggle {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 20px;
      }
      #embedded-chatbot-iframe {
        flex: 1;
        width: 100%;
        border: none;
      }
      #embedded-chatbot-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: #4f46e5;
        color: white;
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
      
    `
  };

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
    button.addEventListener('click', toggleChatbot);
    document.body.appendChild(button);
    return button;
  }

  // Create chatbot container
  function createChatbotContainer() {
    const container = document.createElement('div');
    container.id = 'embedded-chatbot-container';
    container.classList.add('embedded-chatbot-hidden');
    
    // Create header
    const header = document.createElement('div');
    header.id = 'embedded-chatbot-header';
    
    const title = document.createElement('div');
    title.id = 'embedded-chatbot-title';
    title.textContent = 'AI Assistant';
    
    const toggle = document.createElement('button');
    toggle.id = 'embedded-chatbot-toggle';
    toggle.innerHTML = '&times;';
    toggle.addEventListener('click', toggleChatbot);
    
    header.appendChild(title);
    header.appendChild(toggle);
    
    // Create iframe with URL parameters to pass the embedding site information
    const iframe = document.createElement('iframe');
    iframe.id = 'embedded-chatbot-iframe';
    
    // Get current page URL and title
    const currentUrl = encodeURIComponent(window.location.href);
    const pageTitle = encodeURIComponent(document.title);
    
    // Append URL parameters to the iframe src
    iframe.src = `http://localhost:3000/user-side?embedded=true&embedUrl=${currentUrl}&embedTitle=${pageTitle}`;
    
    // Assemble container
    container.appendChild(header);
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

  // Initialize the embedded chatbot
  function init() {
    // Check if FontAwesome is loaded, if not, load it
    if (!document.querySelector('link[href*="fontawesome"]')) {
      const fontAwesome = document.createElement('link');
      fontAwesome.rel = 'stylesheet';
      fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
      document.head.appendChild(fontAwesome);
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
      chatButton.classList.add('embedded-chatbot-hidden');
      chatContainer.classList.remove('embedded-chatbot-hidden');
      
      // Remove fixed positioning and shadows for in-page embedding
      chatContainer.style.position = 'relative';
      chatContainer.style.bottom = 'auto';
      chatContainer.style.right = 'auto';
      chatContainer.style.width = '100%';
      chatContainer.style.height = '500px'; /* Reduced from 600px to 500px */
      
      // Move the chatbot into the target container
      targetContainer.appendChild(chatContainer);
    }
  }

  // Run initialization when DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();