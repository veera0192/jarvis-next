"use strict";

// ==========================================
// J.A.R.V.I.S. MOBILE EDITION v2.0
// ==========================================

const BACKEND_URL =
  "https://script.google.com/macros/s/AKfycbz-pIVQwKxbFDtOFnUUXVwWcxUU8Iylt6Nni3k6yvqT5TwsrwHoOH8P3xXKC4M-Hu0j/exec";

// Wait until HTML is fully loaded
document.addEventListener("DOMContentLoaded", () => {

  const chat = document.getElementById("chat");
  const input = document.getElementById("msg");
  const sendButton = document.getElementById("send");

  // Check required HTML elements
  if (!chat || !input || !sendButton) {
    console.error("JARVIS: Required HTML elements not found.");
    return;
  }

  // Add message to chat
  function addMessage(text, sender) {
    const message = document.createElement("div");

    message.className =
      sender === "user" ? "user-message" : "jarvis-message";

    message.textContent = text;

    chat.appendChild(message);
    chat.scrollTop = chat.scrollHeight;
  }

  // Show temporary loading message
  function showLoading() {
    const loading = document.createElement("div");

    loading.className = "jarvis-message";
    loading.id = "jarvis-loading";
    loading.textContent = "J.A.R.V.I.S.: Thinking...";

    chat.appendChild(loading);
    chat.scrollTop = chat.scrollHeight;
  }

  // Remove loading message
  function removeLoading() {
    const loading = document.getElementById("jarvis-loading");

    if (loading) {
      loading.remove();
    }
  }

  // Send message to Google Apps Script backend
  async function askJarvis(message) {

    const response = await fetch(BACKEND_URL, {
      method: "POST",

      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },

      body: JSON.stringify({
        message: message
      })
    });

    if (!response.ok) {
      throw new Error("Network error: " + response.status);
    }

    const responseText = await response.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch (error) {
      throw new Error("Invalid response from backend.");
    }

    if (!data.success) {
      throw new Error(data.error || "Unknown backend error.");
    }

    return data.reply || "J.A.R.V.I.S.: No reply received.";
  }

  // Main send function
  async function sendMessage() {

    const message = input.value.trim();

    if (!message) {
      return;
    }

    // Prevent multiple clicks
    sendButton.disabled = true;
    input.disabled = true;

    addMessage("YOU: " + message, "user");
    input.value = "";

    showLoading();

    try {

      const reply = await askJarvis(message);

      removeLoading();
      addMessage("J.A.R.V.I.S.: " + reply, "jarvis");

    } catch (error) {

      removeLoading();

      addMessage(
        "J.A.R.V.I.S. ERROR: " + error.message,
        "jarvis"
      );

      console.error("JARVIS Error:", error);

    } finally {

      sendButton.disabled = false;
      input.disabled = false;
      input.focus();

    }
  }

  // SEND button click
  sendButton.addEventListener("click", sendMessage);

  // Send message using Enter key
  input.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }

  });

  console.log("J.A.R.V.I.S. v2.0 is ready.");

});
