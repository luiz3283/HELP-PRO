import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

const getAiClient = () => {
  if (ai) return ai;

  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.warn("Gemini API Key is missing. Odometer reading will not work.");
    return null;
  }

  ai = new GoogleGenAI({ apiKey });
  return ai;
};

export const analyzeOdometer = async (base64Image: string): Promise<number | null> => {
  try {
    const client = getAiClient();
    if (!client) {
        console.error("Gemini Client not initialized (Missing API Key).");
        return null;
    }

    const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data
            }
          },
          {
            text: "Analyze this image of a motorcycle dashboard. Locate the odometer reading (total kilometers). Return ONLY the numeric value of the mileage. If you cannot clearly see a number, return '0'. Do not include units like 'km'."
          }
        ]
      }
    });

    const text = response.text?.trim();
    if (!text) return null;

    const numberStr = text.replace(/[^0-9.]/g, '');
    const mileage = parseFloat(numberStr);

    return isNaN(mileage) ? null : mileage;
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return null;
  }
};