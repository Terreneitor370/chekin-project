import { useEstadoTv } from './hooks/useEstadoTv';
import { useModoPantalla } from './hooks/useModoPantalla';
import ModoMultimedia from './components/ModoMultimedia';
import ModoAnuncio from './components/ModoAnuncio';
import ModoResumen from './components/ModoResumen';

export default function App() {
  const { modo, actual, encolar } = useModoPantalla();
  const { estado, conectado, error } = useEstadoTv({ onCheckin: encolar });

  if (error && !estado) return <div className="mensaje-central">{error}</div>;
  if (!estado) return <div className="mensaje-central">Cargando...</div>;

  return (
    <>
      <ModoMultimedia estado={estado} visible={modo === 'multimedia'} />
      {modo === 'anuncio' && <ModoAnuncio checkin={actual} />}
      {modo === 'resumen' && <ModoResumen estado={estado} />}
      {!conectado && <div className="banner-conexion">Reconectando...</div>}
    </>
  );
}
