"use client"

import { useEffect } from 'react';
import Script from 'next/script';

export default function EmbedPage() {
  useEffect(() => {
    // This page is just a container for the embed script
    console.log("Embed page loaded");
  }, []);

  return (
    <div className="embed-container">
      <h1>Chatbot Embed Script</h1>
      <p>Add the following script tag to your website to embed the chatbot:</p>
      <pre>
        {`<script src="${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/embed.js"></script>`}
      </pre>
      <p>Then add this div where you want the chatbot to appear:</p>
      <pre>{`<div id="embedded-chatbot"></div>`}</pre>
    </div>
  );
}