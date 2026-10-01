import { Badge, DataTable, Person } from './ui';
import { dateTime, personName, recorded, verified, yes } from './data';
export default function AttendanceTable({ rows }) {
  return <DataTable rows={rows} searchPlaceholder="Buscar en la asistencia…" searchBy={r => `${personName(r)} ${r.email ?? r.empleado?.email ?? ''} ${r.tipo || ''}`} emptyTitle="Sin registros de asistencia" emptyDescription="Los registros aparecerán cuando el equipo comience a checar." columns={[
    { key: 'persona', title: 'Empleado', render: r => <Person name={personName(r)} subtitle={r.email ?? r.empleado?.email} /> },
    { key: 'fecha', title: 'Fecha y hora', render: r => <span className="tabular">{dateTime(recorded(r))}</span> },
    { key: 'tipo', title: 'Marcaje', render: r => <Badge tone={r.tipo === 'salida' ? 'blue' : yes(r.tarde) ? 'amber' : 'green'}>{r.tipo === 'salida' ? 'Salida' : r.tipo === 'entrada' ? yes(r.tarde) ? 'Entrada · Tardanza' : 'Entrada' : 'Sin información'}</Badge> },
    { key: 'rostro', title: 'Verificación facial', render: r => <Badge tone={verified(r) == null ? 'neutral' : yes(verified(r)) ? 'green' : 'red'}>{verified(r) == null ? 'Sin datos' : yes(verified(r)) ? 'Verificado' : 'No verificado'}</Badge> },
  ]} />;
}
