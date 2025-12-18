
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractionResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function extractInvoiceData(file: File): Promise<ExtractionResult> {
  const model = 'gemini-3-flash-preview';
  
  const base64Data = await fileToBase64(file);
  
  const prompt = `
    Analyze this document and extract all data PAGE BY PAGE.
    For each page in the document:
    1. Identify all key-value pairs (Invoice #, Date, Totals, etc.).
    2. Identify all tables found on that specific page.
    3. Ignore company header/sender details.
    4. Provide the data structured by page number.
    5. If a table spans multiple pages, extract the part of the table that appears on each page separately within its respective page object.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pageNumber: { type: Type.INTEGER },
                  fields: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        label: { type: Type.STRING },
                        value: { type: Type.STRING }
                      },
                      required: ["label", "value"]
                    }
                  },
                  tables: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        tableName: { type: Type.STRING },
                        headers: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING }
                        },
                        rows: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                          }
                        }
                      },
                      required: ["tableName", "headers", "rows"]
                    }
                  }
                },
                required: ["pageNumber", "fields", "tables"]
              }
            }
          },
          required: ["pages"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data received from Gemini");
    
    return JSON.parse(text) as ExtractionResult;
  } catch (error: any) {
    console.error("Gemini Extraction Error:", error);
    throw new Error(error.message || "Failed to extract data from invoice.");
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
}
