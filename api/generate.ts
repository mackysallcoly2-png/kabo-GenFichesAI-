import { GoogleGenAI, Type } from "@google/genai";
import { SheetType } from "../types";

type GenerationRequest = {
  activity: string;
  gradeLevel: string;
  topic: string;
  languages: string[];
  type?: SheetType;
};

const cleanJsonString = (value: string): string => {
  const match = value.match(/\{[\s\S]*\}/);
  return match ? match[0] : value;
};

const readRequestBody = async (req: any): Promise<unknown> => {
  if (req.body !== undefined) return req.body;

  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 32_000) throw new Error("La requête est trop volumineuse.");
    chunks.push(buffer);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
};

const isGenerationRequest = (value: unknown): value is GenerationRequest => {
  if (!value || typeof value !== "object") return false;
  const request = value as Record<string, unknown>;
  return (
    typeof request.activity === "string" &&
    request.activity.length > 0 &&
    request.activity.length <= 120 &&
    typeof request.gradeLevel === "string" &&
    request.gradeLevel.length > 0 &&
    request.gradeLevel.length <= 80 &&
    typeof request.topic === "string" &&
    request.topic.length > 0 &&
    request.topic.length <= 200 &&
    Array.isArray(request.languages) &&
    request.languages.length > 0 &&
    request.languages.length <= 3 &&
    request.languages.every((language) => typeof language === "string" && language.length <= 40) &&
    (request.type === undefined || Object.values(SheetType).includes(request.type as SheetType))
  );
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  let request: GenerationRequest;
  try {
    const body = await readRequestBody(req);
    if (!isGenerationRequest(body)) {
      return res.status(400).json({ error: "Les paramètres de génération sont invalides." });
    }
    request = body;
  } catch {
    return res.status(400).json({ error: "Le corps de la requête est invalide." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "Le service de génération n'est pas configuré." });
  }

  const { activity, gradeLevel, topic, languages } = request;
  const type = request.type || SheetType.LESSON;
  const languagesStr = languages.join(", ");
  const systemInstruction = `Tu aides les enseignants à préparer des fiches pédagogiques APC pour le Sénégal.
Utilise les rubriques CB, Palier, OA, OS et Contenu. Les résultats doivent être relus et validés par l'enseignant avant usage.

Pour une leçon, le contenu est une trace écrite structurée et les étapes suivent : Mise en train, Révision, Situation, Construction, Évaluation.
Pour un exercice, le contenu donne les consignes générales et les étapes décrivent cinq exercices progressifs. Dans chaque étape, teacherActivity contient l'énoncé de l'exercice et studentActivity une réponse attendue ou un élément de correction.
Pour une évaluation, le contenu est une situation d'évaluation avec une consigne unique ; les étapes contiennent cinq items progressifs, pour un total de 10 points.

Langues demandées : ${languagesStr}. Pour chaque champ textuel, sépare les langues par " / ". N'invente pas de référence documentaire précise si elle n'est pas connue.`;

  const prompt = type === SheetType.EVALUATION
    ? `Génère une fiche d'évaluation APC pour la classe ${gradeLevel}, activité ${activity}, sur le sujet "${topic}". Produis 5 items progressifs, avec un barème total de 10 points.`
    : type === SheetType.EXERCISE
      ? `Génère une fiche d'exercices APC pour la classe ${gradeLevel}, activité ${activity}, sur le sujet "${topic}". Produis 5 exercices progressifs et leurs réponses attendues.`
      : `Génère une fiche de leçon APC pour la classe ${gradeLevel}, activité ${activity}, sur le sujet "${topic}".`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
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
            cb: { type: Type.STRING },
            palier: { type: Type.STRING },
            oa: { type: Type.STRING },
            os: { type: Type.STRING },
            contenu: { type: Type.STRING },
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
        }
      }
    });

    if (!response.text) throw new Error("Réponse vide de l'IA.");
    const data = JSON.parse(cleanJsonString(response.text));
    return res.status(200).json({
      ...data,
      id: Math.random().toString(36).slice(2, 11),
      createdAt: Date.now(),
      type,
      subject: data.activity || activity,
      gradeLevel
    });
  } catch (error) {
    console.error("Gemini generation failed:", error);
    return res.status(502).json({ error: "La génération a échoué. Réessayez dans quelques instants." });
  }
}
