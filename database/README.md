# /database

**Dueño:** Jeshua E. Pérez (Dev 4)

| Archivo | Qué es |
|---|---|
| `schema.sql` | Crea la base `checador` y sus tablas |
| `seed.sql` | Datos de prueba del PDF (admin, supervisor, 5 empleados, avisos, videos, token de TV) |
| `migraciones/001_roles.sql` | Solo para bases creadas con la versión anterior: agrega los cambios de los 3 roles |

## Roles en la base de datos

| Rol | Tabla | Cómo entra |
|---|---|---|
| `admin` | `usuarios` (`rol = 'admin'`) | Panel web con email y contraseña |
| `supervisor` | `usuarios` (`rol = 'supervisor'`) | Panel web con email y contraseña |
| `empleado` | `empleados` | App móvil con huella + rostro (sin contraseña) |

- `usuarios.empleado_id`: si un admin o supervisor también checa, se liga a su registro en `empleados`.
- `usuarios.creado_por` y `empleados.registrado_por`: qué admin hizo el registro.

## Instalación desde cero

```bash
mysql -u root -p < schema.sql
mysql -u root -p checador < seed.sql
```

Usuarios de prueba del panel: `admin@checador.local` / `Admin123!` y `supervisor@checador.local` / `Super123!`.
Token de TV de prueba: `tv-demo-token-cambiar`. **Cambiar las tres antes de publicar el servidor.**

## Si ya tenías la base creada (antes de los 3 roles)

No borres nada: corre la migración una sola vez.

```bash
mysql -u root -p checador < migraciones/001_roles.sql
```

Crear el usuario de MySQL que usa el backend:

```sql
CREATE USER 'checador'@'localhost' IDENTIFIED BY 'cambiar';
GRANT SELECT, INSERT, UPDATE, DELETE ON checador.* TO 'checador'@'localhost';
```

Para generar otro hash de contraseña: `cd ../server && npm run hash -- "NuevaContraseña"`.


## Cambios respecto al PDF

- `empleados`: sin `huella_token`; con `hora_entrada`, `tolerancia_min` y `foto_registro_path`.
- `huellas`: nueva. La huella como dato ligado al usuario (llave pública creada por el teléfono).
- `retos`: nueva. Reto de un solo uso que la app firma en cada check-in.
- `checkins`: con `tarde`, resultado de DeepFace (`verificado`, `distancia`, `es_real`) e `idempotency_key`.
- `codigos_vinculacion`: nueva. Reemplaza el login por ID de empleado.
- `permisos`: se sustituye por roles en código.
- `usuarios`: con `nombre`, `empleado_id`, `creado_por` y `actualizado_en` (3 roles).
- `empleados`: con `registrado_por`.

Guardar fechas en UTC; los cálculos de "hoy" y tardanza se hacen en `America/Hermosillo`.
