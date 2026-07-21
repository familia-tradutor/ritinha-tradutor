import { NextResponse } from 'next/server'
export async function POST(req: Request){
  const { text, from, to } = await req.json()
  if(!text) return NextResponse.json({ translated: '' })
  const f = from.split('-')[0]; const t = to.split('-')[0]
  if(f===t) return NextResponse.json({ translated: text })
  try{
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${f}|${t}`
    const r = await fetch(url)
    const d = await r.json()
    let out = d?.responseData?.translatedText || text
    if(out.toLowerCase()===text.toLowerCase() && f!=='en' && t!=='en'){
      const r1 = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${f}|en`)
      const d1 = await r1.json()
      const en = d1?.responseData?.translatedText || text
      const r2 = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(en)}&langpair=en|${t}`)
      const d2 = await r2.json()
      out = d2?.responseData?.translatedText || en
    }
    return NextResponse.json({ translated: out })
  }catch{
    return NextResponse.json({ translated: text })
  }
}
