const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
    // 1. CORS Headers (for safety, though Netlify handles same-origin)
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    // 2. Handle Preflight Options
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        // 3. Check API Key
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("Error: GEMINI_API_KEY is missing in environment variables.");
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: "Server Configuration Error: GEMINI_API_KEY is missing." })
            };
        }

        // 4. Parse Body
        let body;
        try {
            body = JSON.parse(event.body);
        } catch (e) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON body" }) };
        }

        const { audio, language } = body;
        if (!audio) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing 'audio' data" }) };
        }

        // 5. Call Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Transcribe the following audio accurately. The language is likely ${language || 'ar-SA'}. Return ONLY the transcribed text, no explanations.`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: "audio/webm",
                    data: audio
                }
            }
        ]);

        const response = await result.response;
        const text = response.text();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ text })
        };

    } catch (error) {
        console.error("Gemini API Error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: `Gemini API Failed: ${error.message || error.toString()}`
            })
        };
    }
};
