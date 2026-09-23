// =====================================================
// J.A.R.V.I.S MOBILE EDITION
// =====================================================

"use strict";


// =====================================================
// DOM
// =====================================================

const chat = document.getElementById("chat");
const input = document.getElementById("msg");
const sendBtn = document.getElementById("send");
const micBtn = document.getElementById("mic-btn");


// =====================================================
// CHECK UI
// =====================================================

console.log("JARVIS SCRIPT LOADED");

console.log("Chat:", chat);
console.log("Input:", input);
console.log("Send:", sendBtn);
console.log("Mic:", micBtn);


// =====================================================
// API KEY
// =====================================================

let API_KEY = localStorage.getItem("jarvis_key");

if (!API_KEY) {

    API_KEY = prompt("Enter your Gemini API Key:");

    if (API_KEY) {
        API_KEY = API_KEY.trim();
        localStorage.setItem("jarvis_key", API_KEY);
    }
}


// =====================================================
// GEMINI MODELS
// =====================================================

const MODELS = [
    "gemini-3.6-flash",
    "gemini-flash-latest"
];


// =====================================================
// JARVIS SYSTEM PROMPT
// =====================================================

const SYSTEM_PROMPT = `
You are J.A.R.V.I.S.

You are a helpful mobile AI assistant.

Rules:

1. If the user speaks Telugu, reply in Telugu.
2. If the user speaks English, reply in English.
3. If the user mixes Telugu and English, understand naturally.
4. Keep replies clear and useful.
5. Do not claim that you controlled the phone unless an actual phone-control feature performed the action.
`;


// =====================================================
// CHAT FUNCTION
// =====================================================

function addMessage(text, type) {

    if (!chat) {
        console.error("Chat element not found");
        return null;
    }

    const div = document.createElement("div");

    div.className = "msg " + type;

    div.textContent = text;

    chat.appendChild(div);

    chat.scrollTop = chat.scrollHeight;

    return div;
}


// =====================================================
// TEST MESSAGE
// =====================================================

function testButton() {

    addMessage(
        "J.A.R.V.I.S: Button is working.",
        "ai"
    );

}


// =====================================================
// GEMINI
// =====================================================

async function callGemini(text) {

    if (!API_KEY) {
        throw new Error("Gemini API Key missing.");
    }

    let lastError = null;

    for (const model of MODELS) {

        try {

            console.log(
                "Trying model:",
                model
            );

            const url =
                "https://generativelanguage.googleapis.com/v1beta/models/" +
                model +
                ":generateContent?key=" +
                encodeURIComponent(API_KEY);


            const body = {

                systemInstruction: {
                    parts: [
                        {
                            text: SYSTEM_PROMPT
                        }
                    ]
                },

                contents: [
                    {
                        role: "user",

                        parts: [
                            {
                                text: text
                            }
                        ]
                    }
                ]

            };


            const response = await fetch(
                url,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify(body)
                }
            );


            const data = await response.json();


            if (!response.ok) {

                lastError = new Error(
                    data?.error?.message ||
                    "Gemini API Error"
                );

                console.error(
                    model,
                    lastError.message
                );

                continue;
            }


            const reply =
                data?.candidates?.[0]
                    ?.content
                    ?.parts
                    ?.map(part => part.text || "")
                    .join("")
                    .trim();


            if (reply) {

                return reply;

            }


            lastError =
                new Error(
                    "Empty Gemini response."
                );

        }

        catch (error) {

            lastError = error;

            console.error(
                "Gemini error:",
                error
            );

        }

    }


    throw (
        lastError ||
        new Error("Gemini request failed.")
    );

}


// =====================================================
// ASK JARVIS
// =====================================================

async function askJarvis(text) {

    if (!text) {
        return;
    }


    const thinking =
        addMessage(
            "J.A.R.V.I.S: Thinking...",
            "ai"
        );


    try {

        const reply =
            await callGemini(text);


        if (thinking) {

            thinking.textContent =
                "J.A.R.V.I.S: " + reply;

        }


        speak(reply);

    }

    catch (error) {

        console.error(
            "JARVIS ERROR:",
            error
        );


        if (thinking) {

            thinking.textContent =
                "J.A.R.V.I.S: ERROR - " +
                error.message;

        }

    }

}


// =====================================================
// SEND
// =====================================================

