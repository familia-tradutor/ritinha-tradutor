import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json()
    if (!imageBase64) return NextResponse.json({ extracted: '' })
    const key = process.env.OCR_SPACE_API_KEY
    if(!key) return NextResponse.json({ error: 'API KEY não configurada', extracted: '' }, { status: 500 })
    const clean = imageBase64.replace(/^data:image\/\w+;base64,/, '').substring(0,2000000)
    const form = new FormData()
    form.append('base64Image', `data:image/jpeg;base64,${clean}`)
    form.append('language', 'eng')
    form.append('OCREngine', '2')
    form.append('scale', 'true')
    const r = await fetch('https://api.ocr.space/parse/image', { method: 'POST', headers: { apikey: key }, body: form })
    const j = await r.json()
    if(j.IsErroredOnProcessing) return NextResponse.json({ error: j.ErrorMessage?.join(', '), extracted: '' }, { status: 500 })
    const text = j?.ParsedResults?.[0]?.ParsedText || ''
    return NextResponse.json({ extracted: text.trim() })
  } catch(e:any){
    return NextResponse.json({ error: e.message, extracted: '' }, { status: 500 })
  }
}
