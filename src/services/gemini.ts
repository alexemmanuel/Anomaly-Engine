/**
 * Client-side Gemini Integration Service
 * Proxies calls to server-side endpoints to protect API keys.
 */

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export async function chatWithAdam(messages: ChatMessage[], facilityContext?: any): Promise<string> {
  const res = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, facilityContext }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'A.D.A.M. mainframe connection failed.');
  }

  const data = await res.json();
  return data.text;
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  // Convert blob to base64
  const arrayBuffer = await audioBlob.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(arrayBuffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const audioBase64 = btoa(binary);

  const res = await fetch('/api/gemini/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audioBase64,
      mimeType: audioBlob.type || 'audio/webm',
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Audio transcription failed.');
  }

  const data = await res.json();
  return data.text;
}
