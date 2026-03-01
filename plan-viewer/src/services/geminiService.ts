const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const BASE_URL = import.meta.env.BASE_URL;

const STRUCTURAL_PROMPT = `Take the role of a highly qualified structural engineer. It is your task to analyze the attached building foundation plan and propose innovative structural optimizations. Analyze the attached photograph, and list all the advanced structural solutions that make sense for this building. Really go all out, don't miss any. Be extremely creative and innovative. Focus strictly on structural enhancements that will directly benefit the building's stability, load-bearing capacity, and longevity—think of benefits such as seismic resilience, optimized load distribution, differential settlement mitigation, material efficiency, vibration control, and advanced foundational support systems. Provide a detailed written analysis with all your proposed structural solutions, organized by category. Be thorough and technical.`;

export interface GeminiAnalysisResult {
  annotatedImageUrl: string | null;
  structuralAnalysisSummary: string | null;
}

/**
 * Converts an image URL to a Base64 string (without the data URI prefix).
 */
async function imageUrlToBase64(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Sends the plan image to the Gemini API for text-only structural analysis.
 * Returns the mock annotated image URL + the AI-generated text summary.
 */
export async function analyzeStructure(imageUrl: string): Promise<GeminiAnalysisResult> {
  const imageBase64 = await imageUrlToBase64(imageUrl);

  const payload = {
    contents: [
      {
        parts: [
          {
            text: STRUCTURAL_PROMPT,
          },
          {
            inlineData: {
              mimeType: 'image/png',
              data: imageBase64,
            },
          },
        ],
      },
    ],
  };

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();

  let structuralAnalysisSummary: string | null = null;

  const candidates = data.candidates;
  if (candidates && candidates.length > 0) {
    const parts = candidates[0].content?.parts || [];
    const textParts: string[] = [];

    for (const part of parts) {
      if (part.text) {
        textParts.push(part.text);
      }
    }

    if (textParts.length > 0) {
      structuralAnalysisSummary = textParts.join('\n\n');
    }
  }

  return {
    // Use the mock annotated image from public/
    annotatedImageUrl: `${BASE_URL}foundation-plan-annotated.png`,
    structuralAnalysisSummary,
  };
}
