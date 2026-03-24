const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    case '.heic': return 'image/heic';
    default: return 'image/jpeg';
  }
}

async function analyzeWound(imagePath, userNotes = '', previousAnalysis = null) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is missing in your .env file');
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const mimeType = getMimeType(imagePath);
  const imageBase64 = fs.readFileSync(imagePath).toString('base64');
  const imageUrl = `data:${mimeType};base64,${imageBase64}`;

  let prompt = `You are an expert AI wound care assistant. Analyze this wound image carefully.
Respond strictly in JSON format without markdown blocks (\`\`\`). Do not include any text outside the JSON.

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

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const responseText = chatCompletion.choices[0].message.content;
    
    try {
      return JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse Groq response:", responseText);
      throw new Error("AI returned invalid JSON.");
    }

  } catch (error) {
    console.error('Groq analysis error:', error);
    throw new Error('Failed to analyze wound image. Please try again.');
  }
}

module.exports = { analyzeWound };