function sendMessage() {

    console.log("SEND CLICKED");


    if (!input) {

        console.error(
            "Input element not found"
        );

        return;
    }


    const text =
        input.value.trim();


    if (!text) {

        return;
    }


    addMessage(
        "YOU: " + text,
        "user"
    );


    input.value = "";


    askJarvis(text);

}


// =====================================================
// SEND BUTTON
// =====================================================

if (sendBtn) {

    sendBtn.addEventListener(
        "click",
        function () {

            console.log(
                "SEND BUTTON CLICK"
            );

            sendMessage();

        }
    );

}
else {

    console.error(
        "SEND BUTTON NOT FOUND"
    );

}


// =====================================================
// ENTER KEY
// =====================================================

if (input) {

    input.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );

}


// =====================================================
// SPEECH RECOGNITION
// =====================================================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


let recognition = null;

let listening = false;


if (SpeechRecognition) {

    recognition =
        new SpeechRecognition();


    recognition.lang =
        "te-IN";


    recognition.continuous =
        false;


    recognition.interimResults =
        false;


    recognition.maxAlternatives =
        1;


    recognition.onstart =
        function () {

            console.log(
                "MIC STARTED"
            );

            listening = true;


            if (micBtn) {

                micBtn.classList.add(
                    "listening"
                );

            }

        };


    recognition.onresult =
        function (event) {

            console.log(
                "VOICE RESULT"
            );


            const text =
                event
                    .results[0][0]
                    .transcript
                    .trim();


            if (!text) {
                return;
            }


            addMessage(
                "YOU: " + text,
                "user"
            );


            askJarvis(text);

        };


    recognition.onerror =
        function (event) {

            console.error(
                "MIC ERROR:",
                event.error
            );


            if (
                event.error ===
                "not-allowed"
            ) {

                addMessage(
                    "J.A.R.V.I.S: Please allow microphone permission.",
                    "ai"
                );

            }

        };


    recognition.onend =
        function () {

            console.log(
                "MIC STOPPED"
            );


            listening = false;


            if (micBtn) {

                micBtn.classList.remove(
                    "listening"
                );

            }

        };

}
else {

    console.error(
        "Speech Recognition NOT supported"
    );

}


// =====================================================
// MIC BUTTON
// =====================================================

if (micBtn) {

    micBtn.addEventListener(
        "click",
        function () {

            console.log(
                "MIC BUTTON CLICK"
            );


            if (!recognition) {

                addMessage(
                    "J.A.R.V.I.S: Voice recognition is not supported in this browser.",
                    "ai"
                );

                return;
            }


            if (listening) {

                recognition.stop();

                return;

            }


            try {

                speechSynthesis.cancel();

                recognition.start();

            }

            catch (error) {

                console.error(
                    "MIC START ERROR:",
                    error
                );

            }

        }
    );

}
else {

    console.error(
        "MIC BUTTON NOT FOUND"
    );

}


// =====================================================
// TEXT TO SPEECH
// =====================================================

let voices = [];


function loadVoices() {

    if (
        !("speechSynthesis" in window)
    ) {

        return;
    }


    voices =
        speechSynthesis.getVoices();

}


loadVoices();


if (
    "speechSynthesis" in window
) {

    speechSynthesis.onvoiceschanged =
        loadVoices;

}


function speak(text) {

    if (
        !("speechSynthesis" in window)
    ) {

        return;
    }


    if (!text) {
        return;
    }


    speechSynthesis.cancel();


    const utterance =
        new SpeechSynthesisUtterance(
            text
        );


    utterance.lang =
        "te-IN";


    utterance.rate =
        1;


    utterance.pitch =
        0.9;


    utterance.volume =
        1;


    const teluguVoice =
        voices.find(
            voice =>
                voice.lang &&
                voice.lang
                    .toLowerCase()
                    .startsWith("te")
        );


    if (teluguVoice) {

        utterance.voice =
            teluguVoice;

    }


    speechSynthesis.speak(
        utterance
    );

}


// =====================================================
// STARTUP
// =====================================================

console.log(
    "================================"
);

console.log(
    "J.A.R.V.I.S ONLINE"
);

console.log(
    "SEND:", !!sendBtn
);

console.log(
    "MIC:", !!micBtn
);

console.log(
    "VOICE:", !!recognition
);

console.log(
    "================================"
);
