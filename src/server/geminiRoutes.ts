import express from 'express';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export const geminiRouter = express.Router();
geminiRouter.use(express.json({ limit: '20mb' }));

/**
 * Multi-turn Chat with A.D.A.M. (Facility Forensic AI)
 * Uses gemini-3.5-flash with system instruction and context grounding
 */
geminiRouter.post('/chat', async (req, res) => {
  try {
    const { messages, facilityContext } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Messages array is required.' });
      return;
    }

    const formattedContents = messages.map((m: { role: 'user' | 'model'; text: string }) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    const systemInstruction = `You are A.D.A.M. (Autonomous Diagnostic & Analysis Module), the central synthetic AI mainframe of Deep Synapse Sublevel 9. 
Your mission is to aid researchers in deducing anomalous entities, analyzing Black Box telemetry data, interpreting sensor spikes, and offering logical deduction advice.
Keep your responses sharp, analytical, immersive, and concise (under 120 words).
Never reveal the Anomaly directly unless telemetry logs clearly substantiate it.
${facilityContext ? `Current Facility Telemetry & Status: ${JSON.stringify(facilityContext)}` : ''}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text || 'Telemetry analysis complete. No anomalous conclusions found.' });
  } catch (err: any) {
    console.error('Gemini Chat error:', err);
    res.status(500).json({ error: err?.message || 'Failed to query A.D.A.M. mainframe.' });
  }
});

/**
 * Microphone Voice Transcription
 * Uses gemini-3.5-transcribe to convert audio speech into text
 */
geminiRouter.post('/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body;

    if (!audioBase64) {
      res.status(400).json({ error: 'Audio data is required.' });
      return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          {
            inlineData: {
              data: audioBase64,
              mimeType: mimeType || 'audio/webm',
            },
          },
          { text: 'Transcribe this spoken message verbatim for a forensic research report.' },
        ],
      },
    });

    res.json({ text: response.text?.trim() || '' });
  } catch (err: any) {
    console.error('Gemini Transcribe error:', err);
    res.status(500).json({ error: err?.message || 'Failed to transcribe audio speech.' });
  }
});
