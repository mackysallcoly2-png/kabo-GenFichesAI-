import { GoogleGenAI, Type } from "@google/genai";
import { GenerationRequest, SheetType } from "../types";

const cleanJsonString = (str: string): string => {
  const jsonMatch = str.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : str;
};

export const generatePedagogicalSheet = async (request: GenerationRequest & { type?: SheetType }) => {
  const { activity, gradeLevel, topic, languages, type = SheetType.LESSON } = request;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const languagesStr = languages.join(', ');

  const systemInstruction = `Tu es l'Expert de référence du Ministère de l'Éducation Nationale du Sénégal (CEB/APC).
  
  TA MISSION : Générer une fiche pédagogique complète.
  ÉLÉMENT CRITIQUE : Tu dois impérativement inclure une "TRACE ÉCRITE" (Résumé de la leçon).
  - Pour CI/CP : 1 à 2 phrases très simples.
  - Pour CE1/CE2 : Un court paragraphe structuré.
  - Pour CM1/CM2 : Une synthèse complète avec des points clés (Je retiens).
  
  Format multilingue : "${languagesStr}". Sépare les langues par un slash (/) pour chaque champ.
  
  STRUCTURE APC :
  - Domaine, Sous-domaine, Discipline, Activité, CB, Palier, OA.
  - Objectif Spécifique (OS).
  - Trace écrite (Résumé structuré).
  - Étapes de la leçon (Mise en train, Situation, Construction, Évaluation).`;

  const prompt = `Génère la fiche pédagogique (Type: ${type}) pour la leçon suivante :
  Classe : ${gradeLevel}
  Activité : ${activity}
  Titre : ${topic}
  Langues : ${languagesStr}
  
  Assure-toi que la "contentSummary" contient la trace écrite complète que les élèves devront copier.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            domain: { type: Type.STRING },
            subDomain: { type: Type.STRING },
            discipline: { type: Type.STRING },
            activity: { type: Type.STRING },
            competence: { type: Type.STRING },
            level: { type: Type.STRING },
            oa: { type: Type.STRING },
            contentSummary: { type: Type.STRING, description: "La trace écrite / résumé de la leçon" },
            specificObjective: { type: Type.STRING },
            duration: { type: Type.STRING },
            reference: { type: Type.STRING },
            material: {
              type: Type.OBJECT,
              properties: {
                collective: { type: Type.STRING },
                individual: { type: Type.STRING }
              }
            },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  objective: { type: Type.STRING },
                  teacherActivity: { type: Type.STRING },
                  studentActivity: { type: Type.STRING }
                },
                required: ["name", "objective", "teacherActivity", "studentActivity"]
              }
            }
          },
          required: ["title", "domain", "subDomain", "competence", "contentSummary", "specificObjective", "steps"]
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Réponse vide de l'IA.");
    
    const data = JSON.parse(cleanJsonString(text));
    
    return {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
      type: type,
      subject: data.activity || activity,
      gradeLevel
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Erreur lors de la génération. Veuillez vérifier la connexion ou les paramètres.");
  }
};