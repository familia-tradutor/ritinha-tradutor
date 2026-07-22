import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json()
    const key = process.env.OPENAI_API_KEY
    if (!key) return NextResponse.json({ error: 'Sem OPENAI_API_KEY' }, { status: 500 })
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: [
          { type: 'text', text: 'Transcreva TODO texto visível desta imagem. Mantenha quebras de linha. Só o texto.' },
          { type: 'image_url', image_url: { url: imageBase64 } }
        ]}],
        max_tokens: 2000
      })
    })
    const j = await r.json()
    return NextResponse.json({ extracted: j.choices?.[0]?.message?.content || '' })
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
