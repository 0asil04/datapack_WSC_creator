
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
};

export const describeImage = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const imagePart = fileToGenerativePart(base64Image, mimeType);
    const prompt = "Describe the central subject of this image in a simple, clear phrase for a text-to-image model. Only return the phrase. For example: 'a logo with a stylized eagle', 'a shield with the letters FCB'.";

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
    });
    
    const description = response.text;
    if (!description) {
        throw new Error("Não foi possível gerar uma descrição para a imagem.");
    }
    return description.trim();
  } catch (error) {
    console.error("Error describing image:", error);
    throw new Error("Falha ao analisar a imagem com a API Gemini.");
  }
};

export const generateImageWithTransparentBg = async (description: string): Promise<string> => {
  try {
    const prompt = `${description}, as a clean vector logo, high resolution, with a fully transparent background.`;
    
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio: '1:1'
        },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error("A API não retornou nenhuma imagem.");
    }
    
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return base64ImageBytes;
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Falha ao gerar a imagem com a API Gemini.");
  }
};
