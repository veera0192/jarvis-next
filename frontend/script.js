const API_URL = "https://script.google.com/macros/s/AKfycbz-pIVQwKxbFDtOFnUUXVwWcxUU8Iylt6Nni3k6yvqT5TwsrwHoOH8P3xXKC4M-Hu0j/exec";

// HTML Elements
const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const sendButton = document.getElementById("send");

// Speech Recognition
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;
let isListening = false;

// ===============================
// JARVIS TEXT TO SPEECH
// ===============================

function speak(text) {
  if (!("speechSynthesis" in window)) {
    console.log("Speech Synthesis not supported");
    return;
  }

  window.speechSynthesis.cancel();

  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "te-IN";
  speech.rate = 0.95;
  speech.pitch = 1;
  speech.volume = 1;

  window.speechSynthesis.speak(speech);
}

// ===============================
// CHAT MESSAGE DISPLAY
// ===============================

function addMessage(message, sender) {
  const messageElement = document.createElement("div");

  messageElement.className =
    sender === "user" ? "user-message" : "jarvis-message";

  messageElement.textContent = message;

  chat.appendChild(messageElement);
  chat.scrollTop = chat.scrollHeight;
}

// ===============================
// SEND MESSAGE TO BACKEND
// ===============================

async function sendMessage() {
  const message = input.value.trim();

  if (!message) {
    return;
  }

  addMessage(message, "user");

  input.value = "";
  input.disabled = true;

  addMessage("ఒక్క క్షణం... ఆలోచిస్తున్నాను.", "jarvis");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        message: message
      })
    });

    if (!response.ok) {
      throw new Error("Server Error");
    }

    const data = await response.json();

    // Remove temporary message
    const messages = chat.querySelectorAll(".jarvis-message");
    const lastMessage = messages[messages.length - 1];

    if (
      lastMessage &&
      lastMessage.textContent === "ఒక్క క్షణం... ఆలోచిస్తున్నాను."
    ) {
      lastMessage.remove();
    }

    const reply =
      data.reply ||
      data.response ||
      data.message ||
      "క్షమించండి, నాకు సమాధానం అందలేదు.";

    addMessage(reply, "jarvis");

    // Automatically speak reply
    speak(reply);

  } catch (error) {
    console.error("Error:", error);

    const messages = chat.querySelectorAll(".jarvis-message");
    const lastMessage = messages[messages.length - 1];

    if (
      lastMessage &&
      lastMessage.textContent === "ఒక్క క్షణం... ఆలోచిస్తున్నాను."
    ) {
      lastMessage.remove();
    }

    const errorMessage =
      "క్షమించండి. సర్వర్‌తో కనెక్షన్ కాలేదు.";

    addMessage(errorMessage, "jarvis");
    speak(errorMessage);

  } finally {
    input.disabled = false;
    input.focus();
  }
}

// ===============================
// SEND BUTTON
// ===============================

if (sendButton) {
  sendButton.addEventListener("click", sendMessage);
}

// Enter Key
if (input) {
  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }
  });
}

// ===============================
// VOICE RECOGNITION
// ===============================

function startVoiceRecognition() {
  if (!SpeechRecognition) {
    alert("మీ Browser Voice Recognition కి Support చేయడం లేదు.");
    return;
  }

  if (isListening) {
    recognition.stop();
    return;
  }

  recognition = new SpeechRecognition();

  recognition.lang = "te-IN";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = function () {
    isListening = true;
    console.log("JARVIS Listening...");
  };

  recognition.onresult = function (event) {
    const spokenText =
      event.results[0][0].transcript.trim();

    console.log("Voice Text:", spokenText);

    input.value = spokenText;

    // Automatically send voice text to backend
    sendMessage();
  };

  recognition.onerror = function (event) {
    console.error("Voice Error:", event.error);

    if (event.error === "not-allowed") {
      alert("Microphone Permission ఇవ్వండి.");
    }
  };

  recognition.onend = function () {
    isListening = false;
    console.log("Voice Recognition Ended");
  };

  recognition.start();
}

// ===============================
// MICROPHONE BUTTON
// ===============================

let micButton = document.getElementById("mic-button");

if (!micButton) {
  micButton = document.createElement("button");

  micButton.id = "mic-button";
  micButton.textContent = "🎤";

  micButton.style.position = "fixed";
  micButton.style.bottom = "90px";
  micButton.style.right = "20px";
  micButton.style.width = "55px";
  micButton.style.height = "55px";
  micButton.style.borderRadius = "50%";
  micButton.style.border = "none";
  micButton.style.fontSize = "24px";
  micButton.style.cursor = "pointer";
  micButton.style.zIndex = "9999";

  document.body.appendChild(micButton);
}

micButton.addEventListener("click", startVoiceRecognition);

console.log("JARVIS AI Assistant Loaded Successfully");
        
