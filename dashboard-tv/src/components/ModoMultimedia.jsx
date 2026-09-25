// Modo por defecto: video en loop (muted para que el navegador permita autoplay), reloj, avisos y contador.
import { useEffect, useState } from 'react';
import { API_URL } from '../config';
import Reloj from './Reloj';
import Ticker from './Ticker';
import Contador from './Contador';

export default function ModoMultimedia({ estado, visible }) {
  const lista = estado?.multimedia ?? [];
  const [indice, setIndice] = useState(0);
  const video = lista.length ? lista[indice % lista.length] : null;

  useEffect(() => {
    if (indice >= lista.length) setIndice(0);
  }, [lista.length, indice]);

  return (
    // Se oculta con CSS (no se desmonta) para que el video continúe donde iba
    <div className="pantalla" style={{ display: visible ? 'flex' : 'none' }}>
      {video ? (
        <video
          key={video.id}
          className="video"
          src={`${API_URL}${video.url}`}
          autoPlay
          muted
          playsInline
          loop={lista.length === 1}
          onEnded={() => setIndice((i) => i + 1)}
        />
      ) : (
        <div className="video video-vacio">Sin videos activos</div>
      )}
      <div className="lateral">
        <Reloj />
        <Contador totales={estado?.totales} />
      </div>
      <Ticker avisos={estado?.avisos} />
    </div>
  );
}
