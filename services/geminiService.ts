import { GoogleGenAI } from "@google/genai";
import { Quiz } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  generateCourseDetails: async (title: string, rawUrl: string): Promise<{ description: string, tags: string[], quiz: Quiz }> => {
    try {
      const prompt = `
        I am creating a technical course for engineers titled "${title}". 
        The content is related to this URL (or type of content): "${rawUrl}".
        
        Please generate:
        1. A compelling, professional 2-sentence description.
        2. A list of 3-5 relevant technical tags.
        3. A short quiz with 3 multiple-choice questions to test understanding.
        
        Return the response in this exact JSON structure:
        {
          "description": "string",
          "tags": ["string"],
          "quiz": {
            "questions": [
              {
                "id": "q1",
                "text": "Question text here?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswerIndex": 0
              }
            ]
          }
        }
        
        Do NOT use markdown code blocks. Just raw JSON string.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text || "{}";
      const data = JSON.parse(text);
      
      return {
        description: data.description || "No description generated.",
        tags: data.tags || ["General"],
        quiz: data.quiz || { questions: [] }
      };

    } catch (error) {
      console.error("Gemini API Error:", error);
      return {
        description: "Could not generate description automatically. Please add one manually.",
        tags: ["Custom"],
        quiz: { questions: [] }
      };
    }
  },

  getDailyQuote: async (): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Give me a very short, motivating quote for a software reliability engineer about learning and stability. Max 20 words.",
        });
        return response.text || "Keep learning, keep building.";
    } catch (e) {
        return "Continuous improvement is the path to perfection.";
    }
  }
};