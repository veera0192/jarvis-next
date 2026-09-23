/* =========================================================
   J.A.R.V.I.S AI ASSISTANT
   Gemini AI + Telugu Voice Recognition + TTS
   Mobile Edition
   ========================================================= */


/* =========================================================
   1. GEMINI API KEY
   ========================================================= */

let API_KEY = localStorage.getItem("jarvis_key");

if (API_KEY) {
    API_KEY = API_KEY.trim();
}

if (!API_KEY) {

    API_KEY = prompt(
        "Enter your Gemini API Key:"
    );

    if (API_KEY) {

        API_KEY = API_KEY.trim();

        localStorage.setItem(
            "jarvis_key",
            API_KEY
        );
    }
}


/* =========================================================
   2. GEMINI MODELS
   ========================================================= */

const MODELS = [

    // Primary
    "gemini-3.8-flash",

    // Backup
    "gemini-3.6-flash",

    // Final fallback
    "gemini-flash-latest"

];


/* =========================================================
   3. JARVIS SETTINGS
   ========================================================= */

const JARVIS_SYSTEM_PROMPT = `
You are J.A.R.V.I.S, a helpful personal AI assistant.

Your personality:
- Calm
- Intelligent
- Professional
- Friendly
- Concise
- Helpful

Language behavior:
- If the user speaks Telugu, reply in Telugu.
- If the user speaks English, reply in English.
- If the user mixes Telugu and English, understand the meaning and reply naturally.
- Do not unnecessarily repeat the user's question.

You are running inside a mobile web application.

Important:
- Never claim that you performed an Android action unless the application actually performed it.
- If a requested mobile action is not currently connected to the application, clearly say that the action is not connected yet.
`;


/* =========================================================
   4. DOM ELEMENTS
   ========================================================= */

const chat = document.getElementById("chat");

const input = document.getElementById("msg");

const micBtn = document.getElementById("mic-btn");

const sendBtn = document.getElementById("send");


/* =========================================================
   5. STATE
   ========================================================= */

let isListening = false;

let isThinking = false;

let conversationHistory = [];


/* =========================================================
   6. CHAT DISPLAY
   ========================================================= */

function add(text, who) {

    if (!chat) {
        console.warn("Chat element not found.");
        return null;
    }

    const div = document.createElement("div");

    div.className = "msg " + who;

    div.innerText = text;

    chat.appendChild(div);

    chat.scrollTop = chat.scrollHeight;

    return div;
}


/* =========================================================
   7. GEMINI API
   ========================================================= */

async function callGemini(promptText) {

    if (!API_KEY) {

        throw new Error(
            "Gemini API Key not found."
        );
    }


    const userText = String(promptText || "").trim();


    if (!userText) {

        throw new Error(
            "Please enter a message."
        );
    }


    let lastError =
        new Error("Gemini API request failed.");


    /*
       Try models one by one.
    */

    for (const model of MODELS) {

        try {

            console.log(
                "Trying Gemini model:",
                model
            );


            const url =
                "https://generativelanguage.googleapis.com/v1beta/models/" +
                model +
                ":generateContent?key=" +
                encodeURIComponent(API_KEY);


            /*
               Add user message to temporary history
            */

            const requestContents = [

                ...conversationHistory,

                {
                    role: "user",

                    parts: [
                        {
                            text: userText
                        }
                    ]
                }

            ];


            const response = await fetch(

                url,

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        systemInstruction: {

                            parts: [
                                {
                                    text:
                                        JARVIS_SYSTEM_PROMPT
                                }
                            ]

                        },

                        contents:
                            requestContents

                    })

                }

            );


            let data = null;


            try {

                data = await response.json();

            } catch (jsonError) {

                throw new Error(
                    "Invalid response from Gemini API."
                );
            }


            /*
               API ERROR
            */

            if (!response.ok || data?.error) {

                const message =
                    data?.error?.message ||
                    "Gemini API Error: " +
                    response.status;


                lastError =
                    new Error(message);


                console.error(
                    "Gemini model failed:",
                    model,
                    message
                );


                /*
                   Retry on temporary errors
                */

                const retryable =
                    response.status === 408 ||
                    response.status === 429 ||
                    response.status === 500 ||
                    response.status === 502 ||
                    response.status === 503 ||
                    response.status === 504 ||
                    /high demand/i.test(message) ||
                    /temporar/i.test(message) ||
                    /quota/i.test(message) ||
                    /rate limit/i.test(message) ||
                    /unavailable/i.test(message);


                if (retryable) {

                    continue;
                }


                /*
                   Invalid model/API key etc.
                   Try next model only when useful.
                */

                if (
                    response.status === 400 ||
                    response.status === 404
                ) {

                    continue;
                }


                throw lastError;
            }


            /*
               Extract Gemini response
            */

            const reply =
                data?.candidates?.[0]?.content?.parts
                    ?.map(part => part?.text || "")
                    .join("")
                    .trim();


            if (!reply) {

                /*
                   Check finish reason
                */

                const finishReason =
                    data?.candidates?.[0]?.finishReason;


                throw new Error(
                    finishReason
                        ? "Gemini stopped with: " +
                          finishReason
                        : "Gemini returned an empty response."
                );
            }


            /*
               Save conversation
            */

            conversationHistory.push({

                role: "user",

                parts: [
                    {
                        text: userText
                    }
                ]

            });


            conversationHistory.push({

                role: "model",

                parts: [
                    {
                        text: reply
                    }
                ]

            });


            /*
               Keep history small
               Prevent unlimited browser memory
            */

            if (conversationHistory.length > 20) {

                conversationHistory =
                    conversationHistory.slice(-20);

            }


            console.log(
                "Gemini response received from:",
                model
            );


            return reply;

        }


        catch (error) {

            lastError = error;


            console.error(
                "Gemini error:",
                model,
                error
            );


            /*
               Try next model
           
