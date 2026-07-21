import { useEffect, useRef, useState } from 'react'
export default function App(){
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [listening, setListening] = useState<'pt'|'en'|null>(null)
  const [bigText, setBigText] = useState('')
  useEffect(()=>{
    const c = canvasRef.current!
    const ctx = c.getContext('2d')!
    let W=0,H=0,raf=0
    const resize=()=>{
      const r=c.getBoundingClientRect()
      W=r.width; H=r.height
      c.width=W*2; c.height=H*2
      ctx.setTransform(2,0,0,2,0,0)
    }
    resize(); addEventListener('resize',resize)
    // pontos do mapa mundo simplificado
    const dots = Array.from({length:900},(_,i)=>{
      const lat = (Math.random()-0.5)*Math.PI
      const lon = Math.random()*Math.PI*2
      // densidade maior nos continentes fake
      const isLand = Math.sin(lon*2+lat)*Math.cos(lat*3) > 0.1
      return {lat, lon, land:isLand, s: Math.random()*1.2+0.2}
    })
    let rot=0, lev=0
    const draw=()=>{
      ctx.clearRect(0,0,W,H)
      const cx=W/2, cy=H*2/3 - 40 + Math.sin(lev)*10
      const R=Math.min(W,H)*0.33
      // sombra base flutuante
      ctx.fillStyle='rgba(0,0,0,0.6)'
      ctx.beginPath(); ctx.ellipse(W/2,H*2/3+75, R*0.9, 18, 0,0,Math.PI*2); ctx.fill()
      // base preta com anel azul neon (igual foto)
      const baseY = H*2/3+70
      // base
      ctx.fillStyle='#0a0a0f'
      ctx.beginPath(); ctx.ellipse(W/2, baseY, R*0.95, R*0.22, 0,0,Math.PI*2); ctx.fill()
      // anel azul neon externo
      ctx.strokeStyle='#0044ff'
      ctx.shadowBlur=18; ctx.shadowColor='#0066ff'
      ctx.lineWidth=4
      ctx.beginPath(); ctx.ellipse(W/2, baseY-6, R*0.9, R*0.20, 0,0,Math.PI*2); ctx.stroke()
      // anel azul interno
      ctx.strokeStyle='#00aaff'
      ctx.lineWidth=2.5
      ctx.beginPath(); ctx.ellipse(W/2, baseY-14, R*0.55, R*0.12, 0,0,Math.PI*2); ctx.stroke()
      ctx.shadowBlur=0
      // brilho azul na mesa
      const glow = ctx.createRadialGradient(W/2, baseY, 0, W/2, baseY, R)
      glow.addColorStop(0,'rgba(0,100,255,0.3)')
      glow.addColorStop(1,'rgba(0,0,0,0)')
      ctx.fillStyle=glow
      ctx.beginPath(); ctx.arc(W/2, baseY, R,0,Math.PI*2); ctx.fill()

      // globo dourado base - igual foto
      const g = ctx.createRadialGradient(cx-R*0.2, cy-R*0.2, R*0.1, cx, cy, R)
      g.addColorStop(0,'#ffef8a')
      g.addColorStop(0.2,'#e8b93a')
      g.addColorStop(0.5,'#c9970a')
      g.addColorStop(1,'#3d2a00')
      ctx.fillStyle=g
      ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.fill()

      // anel roxo do meio igual foto
      ctx.strokeStyle='#aa44ff'
      ctx.shadowBlur=12; ctx.shadowColor='#aa44ff'
      ctx.lineWidth=2.5
      ctx.beginPath(); ctx.ellipse(cx,cy,R*1.02,R*0.18,0,0,Math.PI*2); ctx.stroke()
      ctx.shadowBlur=0

      // continentes/mapa com pontinhos escuros
      dots.forEach(d=>{
        const lon=d.lon+rot
        const x = R*0.98*Math.cos(d.lat)*Math.cos(lon)
        const y = R*0.98*Math.sin(d.lat)
        const z = R*0.98*Math.cos(d.lat)*Math.sin(lon)
        if(z>-R*0.2){
          const depth=(z/R+1)/2
          const px=cx+x, py=cy+y
          ctx.fillStyle = d.land? `rgba(30,20,0,${depth*0.85})` : `rgba(80,50,0,${depth*0.15})`
          ctx.beginPath(); ctx.arc(px,py,d.s*depth,0,Math.PI*2); ctx.fill()
        }
      })
      // linhas latitude/longitude sutis douradas
      ctx.strokeStyle='rgba(0,0,0,0.18)'
      ctx.lineWidth=0.5
      for(let i=-60;i<=60;i+=30){
        const lr = R*Math.cos(i*Math.PI/180)
        ctx.beginPath(); ctx.ellipse(cx,cy+ R*Math.sin(i*Math.PI/180)*0.15, lr, lr*0.15, 0,0,Math.PI*2); ctx.stroke()
      }

      rot+=0.004
      lev+=0.018
      raf=requestAnimationFrame(draw)
    }
    draw()
    return ()=>{cancelAnimationFrame(raf); removeEventListener('resize',resize)}
  },[])
  const finish=(t:string)=>{setBigText(t); setListening(null); setTimeout(()=>setBigText(''),2500)}
  const mic=(l:'pt'|'en')=>{
    setListening(l)
    const R=(window as any).webkitSpeechRecognition||(window as any).SpeechRecognition
    if(!R){setTimeout(()=>finish(l==='pt'?'Família Tradutor!':'Family Translator!'),600); return}
    const rec=new R(); rec.lang=l==='pt'?'pt-BR':'en-US'
    rec.onresult=(e:any)=>finish(e.results[0][0].transcript)
    rec.onerror=()=>setListening(null)
    rec.start(); setTimeout(()=>{try{rec.stop()}catch{}},3500)
  }
  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col">
      <header className="flex items-center justify-between px-5 py-3 bg-black border-b border-[#1a1a1a] z-20">
        <div className="flex gap-3 items-center"><div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FFD700] to-[#7a6200] flex items-center justify-center text-black font-black shadow-[0_0_18px_#FFD700]">F</div><div><div className="font-bold">Familia Tradutor</div><div className="text- tracking-[0.22em] text-[#D4AF37]">GLOBO LEVITANTE</div></div></div>
        <div className="px-3 py-1 rounded-full bg-[#111] border border-[#333] text-xs">PT ↔ US</div>
      </header>
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="absolute bottom-[18%] w-full text-center pointer-events-none">
          <div className="font-semibold">Globo Magnético Ativo</div>
          <div className="text-xs text-white/40">levitação + anel azul neon</div>
        </div>
        {bigText && <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-8 z-30"><div className="text-5xl font-black text-[#FFD700] text-center drop-shadow-[0_0_25px_#FFD700]">{bigText}</div></div>}
      </div>
      <div className="bg-[#0c0c0e] border-t border-[#1e1e1e] p-4 z-20">
        <div className="grid grid-cols-2 gap-3 max-w- mx-auto">
          <button onClick={()=>mic('pt')} className={`h- rounded-2xl font-black active:scale-95 ${listening==='pt'?'bg-white text-black':'bg-[#FFD700] text-black shadow-[0_0_25px_rgba(255,215,0,0.5)]'}`}><div>MIC</div><div className="text-">EU PORTUGUES</div></button>
          <button onClick={()=>mic('en')} className={`h- rounded-2xl font-black border active:scale-95 ${listening==='en'?'bg-white text-black':'bg-[#15151a] border-[#D4AF37]/30 text-[#D4AF37]'}`}><div>MIC</div><div className="text-">US EN</div></button>
        </div>
      </div>
    </div>
  )
}
