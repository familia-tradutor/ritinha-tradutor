"use client";
import { useEffect, useState } from "react";
type Item = { id: string; original: string; traduzido: string; data: string };
export default function Historico() {
  const [itens, setItens] = useState<Item[]>([]);
  useEffect(() => {
    const salvo = localStorage.getItem("ritinha-historico");
    if (salvo) setItens(JSON.parse(salvo));
    const h = () => { const s = localStorage.getItem("ritinha-historico"); if (s) setItens(JSON.parse(s)); };
    window.addEventListener("historico-atualizado", h);
    return () => window.removeEventListener("historico-atualizado", h);
  }, []);
  if (itens.length === 0) return null;
  return (
    <div className="mt-6 w-full max-w-md p-3 bg-black/40 rounded-xl border border-yellow-600/20">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-yellow-400 font-bold text-sm">📜 Histórico</h3>
        <button onClick={() => { localStorage.removeItem("ritinha-historico"); setItens([]); }} className="text-xs text-gray-400">Limpar</button>
      </div>
      {itens.slice(0,10).map(i => (
        <div key={i.id} className="text-xs border-b border-white/10 py-2">
          <div className="text-gray-400 truncate">ORG: {i.original}</div>
          <div className="text-white truncate">TR: {i.traduzido}</div>
          <div className="text- text-gray-500">{i.data}</div>
        </div>
      ))}
    </div>
  );
}
export function salvarNoHistorico(original: string, traduzido: string) {
  if(!original ||!traduzido) return;
  const novo = { id: Date.now().toString(), original, traduzido, data: new Date().toLocaleString("pt-BR") };
  const atual = JSON.parse(localStorage.getItem("ritinha-historico") || "[]");
  localStorage.setItem("ritinha-historico", JSON.stringify([novo,...atual].slice(0,50)));
  window.dispatchEvent(new Event("historico-atualizado"));
}
