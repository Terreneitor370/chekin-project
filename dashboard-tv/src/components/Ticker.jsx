import { Megaphone } from 'lucide-react';
export default function Ticker({ avisos = [] }) {
  const texto = avisos.map(a => a.mensaje).join('     •     ');
  return <section className="ticker"><div className="ticker-label"><Megaphone /> AVISOS</div><div className="ticker-window">{texto ? <div key={texto} className="ticker-texto" style={{ animationDuration: `${Math.max(24, texto.length / 5)}s` }}>{texto}</div> : <div className="ticker-empty">Todo listo para un nuevo día. Bienvenido a Checker.</div>}</div></section>;
}
