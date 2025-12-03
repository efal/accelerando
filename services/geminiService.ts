import { GoogleGenAI, Type } from "@google/genai";
import { AIGeneratedRoutine } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getPracticeAdvice = async (userGoal: string): Promise<AIGeneratedRoutine> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a metronome practice configuration for the following goal: "${userGoal}".
      Return a JSON object containing startBpm, increaseAmount (how much to increase speed), and increaseIntervalBars (how many bars between increases). 
      Also provide a very short, motivating description in German.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            startBpm: { type: Type.INTEGER },
            increaseAmount: { type: Type.INTEGER },
            increaseIntervalBars: { type: Type.INTEGER },
            description: { type: Type.STRING }
          },
          required: ["startBpm", "increaseAmount", "increaseIntervalBars", "description"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIGeneratedRoutine;
    }
    throw new Error("No response text");
  } catch (error) {
    console.error("Gemini Error:", error);
    // Fallback default
    return {
      startBpm: 60,
      increaseAmount: 5,
      increaseIntervalBars: 4,
      description: "Fehler bei der KI-Anfrage. Standardwerte geladen."
    };
  }
};
