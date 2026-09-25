# /panel-admin

**Dueño:** Jorge Ramírez (Dev 3)

Panel web de RH / supervisores: empleados, códigos de registro, avisos, multimedia y reportes.

## Correr en local

```bash
npm install
npm run dev
# http://localhost:5173/admin/   (admin@checador.local / Admin123!)
```

En producción Nginx lo sirve en `https://<dominio>/admin/`.

## Pantallas

| Pantalla | Función | Rol mínimo |
|---|---|---|
| Login | Email + contraseña | Todos |
| Dashboard | Check-ins de hoy, tardanzas, resultado de rostro | Supervisor |
| Empleados | CRUD + **código de registro** para vincular el teléfono | Supervisor (ver) / Admin (editar) |
| Avisos | Ticker de la TV (tiempo real) | Supervisor |
| Multimedia | Subir y ordenar MP4 | Supervisor (ver) / Admin (subir) |
| Reportes | Historial + CSV | Supervisor |

## Notas

- El JWT vive solo en memoria (no en localStorage): recargar la página pide login de nuevo.
- Los estilos son básicos; se pueden sustituir por una plantilla de admin para ahorrar tiempo.

## Pendientes (Jorge)

- [ ] Aplicar plantilla visual
- [ ] Pantalla de Configuración (horarios, tiempos de TV) si queda tiempo
