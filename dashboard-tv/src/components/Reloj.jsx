import { useEffect, useState } from 'react';

const formato = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Hermosillo' });
const formatoFecha = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Hermosillo' });

export default function Reloj() {
  const [ahora, setAhora] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="reloj">
      <div className="reloj-hora">{formato.format(ahora)}</div>
      <div className="reloj-fecha">{formatoFecha.format(ahora)}</div>
    </div>
  );
}
