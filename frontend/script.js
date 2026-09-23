/* =========================================
   J.A.R.V.I.S AI ASSISTANT
   Gemini AI + Voice Recognition + TTS
   ========================================= */

// =========================================
// 1. API KEY
// =========================================

let API_KEY = localStorage.getItem("jarvis_key");

if (!API_KEY) {
    API_KEY = prompt("Enter your Gemini API Key:");

    if (API_KEY) {
        localStorage.setItem("jarvis_key", API_KEY);
    }
}

// =========================================
// 2. GEMINI MODELS
// =========================================

const MODELS = [
    "gemini-3.6-flash",
    "gemini-flash-latest"
];

// =========================================
// 3. DOM ELEMENTS
// =========================================

const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const micBtn = document.getElementById("mic-btn");
const sendBtn = document.getElementById("send");

// =========================================
// 4. CHAT DISPLAY
// =========================================

function add(text, who) {

    if (!chat) return null;

    const div = document.createElement("div");

    div.className = "msg " + who;
    div.innerText = text;

    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;

    return div;
}

// =========================================
// 5. GEMINI API CALL
// =========================================

async function callGemini(promptText) {

    if (!API_KEY) {
        throw new Error("Gemini API Key not found.");
    }

    let lastError = new Error("Gemini API request failed.");

    for (const model of MODELS) {

        try {

            const url =
                "https://generativelanguage.googleapis.com/v1beta/models/"
                + model
                + ":generateContent?key="
                + encodeURIComponent(API_KEY);

            const response = await fetch(url, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    contents: [
                        {
                            parts: [
                                {
                                    text: promptText
                                }
                            ]
                        }
                    ]

                })

            });

            const data = await response.json();

            if (!response.ok || data.error) {

                const message =
                    data?.error?.message ||
                    "Gemini API Error: " + response.status;

                lastError = new Error(message);

                const retryable =
                    response.status === 429 ||
                    response.status === 500 ||
                    response.status === 503 ||
                    /high demand|temporar|quota|rate|unavailable/i
                        .test(message);

                if (retryable) {
                    continue;
                }

                throw lastError;
            }

            const reply =
                data?.candidates?.[0]?.content?.parts
                    ?.map(part => part.text || "")
                    .join("")
                    .trim();

            if (!reply) {
                throw new Error("Empty response from Gemini.");
            }

            return reply;

        } catch (error) {

            lastError = error;

            if (
                !/high demand|temporar|quota|rate|unavailable|429|500|503/i
                    .test(error.message)
            ) {
                throw error;
            }

        }

    }

    throw lastError;
}

// =========================================
// 6. ASK GEMINI
// =========================================

async function askGemini(promptText) {

    const thinkingMessage = add(
        "J.A.R.V.I.S: Thinking...",
        "ai"
    );

    try {

        const reply = await callGemini(promptText);

        if (thinkingMessage) {
            thinkingMessage.innerText =
                "J.A.R.V.I.S: " + reply;
        }

        speak(reply);

    } catch (error) {

        if (thinkingMessage) {

            thinkingMessage.innerText =
                "J.A.R.V.I.S: ERROR - " +
                (error.message || "Unknown Error");

        }

        console.error("Gemini Error:", error);

    }

}

// =========================================
// 7. SPEECH RECOGNITION
// =========================================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let rec = null;
let isListening = false;

if (SpeechRecognition) {

    rec = new SpeechRecognition();

    rec.lang = "te-IN";

    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {

        isListening = true;

        if (micBtn) {
            micBtn.innerText = "LISTENING...";
        }

    };

    rec.onresult = (event) => {

        const text =
            event.results?.[0]?.[0]?.transcript?.trim();

        if (!text) return;

        if (input) {
            input.value = text;
        }

        add("YOU: " + text, "user");

        if (input) {
            input.value = "";
        }

        askGemini(text);

    };

    rec.onerror = (event) => {

        console.error(
            "Speech Recognition Error:",
            event.error
        );

        if (event.error === "not-allowed") {

            add(
                "J.A.R.V.I.S: Microphone permission denied.",
                "ai"
            );

        }

    };

    rec.onend = () => {

        isListening = false;

        if (micBtn) {
            micBtn.innerText = "🎙️";
        }

    };

} else {

    if (micBtn) {
        micBtn.disabled = true;
        micBtn.innerText = "❌";
    }

    console.warn(
        "Speech Recognition is not supported."
    );

}

// =========================================
// 8. MICROPHONE BUTTON
// =========================================

if (micBtn) {

    micBtn.onclick = () => {

        if (!rec) {

            add(
                "J.A.R.V.I.S: Voice recognition is not supported.",
                "ai"
            );

            return;
        }

        if (isListening) {

            rec.stop();

            return;
        }

        try {

            rec.start();

        } catch (error) {

            console.error(
                "Microphone Start Error:",
                error
            );

        }

    };

}

// =========================================
// 9. TEXT TO SPEECH
// =========================================

let voices = [];

function loadVoices() {

    voices = window.speechSynthesis.getVoices();

}

loadVoices();

if ("onvoiceschanged" in speechSynthesis) {
    speechSynthesis.onvoiceschanged = loadVoices;
}

function speak(text) {

    if (!("speechSynthesis" in window)) {
        return;
    }

    speechSynthesis.cancel();

    const utterance =
        new SpeechSynthesisUtterance(text);

    utterance.lang = "te-IN";

    utterance.rate = 1.05;
    utterance.pitch = 0.85;
    utterance.volume = 1;

    const voice =
        voices.find(v => v.lang.toLowerCase() === "te-in") ||
        voices.find(v => v.lang.toLowerCase().startsWith("te"));

    if (voice) {
        utterance.voice = voice;
    }

    speechSynthesis.speak(utterance);

}

// =========================================
// 10. SEND MESSAGE
// =========================================

function sendMessage() {

    if (!input) return;

    const text = input.value.trim();

    if (!text) return;

    add("YOU: " + text, "user");

    input.value = "";

    askGemini(text);

}

if (sendBtn) {

    sendBtn.onclick = sendMessage;

}

// =========================================
// 11. ENTER KEY SUPPORT
// =========================================

if (input) {

    input.addEventListener("keydown", (event) => {

        if (event.key === "Enter" && !event.shiftKey) {

            event.preventDefault();

            sendMessage();

        }

    });

}

// =========================================
// 12. CLEAR API KEY
// =========================================

// Run this in the browser console
// when you want to remove the saved API key:
//
// localStorage.removeItem("jarvis_key");

console.log("J.A.R.V.I.S AI Assistant Loaded Successfully.");
