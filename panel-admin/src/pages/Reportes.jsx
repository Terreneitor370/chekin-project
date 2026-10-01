import { useEffect, useRef, useState } from 'react';
import { Download, Search, CalendarDays, ClipboardCheck, Clock3, ShieldCheck } from 'lucide-react';
import { useSesion } from '../api/sesion';
import { useCargar } from '../components/useCargar';
import { today, yes, verified, minFecha, maxFecha } from '../components/data';
import { Alert, Button, Field, Loading, PageHeader, Stat, useAction } from '../components/ui';
import AttendanceTable from '../components/AttendanceTable';
import { DEMO_MODE } from '../api/demo';
export default function Reportes() {
  const { api } = useSesion();
  const [range, setRange] = useState({ desde: today(), hasta: today() });
  const [draft, setDraft] = useState(range);
  const [validation, setValidation] = useState('');
  const query = new URLSearchParams(range).toString();
  const { datos, error, loading, recargar } = useCargar(api, `/reportes/asistencia?${query}&formato=json`, 'registros');
  function submit(e) { e.preventDefault(); if (draft.desde > draft.hasta) { setValidation('La fecha inicial no puede ser posterior a la final.'); return; } setValidation(''); if (draft.desde === range.desde && draft.hasta === range.hasta) recargar(); else setRange({ ...draft }); }
  const download = useAction();
  const cleanup = useRef(null);
  const revokeTimer = useRef(null);
  useEffect(() => () => { clearTimeout(revokeTimer.current); cleanup.current?.(); }, []);
  async function exportCsv() {
    await download.run(async () => {
      const csv = await api.get(`/reportes/asistencia?${query}&formato=csv`);
      if (typeof csv !== 'string') throw new Error('El servidor no devolvió un CSV válido.');
      cleanup.current?.();
      clearTimeout(revokeTimer.current);
      const url = URL.createObjectURL(new Blob(['\uFEFF', csv.replace(/^\uFEFF/, '')], { type: 'text/csv;charset=utf-8' }));
      cleanup.current = () => URL.revokeObjectURL(url);
      const link = document.createElement('a');
      link.href = url;
      link.download = `checker${DEMO_MODE ? '-demo' : ''}_asistencia_${range.desde}_${range.hasta}.csv`;
      document.body.appendChild(link);
      try { link.click(); } finally { link.remove(); }
      revokeTimer.current = setTimeout(() => { cleanup.current?.(); cleanup.current = null; }, 10000);
    });
  }
  const rows = datos || [];
  return <><PageHeader eyebrow="DATOS Y SEGUIMIENTO" title="Cada registro cuenta." description="Consulta la asistencia y genera reportes para tu organización."><Button variant="secondary" onClick={exportCsv} busy={download.busy} disabled={loading || !!error || !datos}><Download />Exportar CSV</Button></PageHeader><Alert>{download.error}</Alert><form className="report-filter card" onSubmit={submit}><div className="filter-icon"><CalendarDays /></div><Field label="Desde"><input type="date" min={minFecha()} max={maxFecha()} required value={draft.desde} onChange={e => setDraft({ ...draft, desde: e.target.value })} /></Field><span className="filter-dash">—</span><Field label="Hasta"><input type="date" min={minFecha()} max={maxFecha()} required value={draft.hasta} onChange={e => setDraft({ ...draft, hasta: e.target.value })} /></Field><Button busy={loading}><Search />Consultar</Button><span className="report-timezone">Fechas de Hermosillo, Sonora</span></form><Alert>{validation}</Alert><Alert retry={recargar}>{error}</Alert><div className="stats-grid three"><Stat icon={ClipboardCheck} label="Registros del periodo" value={datos ? rows.length : '—'} detail={`${range.desde} — ${range.hasta}`} /><Stat icon={Clock3} label="Entradas con tardanza" value={datos ? rows.filter(r => r.tipo === 'entrada' && yes(r.tarde)).length : '—'} detail="Según el horario de cada empleado" /><Stat icon={ShieldCheck} label="Rostros verificados" value={datos ? rows.filter(r => yes(verified(r))).length : '—'} detail="Verificación confirmada por el servidor" tone="mint" /></div><div className="section-heading"><h2>Historial de asistencia</h2><span>{range.desde === range.hasta ? range.desde : `${range.desde} a ${range.hasta}`}</span></div>{loading && !datos ? <Loading /> : !error && <AttendanceTable rows={rows} />}</>;
}
