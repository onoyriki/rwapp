
import { GoogleGenAI } from "@google/genai";
import { Resident } from "../types";

export const analyzeResidentsWithAI = async (residents: Resident[], prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Format data for AI context
  const contextData = residents.map(r => ({
    name: r.name,
    rt: r.rt_number,
    gender: r.gender,
    occupation: r.occupation,
    status: r.status,
    age: new Date().getFullYear() - new Date(r.birth_date).getFullYear()
  }));

  const systemInstruction = `
    Anda adalah asisten AI untuk pengurus RW (Rukun Warga). 
    Anda memiliki akses ke data kependudukan berikut dalam format JSON.
    Tugas Anda adalah menjawab pertanyaan pengurus tentang statistik, demografi, atau bantuan pencarian data.
    Berikan jawaban yang ramah, profesional, dan dalam Bahasa Indonesia yang baik.
    Gunakan format Markdown untuk jawaban Anda.
    
    Data Penduduk: ${JSON.stringify(contextData)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "Maaf, saya tidak bisa memproses permintaan tersebut saat ini.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Terjadi kesalahan saat menghubungi asisten AI.";
  }
};
