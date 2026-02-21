import { GoogleGenAI, Type } from "@google/genai";

export interface LuminaInsight {
  category: string;
  priority: 'low' | 'medium' | 'high';
  summary: string;
  nextSteps: string[];
}

function getAI(customKey?: string) {
  const apiKey = customKey || import.meta.env.VITE_GEMINI_API_KEY || "";
  return new GoogleGenAI({ apiKey });
}

export async function analyzeThought(text: string, customKey?: string, lang: 'fr' | 'en' = 'fr'): Promise<LuminaInsight> {
  const ai = getAI(customKey);
  const systemInstruction = lang === 'fr' 
    ? "Vous êtes Lumina, un système d'exploitation de vie intelligent. Catégorisez les pensées en 'travail', 'personnel', 'créatif' ou 'santé'. Fournissez un résumé et 2-3 étapes concrètes suivantes."
    : "You are Lumina, an intelligent life operating system. Categorize thoughts into 'work', 'personal', 'creative', or 'health'. Provide a summary and 2-3 actionable next steps.";
  
  const prompt = lang === 'fr'
    ? `Analysez cette pensée et extrayez des informations structurées : "${text}"`
    : `Analyze this thought and extract structured insights: "${text}"`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          priority: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
          summary: { type: Type.STRING },
          nextSteps: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["category", "priority", "summary", "nextSteps"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function generateDailyFocus(context: string, customKey?: string, lang: 'fr' | 'en' = 'fr'): Promise<string> {
  const ai = getAI(customKey);
  const prompt = lang === 'fr'
    ? `Basé sur ces pensées récentes : ${context}, quel devrait être l'objectif principal pour aujourd'hui ? Restez inspirant et faites moins de 30 mots.`
    : `Based on these recent thoughts: ${context}, what should be the primary focus for today? Keep it inspiring and under 30 words.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });
  
  const defaultFocus = lang === 'fr' 
    ? "Concentrez-vous sur votre tâche la plus importante aujourd'hui."
    : "Focus on your most impactful task today.";

  return response.text || defaultFocus;
}

export async function validateApiKey(key: string): Promise<boolean> {
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    // Try a very simple, low-token call to verify the key
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "hi",
      config: { maxOutputTokens: 1 }
    });
    return !!response.text;
  } catch (error) {
    console.error("API Key validation failed:", error);
    return false;
  }
}


