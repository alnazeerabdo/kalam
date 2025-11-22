const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { audio, language } = JSON.parse(event.body);

        if (!audio) {
            return { statusCode: 400, body: JSON.stringify({ error: "No audio provided" }) };
        }

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Prepare the prompt based on language
        const langPrompt = language === 'ar-SA'
            ? "Transcribe the following audio to Arabic text. Return ONLY the text, no other commentary."
            : "Transcribe the following audio to English text. Return ONLY the text, no other commentary.";

        // Generate content
        const result = await model.generateContent([
            langPrompt,
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
            body: JSON.stringify({ text }),
        };

    } catch (error) {
        console.error("Error processing audio:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to process audio", details: error.message }),
        };
    }
};
