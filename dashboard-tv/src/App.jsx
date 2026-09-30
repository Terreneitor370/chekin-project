import { lazy, Suspense, useRef } from 'react';
import { useEstadoTv } from './hooks/useEstadoTv';
import { useModoPantalla } from './hooks/useModoPantalla';
import { DEMO_MODE } from './config';
import TvScreen from './TvScreen';

const DemoTv = import.meta.env.DEV ? lazy(() => import('./DemoTv')) : null;
function LiveTv() {
  const estadoRef = useRef(null);
  const mode = useModoPantalla(estadoRef);
  const live = useEstadoTv({ onCheckin: mode.encolar });
  estadoRef.current = live.estado;
  return <TvScreen {...live} {...mode} />;
}
export default function App() {
  return DEMO_MODE && DemoTv ? <Suspense fallback={<div className="demo-loading">Cargando demo…</div>}><DemoTv /></Suspense> : <LiveTv />;
}
