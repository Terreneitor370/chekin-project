# /database

**Dueño:** Jeshua E. Pérez (Dev 4)

| Archivo | Qué es |
|---|---|
| `schema.sql` | Crea la base `checador` y sus tablas |
| `seed.sql` | Datos de prueba del PDF (usuarios, 5 empleados, avisos, videos, token de TV) |

## Instalación

```bash
mysql -u root -p < schema.sql
mysql -u root -p checador < seed.sql
```

Usuarios de prueba del panel: `admin@checador.local` / `Admin123!` y `supervisor@checador.local` / `Super123!`.
Token de TV de prueba: `tv-demo-token-cambiar`. **Cambiar las tres antes de publicar el servidor.**

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

Guardar fechas en UTC; los cálculos de "hoy" y tardanza se hacen en `America/Hermosillo`.
