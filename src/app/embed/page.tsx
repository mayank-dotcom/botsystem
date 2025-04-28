"use client"
import React, { useEffect, useState } from "react";
import Script from 'next/script';

export default function EmbedPage() {
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    // Set the origin in client-side
    setOrigin(process.env.NEXT_PUBLIC_SITE_URL || window.location.origin);
    console.log("Embed page loaded");
  }, []);

  return (
    <div className="embed-container">
      <h1>Chatbot Embed Script</h1>
      <p>Add the following script tag to your website to embed the chatbot:</p>
      <pre>
        {`<script src="${origin}/embed.js"></script>`}
      </pre>
      <p>To manually specify a URL for the chatbot to use (instead of the current page URL):</p>
      <pre>
        {`<script src="${origin}/embed.js" data-url="https://example.com/your-target-page"></script>`}
      </pre>
      <p>Then add this div where you want the chatbot to appear:</p>
      <pre>{`<div id="embedded-chatbot"></div>`}</pre>
    </div>
  );
}