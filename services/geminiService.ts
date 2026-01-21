import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
// In a production environment, this should be proxied through a backend to protect the key.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeOdometer = async (base64Image: string): Promise<number | null> => {
  try {
    // Remove the data URL prefix if present to get raw base64
    const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    const response = await ai.models.generateContent({
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

    // Clean up response to ensure it's a number
    const numberStr = text.replace(/[^0-9.]/g, '');
    const mileage = parseFloat(numberStr);

    return isNaN(mileage) ? null : mileage;
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return null;
  }
};