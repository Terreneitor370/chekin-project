// Anuncio de cada check-in (foto grande + nombre + hora), 4 s por persona.
import { urlConToken } from '../config';

const hora = (iso) =>
  new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Hermosillo' });

export default function ModoAnuncio({ checkin }) {
  if (!checkin) return null;
  return (
    <div className="pantalla anuncio">
      {checkin.fotoUrl ? <img className="anuncio-foto" src={urlConToken(checkin.fotoUrl)} alt="" /> : <div className="anuncio-foto" />}
      <div>
        <div className="anuncio-nombre">{checkin.nombre}</div>
        <div className={`anuncio-hora ${checkin.tarde ? 'tarde' : ''}`}>
          {checkin.tipo === 'entrada' ? 'Entrada' : 'Salida'} {hora(checkin.hora)}
          {checkin.tarde ? ' - con retardo' : ''}
        </div>
      </div>
    </div>
  );
}
