// Avisos del PDF ("Feliz cumpleaños Ana", "Reunión 3pm"). Animación CSS ligera para el navegador del Roku.
export default function Ticker({ avisos = [] }) {
  if (!avisos.length) return null;
  const texto = avisos.map((a) => a.mensaje).join('      •      ');
  return (
    <div className="ticker">
      <div className="ticker-texto" style={{ animationDuration: `${Math.max(20, texto.length / 4)}s` }}>{texto}</div>
    </div>
  );
}
