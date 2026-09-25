# Convenciones del equipo

## Regla de oro (del PDF)

Cada quien es dueño absoluto de su carpeta. Nadie toca el código de otro sin avisar. Se comunican por el contrato de API (`docs/api.md`).
`.github/CODEOWNERS` pide la revisión del dueño en cada Pull Request.

## Ramas

- `main`: siempre funciona. No se hace push directo.
- Una rama por tarea, con prefijo de la carpeta:
  - `mobile/registro-huella`
  - `server/checkin-deepface`
  - `tv/cola-anuncios`
  - `admin/pantalla-avisos`
  - `infra/nginx-https`
- Ramas cortas: integrar al menos una vez al día.

## Commits

Formato: `<carpeta>: <qué cambió>` en español y en presente.

```
mobile: agrega pantalla de pruebas del Día 1
server: valida firma SHA256withRSA en POST /api/checkin
docs: agrega evento nuevo-multimedia al contrato
```

## Pull Requests

1. Llenar la plantilla (qué cambia, carpetas, checklist).
2. Si cambia un endpoint o evento: primero PR a `docs/api.md`.
3. Un integrante aprueba (el dueño de la carpeta si no eres tú).
4. Nunca subir `.env`, contraseñas ni tokens reales.

## Variables de entorno

Cada carpeta tiene `.env.example`. Copiarlo a `.env` y llenar; `.env` está en `.gitignore`.

## Horario de referencia

Todas las fechas se guardan en UTC. "Hoy" y las tardanzas se calculan en `America/Hermosillo`.
