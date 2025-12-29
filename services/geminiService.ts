
import { GoogleGenAI, Type } from "@google/genai";
import { GameTheme } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateGameTheme = async (userPrompt?: string): Promise<GameTheme> => {
  const prompt = userPrompt 
    ? `Generate a memory game theme based on: ${userPrompt}. Include 8 unique items.` 
    : "Generate a fun and visually distinct theme for a memory card game (e.g., Space Odyssey, Enchanted Forest, Cyberpunk City). Include 8 unique items for the theme.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            emoji: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "8 unique, descriptive nouns related to the theme"
            }
          },
          required: ["name", "items", "emoji"]
        }
      }
    });

    const theme = JSON.parse(response.text.trim()) as GameTheme;
    // Ensure we have exactly 8 items for the grid
    if (theme.items.length < 8) {
      const placeholders = ["Star", "Moon", "Sun", "Cloud", "Rain", "Snow", "Wind", "Storm"];
      theme.items = [...theme.items, ...placeholders.slice(0, 8 - theme.items.length)];
    }
    return theme;
  } catch (error) {
    console.error("Error generating theme:", error);
    // Fallback theme
    return {
      name: "Classic Fruits",
      emoji: "🍎",
      items: ["Apple", "Banana", "Cherry", "Dragonfruit", "Elderberry", "Fig", "Grape", "Honeydew"]
    };
  }
};
