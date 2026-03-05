import { GoogleGenAI, Type } from "@google/genai";
import { QuizData, QuestionType } from "../types";

export const parseMarkdownToQuiz = async (markdownText: string): Promise<QuizData> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_api_key_here') {
    throw new Error("Google AI API Key ontbreekt. Voeg je VITE_GEMINI_API_KEY toe aan het .env bestand.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Je bent een expert in het maken van educatieve toetsen voor Canvas LMS.
    Analyseer de volgende tekst (Markdown) en extraheer een structuur voor een quiz.
    
    De tekst kan vragen bevatten, antwoorden, en eventueel punten.
    Probeer zo goed mogelijk het type vraag te bepalen:
    - Multiple Choice (één goed antwoord uit meerdere opties)
    - True/False (Waar/Niet waar)
    - Short Answer (Kort antwoord, invuloefening)
    - Essay (Open vraag)

    Als er geen punten staan vermeld, gebruik dan 1 punt als standaard.
    Als er geen titel is, bedenk een passende titel op basis van de inhoud.
    Zorg dat elke vraag minimaal één correct antwoord heeft (tenzij het een essay vraag is).
    
    Invoer tekst:
    ${markdownText}
  `;

  // We definiëren een strict schema voor de output zodat we het direct kunnen gebruiken.
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Titel van de quiz" },
          description: { type: Type.STRING, description: "Korte beschrijving of instructie" },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING, description: "De vraagstelling" },
                type: { 
                  type: Type.STRING, 
                  enum: [
                    QuestionType.MULTIPLE_CHOICE, 
                    QuestionType.TRUE_FALSE, 
                    QuestionType.SHORT_ANSWER,
                    QuestionType.ESSAY
                  ] 
                },
                points: { type: Type.NUMBER, description: "Aantal punten" },
                feedback: { type: Type.STRING, description: "Algemene feedback voor de student" },
                answers: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING, description: "Antwoord tekst" },
                      isCorrect: { type: Type.BOOLEAN, description: "Is dit het juiste antwoord?" }
                    },
                    required: ["text", "isCorrect"]
                  }
                }
              },
              required: ["text", "type", "points", "answers"]
            }
          }
        },
        required: ["title", "questions"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Geen antwoord ontvangen van AI.");

  try {
    const rawData = JSON.parse(text);
    
    // Post-processing om ID's toe te voegen die we nodig hebben voor React keys en QTI
    const processedData: QuizData = {
      ...rawData,
      questions: rawData.questions.map((q: any) => ({
        ...q,
        id: crypto.randomUUID(),
        answers: q.answers.map((a: any) => ({
          ...a,
          id: crypto.randomUUID()
        }))
      }))
    };

    return processedData;
  } catch (e) {
    console.error("Parse error", e);
    throw new Error("Kon de AI respons niet verwerken tot een geldige quiz structuur.");
  }
};