
require("dotenv").config();

const express = require("express");
const { GoogleGenAI } = require("@google/genai");

const app = express();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.use(express.json({ limit: "20kb" }));
app.use(express.static(__dirname));

app.post("/chat", async (req, res) => {
  try {
    const message = req.body.message;

    if (
      typeof message !== "string" ||
      !message.trim() ||
      message.length > 2000
    ) {
      return res.status(400).json({
        error: "Invalid message"
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
      config: {
        systemInstruction:
          "You are a helpful Student AI Assistant. " +
          "Explain things in simple Hindi or English."
      }
    });

    res.json({
      reply: response.text || "No response generated."
    });

  } catch (error) {
    console.error("Gemini Error:", error.message);

    res.status(500).json({
      error: "Gemini connection failed"
    });
  }
});

app.listen(3000, "127.0.0.1", () => {
  console.log("Gemini AI Chatbot is running!");
  console.log("http://localhost:3000");
});
