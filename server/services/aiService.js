const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    case '.heic': return 'image/heic';
    case '.avif': return 'image/avif';
    case '.jfif': return 'image/jpeg';
    default: return 'image/jpeg';
  }
}

async function analyzeWound(imagePath, userNotes = '', previousAnalysis = null) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing in your .env file');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ];

  const model = genAI.getGenerativeModel({ 
    model: 'gemini-3-flash-preview',
    safetySettings 
  });

  const mimeType = getMimeType(imagePath);
  const imageData = fs.readFileSync(imagePath).toString('base64');

  let prompt = `You are an expert AI wound care assistant. Analyze this wound image carefully.
You MUST respond with ONLY valid JSON. No markdown, no code blocks, no extra text.

JSON Structure:
{
  "analysis": {
    "type": "string (e.g., Laceration, Abrasion, Puncture, Burn, Surgical, etc.)",
    "severity": "string (Mild, Moderate, Severe)",
    "attributes": {
      "redness": "string (None, Mild, Moderate, Severe)",
      "swelling": "string (None, Mild, Moderate, Severe)",
      "drainage": "string (None, Serous, Purulent, Bloody)",
      "suspectedInfection": "boolean"
    },
    "generalObservations": "string"
  },
  "treatment": {
    "immediateSteps": ["string"],
    "medications": [
      {
        "name": "string",
        "composition": "string",
        "dosage": "string",
        "timing": "string",
        "purpose": "string"
      }
    ],
    "doNots": ["string"],
    "whenToSeeDoctor": ["string"]
  }`;

  if (previousAnalysis) {
    prompt += `,
  "progress": {
    "status": "string (Improving, Stable, Worsening)",
    "comparedToPrevious": "string (Detailed comparison)",
    "percentageHealed": "number (0-100)"
  }`;
  } else {
    prompt += `,
  "progress": {
    "status": "initial",
    "comparedToPrevious": "Initial assessment",
    "percentageHealed": 0
  }`;
  }

  prompt += `
}

User added notes: "${userNotes}"
`;

  if (previousAnalysis) {
    prompt += `\nPrevious Analysis Data for comparison:
${JSON.stringify(previousAnalysis, null, 2)}

Provide the 'progress' object critically comparing the current image to the historical data.`;
  }

  let retries = 3;
  let lastError;

  while (retries > 0) {
    try {
      const result = await model.generateContent([
        { text: prompt },
        {
          inlineData: {
            mimeType: mimeType,
            data: imageData,
          },
        },
      ]);

      let responseText = result.response.text();

      // Clean up potential markdown formatting from LLM response
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        return JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse Gemini response:", responseText);
        throw new Error("AI returned invalid JSON.");
      }

    } catch (error) {
      lastError = error;
      // High demand, 503, or rate limit errors
      if (error.message && (error.message.includes('503') || error.message.includes('demand') || error.message.includes('429'))) {
        console.warn(`Gemini API busy (503/429). Retrying... (${retries - 1} attempts left)`);
        retries--;
        if (retries > 0) {
          // Wait 3 seconds before retrying
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } else {
        console.error('Gemini analysis critical error:', error.message);
        throw new Error('Failed to analyze wound image. Please try again.');
      }
    }
  }

  console.error('Gemini analysis failed after retries:', lastError?.message);
  throw new Error('The AI model is currently experiencing extremely high demand. Please try again in a few minutes.');
}

module.exports = { analyzeWound };
