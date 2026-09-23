"use strict";

// ==========================================
// J.A.R.V.I.S — MOBILE EDITION
// Frontend JavaScript
// ==========================================

const BACKEND_URL =
  "https://script.google.com/macros/s/AKfycbz-pIVQwKxbFDtOFnUUXVwWcxUU8Iylt6Nni3k6yvqT5TwsrwHoOH8P3xXKC4M-Hu0j/exec";

// ==========================================
// DOM ELEMENTS
// ==========================================

const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const micBtn = document.getElementById("mic-btn");

const sendBtn =
  document.getElementById("send-btn") ||
  document.querySelector('button[type="submit"]') ||
  document.querySelector(".send-btn");

// ==========================================
// ADD MESSAGE TO CHAT
// ==========================================

function addMessage(text, sender) {
  if (!chat) return null;

  const message = document.createElement("div");

  message.className =
    sender === "user"
      ? "user-message"
      : "jarvis-message";

  message.textContent = text;

  chat.appendChild(message);
  chat.scrollTop = chat.scrollHeight;

  return message;
}

// ==========================================
// JARVIS BACKEND REQUEST
// ==========================================

async function callJarvis(message) {
  const response = await fetch(BACKEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({
      message: message
    })
  });

  const responseText = await response.text();

  let data;

  try {
    data = JSON.parse(responseText);
  } catch (error) {
    throw new Error(
      "Backend returned an invalid response."
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error || "Backend request failed."
    );
  }

  if (!data.success) {
    throw new Error(
      data.error || "JARVIS Backend Error."
    );
  }

  return data.reply || "No reply received.";
}

// ==========================================
// SEND MESSAGE
// ==========================================

async function askJarvis() {
  if (!input) return;

  const message = input.value.trim();

  if (!message) return;

  if (sendBtn) {
    sendBtn.disabled = true;
  }

  addMessage(message, "user");

  input.value = "";

  const thinkingMessage = addMessage(
    "J.A.R.V.I.S: Thinking...",
    "jarvis"
  );

  try {
    const reply = await callJarvis(message);

    if (thinkingMessage) {
      thinkingMessage.textContent =
        "J.A.R.V.I.S: " + reply;
    } else {
      addMessage(
        "J.A.R.V.I.S: " + reply,
        "jarvis"
      );
    }

  } catch (error) {
    console.error("JARVIS Error:", error);

    if (thinkingMessage) {
      thinkingMessage.textContent =
        "J.A.R.V.I.S ERROR: " + error.message;
    } else {
      addMessage(
        "J.A.R.V.I.S ERROR: " + error.message,
        "jarvis"
      );
    }

  } finally {
    if (sendBtn) {
      sendBtn.disabled = false;
    }

    input.focus();
  }
}

// ==========================================
// SEND BUTTON EVENT
// ==========================================

if (sendBtn) {
  sendBtn.addEventListener("click", function (event) {
    event.preventDefault();
    askJarvis();
  });
}

// ==========================================
// ENTER KEY EVENT
// ==========================================

if (input) {
  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      askJarvis();
    }
  });
}

// ==========================================
// VOICE INPUT
// ==========================================

let recognition = null;

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

if (SpeechRecognition && micBtn && input) {
  recognition = new SpeechRecognition();

  recognition.lang = "te-IN";
  recognition.continuous = false;
  recognition.interimResults = false;

  micBtn.addEventListener("click", function () {
    try {
      recognition.start();
    } catch (error) {
      console.log("Voice already active.");
    }
  });

  recognition.onstart = function () {
    micBtn.textContent = "🎙️";
  };

  recognition.onresult = function (event) {
    const transcript =
      event.results[0][0].transcript;

    input.value = transcript;
  };

  recognition.onerror = function (event) {
    console.error(
      "Voice Error:",
      event.error
    );
  };

  recognition.onend = function () {
    micBtn.textContent = "🎤";
  };

} else if (micBtn) {
  micBtn.addEventListener("click", function () {
    alert(
      "Voice input is not supported in this browser."
    );
  });
}

// ==========================================
// INITIAL MESSAGE
// ==========================================

if (chat && chat.children.length === 0) {
  addMessage(
    "J.A.R.V.I.S: Systems online. How may I assist you?",
    "jarvis"
  );
}

if (input) {
  input.focus();
}

console.log("J.A.R.V.I.S Frontend Loaded");
