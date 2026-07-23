import { NextResponse } from 'next/server'
export async function POST(req: Request){
  const { text, from, to } = await req.json()
  if(!text) return NextResponse.json({ translated: '' })
  let f = (from||'auto').split('-')[0];
  const t = (to||'pt').split('-')[0]
  if(f==='auto' || f==='') f='en'
  if(f===t) return NextResponse.json({ translated: text })
  try{
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${f}|${t}`
    const r = await fetch(url)
    const d = await r.json()
    let out = d?.responseData?.translatedText || text
    return NextResponse.json({ translated: out })
  }catch{
    return NextResponse.json({ translated: text })
  }
}
