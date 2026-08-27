import { NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';

// gpt-4o-mini-transcribe rather than whisper-1: on silence or background noise
// Whisper emits text from its training data (a stray URL, a phrase in another
// language) instead of nothing, which shows up as random words appearing in the
// participant's message box. The mini model returns an empty string instead.
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini-transcribe';

// OpenAI infers the container format from the filename, and the browser sends
// the recording without one. The type cannot be assumed to be webm either:
// Safari's MediaRecorder produces audio/mp4.
const EXTENSIONS: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'mp4',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
};

function fileNameFor(audio: Blob) {
  const mime = (audio.type || 'audio/webm').split(';')[0].trim();
  return `recording.${EXTENSIONS[mime] ?? 'webm'}`;
}

async function transcribeWithOpenAI(audio: Blob, language: string) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const file = await toFile(audio, fileNameFor(audio), {
    type: audio.type || 'audio/webm',
  });

  const result = await client.audio.transcriptions.create({
    file,
    model: process.env.TRANSCRIBE_MODEL || DEFAULT_OPENAI_MODEL,
    language,
  });

  return result.text ?? '';
}

async function transcribeWithDeepgram(audio: Blob, language: string) {
  const params = new URLSearchParams({
    punctuate: 'true',
    smart_format: 'true',
    model: 'nova-2',
    // Deepgram wants a regional tag for English, a bare code for the rest.
    language: language === 'en' ? 'en-US' : language,
  });

  const response = await fetch(
    `https://api.deepgram.com/v1/listen?${params}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/webm',
      },
      body: await audio.arrayBuffer(),
    },
  );

  if (!response.ok) {
    throw new Error(`Deepgram API error: ${response.status}`);
  }

  const data = await response.json();
  return data.results?.channels[0]?.alternatives[0]?.transcript || '';
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 },
      );
    }

    // The language has to be passed through: told nothing, a transcriber
    // defaults to English and renders Czech speech as English-looking words.
    const language =
      (formData.get('language') as string) || process.env.APP_LOCALE || 'en';

    let transcription: string;
    if (process.env.OPENAI_API_KEY) {
      transcription = await transcribeWithOpenAI(audioFile, language);
    } else if (process.env.DEEPGRAM_API_KEY) {
      transcription = await transcribeWithDeepgram(audioFile, language);
    } else {
      return NextResponse.json(
        { error: 'No transcription provider configured' },
        { status: 501 },
      );
    }

    return NextResponse.json({ transcription });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Transcription failed',
      },
      { status: 500 },
    );
  }
}
