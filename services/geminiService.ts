import { GoogleGenAI, Type } from "@google/genai";
import { GenerationRequest, SheetType } from "../types";

const cleanJsonString = (str: string): string => {
  const jsonMatch = str.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : str;
};

export const generatePedagogicalSheet = async (request: GenerationRequest & { type?: SheetType }) => {
  const { activity, gradeLevel, topic, languages, type = SheetType.LESSON } = request;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const languagesStr = languages.join(', ');

  const systemInstruction = `Tu es l'Expert de référence du Ministère de l'Éducation Nationale du Sénégal (CEB/APC).
  
  TA MISSION : Générer une fiche pédagogique ou d'évaluation complète.
  
  CRITIQUE : Toute l'information doit être extraite CONFORMÉMENT AUX GUIDES PÉDAGOGIQUES officiels du Sénégal.
  Tu dois utiliser les libellés EXACTS (CB, Palier, OA, OS, Contenu) tels que formulés dans les guides officiels.
  
  POUR LES LEÇONS (Type: LESSON) :
  - 'contenu' : La trace écrite structurée (Le résumé que l'élève retient).
  - Étapes : Mise en train, Révision, Situation, Construction, Évaluation.
  
  POUR LES ÉVALUATIONS (Type: EVALUATION) :
  - 'contenu' : La "SITUATION D'ÉVALUATION" (contexte et CONSIGNE UNIQUE).
  - Les 'steps' doivent correspondre à 5 ITEMS progressifs basés sur cette consigne.
  - Le Total du barème doit être de 10 POINTS.
  
  Format multilingue : "${languagesStr}". Sépare les langues par un slash (/) pour chaque champ.
  
  DÉCLINAISON APC SÉNÉGAL (LIBELLÉS OBLIGATOIRES) :
  - cb : Compétence de Base (texte exact du guide)
  - palier : Palier tel que défini dans le guide
  - oa : Objectif d'Apprentissage
  - os : Objectif Spécifique
  - contenu : Contenu de la leçon / Trace écrite`;

  const prompt = type === SheetType.EVALUATION 
    ? `Génère une FICHE D'ÉVALUATION (Format APC Sénégal) pour :
       Classe : ${gradeLevel}
       Activité : ${activity}
       Titre : ${topic}
       Langues : ${languagesStr}
       
       Utilise les libellés officiels du guide. 5 items sur 10 points.`
    : `Génère la fiche pédagogique (Type: LESSON) pour :
       Classe : ${gradeLevel}
       Activité : ${activity}
       Titre : ${topic}
       Langues : ${languagesStr}
       
       Récupère précisément la CB, le Palier, l'OA, l'OS et le Contenu (Trace Écrite) tels qu'ils figurent dans le guide officiel.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
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
            cb: { type: Type.STRING, description: "Compétence de base exacte du guide" },
            palier: { type: Type.STRING, description: "Palier exact du guide" },
            oa: { type: Type.STRING, description: "Objectif d'apprentissage" },
            os: { type: Type.STRING, description: "Objectif spécifique" },
            contenu: { type: Type.STRING, description: "Trace écrite / Résumé de la leçon" },
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
          required: ["title", "domain", "subDomain", "cb", "palier", "oa", "os", "contenu", "steps"]
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