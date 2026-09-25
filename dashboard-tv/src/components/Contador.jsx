export default function Contador({ totales, conTardanzas = false }) {
  if (!totales) return null;
  return (
    <div className="contador">
      {totales.presentes}/{totales.empleados} presentes
      {conTardanzas && ` - ${totales.tardanzas} tardanzas`}
    </div>
  );
}
