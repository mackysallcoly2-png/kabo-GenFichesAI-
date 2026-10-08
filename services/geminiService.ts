import { GenerationRequest, PedagogicalSheet, SheetType } from "../types";

export const generatePedagogicalSheet = async (
  request: GenerationRequest & { type?: SheetType }
): Promise<PedagogicalSheet> => {
  let response: Response;
  try {
    response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });
  } catch {
    throw new Error("Impossible de joindre le service de génération.");
  }

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.error || "La génération a échoué.");
  }
  return result as PedagogicalSheet;
};
