import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json()
    if (!imageBase64) return NextResponse.json({ extracted: '' })

    const key = process.env.OCR_SPACE_API_KEY || 'K83347428688957'

    // Converte base64 para blob
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')

    const form = new FormData()
    form.append('base64Image', `data:image/jpeg;base64,${base64Data}`)
    form.append('language', 'eng')
    form.append('isOverlayRequired', 'false')
    form.append('OCREngine', '2')

    const r = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: { 'apikey': key },
      body: form
    })

    const j = await r.json()
    const text = j?.ParsedResults?.[0]?.ParsedText || ''

    return NextResponse.json({ extracted: text.trim() })
  } catch (e:any) {
    return NextResponse.json({ error: e.message, extracted: '' }, { status: 500 })
  }
}
