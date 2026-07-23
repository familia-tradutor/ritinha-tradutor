"use client"
import { useEffect, useState } from "react"

type Item = { id: string; origem: string; traducao: string; fav?: boolean; data: number }

const KEY = "ritinha_historico_v1"

export function salvarNoHistorico(origem: string, traducao: string) {
  if (!origem ||!traducao) return
  if (typeof window === "undefined") return
  const atual = JSON.parse(localStorage.getItem(KEY) || "[]") as Item[]
  // evita duplicata seguida
  if (atual[0]?.origem === origem && atual[0]?.traducao === traducao) return
  const novo: Item = { id: Date.now().toString(), origem, traducao, data: Date.now(), fav: false }
  const lista = [novo,...atual].slice(0, 50)
  localStorage.setItem(KEY, JSON.stringify(lista))
  window.dispatchEvent(new Event("historico-atualizado"))
}

export default function Historico() {
  const [lista, setLista] = useState<Item[]>([])
  const [filtroFav, setFiltroFav] = useState(false)

  const carregar = () => {
    const d = JSON.parse(localStorage.getItem(KEY) || "[]") as Item[]
    setLista(d)
  }

  useEffect(() => {
    carregar()
    window.addEventListener("historico-atualizado", carregar)
    return () => window.removeEventListener("historico-atualizado", carregar)
  }, [])

  const toggleFav = (id: string) => {
    const nova = lista.map(i => i.id === id? {...i, fav:!i.fav } : i)
    setLista(nova)
    localStorage.setItem(KEY, JSON.stringify(nova))
  }

  const remover = (id: string) => {
    const nova = lista.filter(i => i.id!== id)
    setLista(nova)
    localStorage.setItem(KEY, JSON.stringify(nova))
  }

  const copiar = (t: string) => navigator.clipboard.writeText(t)
  const compartilhar = (o: string, t: string) => {
    const texto = `Ritinha: ${o} -> ${t}`
    if (navigator.share) navigator.share({ title: "Ritinha Tradutor", text: texto })
    else window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank")
  }

  const exibicao = filtroFav? lista.filter(i => i.fav) : lista
  if (lista.length === 0) return null

  return (
    <div className="w-full max-w-md mx-auto mt-4 bg-[#111] border border-[#222] rounded-2xl p-3">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-yellow-400 text-sm">📜 Histórico ({exibicao.length})</h3>
        <div className="flex gap-2">
          <button onClick={() => setFiltroFav(!filtroFav)} className={`text-xs px-2 py-1 rounded-full border ${filtroFav? 'bg-yellow-500 text-black border-yellow-500' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}>{filtroFav? '⭐ Favoritos' : '⭐ Todos'}</button>
          <button onClick={() => { if(confirm('Limpar histórico?')){ localStorage.removeItem(KEY); setLista([]) } }} className="text-xs px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700">Limpar</button>
        </div>
      </div>
      <div className="flex flex-col gap-2 max-h- overflow-auto">
        {exibicao.map(item => (
          <div key={item.id} className="bg-black/60 border border-white/10 rounded-xl p-2.5">
            <div className="text-xs text-white/60 truncate">{item.origem}</div>
            <div className="text-sm text-yellow-200 font-medium">{item.traducao}</div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => toggleFav(item.id)} className={`text-xs px-2 py-1 rounded-full ${item.fav? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>{item.fav? '★ Fav' : '☆ Fav'}</button>
              <button onClick={() => copiar(item.traducao)} className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-300">📋 Copiar</button>
              <button onClick={() => compartilhar(item.origem, item.traducao)} className="text-xs px-2 py-1 rounded-full bg-green-900/50 text-green-300 border border-green-800">📤 Zap</button>
              <button onClick={() => remover(item.id)} className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-500 ml-auto">✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
