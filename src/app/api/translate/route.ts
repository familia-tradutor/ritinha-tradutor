import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text, targetLang } = await req.json();
    const apiKey = process.env.DEEPL_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json({ error: 'DEEPL_API_KEY nao configurada' }, { status: 500 });
    }

    const isFree = apiKey.endsWith(':fx');
    const baseUrl = isFree? 'https://api-free.deepl.com' : 'https://api.deepl.com';

    const response = await fetch(`${baseUrl}/v2/translate`, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [text],
        target_lang: targetLang,
        source_lang: 'PT',
      }),
    });

    const data = await response.json();
    console.log('DeepL status:', response.status);

    if (!response.ok) {
      return NextResponse.json({ error: data }, { status: response.status });
    }

    return NextResponse.json({ translatedText: data.translations[0].text });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
