"use strict";

// ============================================
// J.A.R.V.I.S. MOBILE EDITION v3.0
// Telugu Voice + AI Chat
// ============================================

const BACKEND_URL =
  "https://script.google.com/macros/s/AKfycbz-pIVQwKxbFDtOFnUUXVwWcxUU8Iylt6Nni3k6yvqT5TwsrwHoOH8P3xXKC4M-Hu0j/exec";

document.addEventListener("DOMContentLoaded", () => {

  const chat = document.getElementById("chat");
  const input = document.getElementById("msg");
  const sendButton = document.getElementById("send");

  if (!chat || !input || !sendButton) {
    console.error("JARVIS: HTML elements missing.");
    return;
  }

  // ============================================
  // CREATE MICROPHONE BUTTON
  // ============================================

  let micButton = document.getElementById("mic");

  if (!micButton) {
    micButton = document.createElement("button");
    micButton.id = "mic";
    micButton.type = "button";
    micButton.textContent = "🎙️";
    micButton.title = "Telugu Voice";

    sendButton.parentNode.insertBefore(
      micButton,
      sendButton
    );
  }

  // ============================================
  // ADD MESSAGE TO CHAT
  // ============================================

  function addMessage(text, sender) {

    const message = document.createElement("div");

    message.className =
      sender === "user"
        ? "user-message"
        : "jarvis-message";

    message.textContent = text;

    chat.appendChild(message);
    chat.scrollTop = chat.scrollHeight;
  }

  // ============================================
  // LOADING MESSAGE
  // ============================================

  function showLoading() {

    const loading = document.createElement("div");

    loading.id = "jarvis-loading";
    loading.className = "jarvis-message";
    loading.textContent = "J.A.R.V.I.S.: Thinking...";

    chat.appendChild(loading);
    chat.scrollTop = chat.scrollHeight;
  }

  function removeLoading() {

    const loading =
      document.getElementById("jarvis-loading");

    if (loading) {
      loading.remove();
    }
  }

  // ============================================
  // CALL GOOGLE APPS SCRIPT BACKEND
  // ============================================

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
      throw new Error(
        "Network error: " + response.status
      );
    }

    const responseText = await response.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch (error) {
      throw new Error(
        "Backend returned an invalid response."
      );
    }

    if (!data.success) {
      throw new Error(
        data.error || "Gemini backend error."
      );
    }

    return data.reply || "Reply not received.";

  }

  // ============================================
  // SEND MESSAGE
  // ============================================

  async function sendMessage() {

    const message = input.value.trim();

    if (!message || sendButton.disabled) {
      return;
    }

    sendButton.disabled = true;
    input.disabled = true;

    addMessage("YOU: " + message, "user");

    input.value = "";

    showLoading();

    try {

      const reply = await askJarvis(message);

      removeLoading();

      addMessage(
        "J.A.R.V.I.S.: " + reply,
        "jarvis"
      );

    } catch (error) {

      removeLoading();

      addMessage(
        "J.A.R.V.I.S. ERROR: " + error.message,
        "jarvis"
      );

      console.error("JARVIS ERROR:", error);

    } finally {

      sendButton.disabled = false;
      input.disabled = false;
      input.focus();

    }

  }

  // ============================================
  // SEND BUTTON
  // ============================================

  sendButton.addEventListener(
    "click",
    sendMessage
  );

  // ============================================
  // ENTER KEY
  // ============================================

  input.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {

      event.preventDefault();
      sendMessage();

    }

  });

  // ============================================
  // TELUGU VOICE RECOGNITION
  // ============================================

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {

    micButton.disabled = true;
    micButton.textContent = "❌";

    console.warn(
      "Voice recognition is not supported."
    );

  } else {

    const recognition = new SpeechRecognition();

    recognition.lang = "te-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    micButton.addEventListener("click", () => {

      try {

        recognition.start();

        micButton.textContent = "🔴";
        micButton.disabled = true;

      } catch (error) {

        console.log(
          "Voice recognition is already running."
        );

      }

    });

    recognition.onresult = (event) => {

      const spokenText =
        event.results[0][0].transcript;

      input.value = spokenText;

    };

    recognition.onend = () => {

      micButton.textContent = "🎙️";
      micButton.disabled = false;

    };

    recognition.onerror = (event) => {

      console.error(
        "Voice recognition error:",
        event.error
      );

      micButton.textContent = "🎙️";
      micButton.disabled = false;

    };

  }

  console.log(
    "J.A.R.V.I.S. v3.0 is ready."
  );

});
      
