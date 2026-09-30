import { useEffect, useRef, useState } from 'react';
import TvScreen from './TvScreen';
import { useModoPantalla } from './hooks/useModoPantalla';

function initialState() {
  const names = ['Lucía Morales', 'Mateo Navarro', 'María-José Sánchez', "O'Brien Ángel", 'Jeshua E. Pérez', 'Valeria Soto', 'Emilia Torres', 'Santiago Luna', 'Camila Ríos', 'Nicolás Vega', 'Elena Fuentes', 'Andrés Flores', 'Paula León', 'Gabriel Ortiz', 'Sara Mendoza', 'Iván Castro', 'Julia Ramos', 'Diego Solís'];
  return {
    totales: { empleados: 20, presentes: 18, tardanzas: 2 },
    llegaron: names.map((nombre, i) => ({ empleadoId: i + 1, nombre, tarde: i === 2 || i === 3, hora: new Date().toISOString() })),
    faltan: [{ empleadoId: 19, nombre: 'Ana Molina' }, { empleadoId: 20, nombre: 'Pablo Cárdenas' }],
    avisos: [{ id: 1, mensaje: 'DEMO · Datos ficticios. Bienvenido a Checker. Cada persona cuenta.' }],
    multimedia: [],
  };
}

export default function DemoTv() {
  const [estado, setEstado] = useState(initialState);
  const [conectado, setConectado] = useState(true);
  const [fileError, setFileError] = useState('');
  const estadoRef = useRef(estado);
  estadoRef.current = estado;
  const mode = useModoPantalla(estadoRef);
  const serial = useRef(0);
  const videoUrl = useRef(null);
  useEffect(() => () => { if (videoUrl.current) URL.revokeObjectURL(videoUrl.current); }, []);
  function checkin(tipo, tarde = false, nombre = 'Lucía Morales') {
    setConectado(true);
    mode.encolar({ checkinId: ++serial.current, empleadoId: 1, nombre, puesto: 'Equipo de demostración', tipo, tarde, hora: new Date().toISOString() });
  }
  function choose(file) {
    if (!file) return;
    if (!/\.mp4$/i.test(file.name) || (file.type && file.type !== 'video/mp4') || !file.size) { setFileError('Selecciona un video MP4 válido.'); return; }
    setFileError('');
    if (videoUrl.current) URL.revokeObjectURL(videoUrl.current);
    videoUrl.current = URL.createObjectURL(file);
    setEstado(current => ({ ...current, multimedia: [{ id: 1, titulo: file.name, url: videoUrl.current, orden: 1 }] }));
    mode.reiniciar();
  }
  return <>
    <TvScreen {...mode} estado={estado} conectado={conectado} error={null} demo />
    <aside className="demo-controls" aria-label="Controles de demostración">
      <strong>DEMO · Sin backend</strong><span>Datos ficticios</span>
      <button onClick={() => checkin('entrada')}>Entrada</button>
      <button onClick={() => checkin('entrada', true)}>Tardanza</button>
      <button onClick={() => checkin('salida')}>Salida</button>
      <button onClick={() => { checkin('entrada'); checkin('entrada', true, 'Mateo Navarro'); checkin('salida', false, 'María-José Sánchez'); }}>Ráfaga de 3</button>
      <button onClick={mode.mostrarResumen}>Resumen</button>
      <button onClick={mode.reiniciar}>Multimedia</button>
      <button onClick={() => setConectado(value => !value)}>{conectado ? 'Reconexión' : 'Restablecer'}</button>
      <label className="demo-file">Video local<input type="file" accept="video/mp4,.mp4" aria-label="Video local" onChange={e => choose(e.target.files[0])} /></label>
      <a href="/tv/">Salir</a>
      {fileError && <span role="alert">{fileError}</span>}
    </aside>
  </>;
}
