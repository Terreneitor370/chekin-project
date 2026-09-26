-- =============================================================
-- Migración 001: tres roles (admin, supervisor, empleado)
-- Para bases YA creadas con la versión anterior de schema.sql.
-- Si instalas desde cero, NO la corras: schema.sql ya incluye estos cambios.
-- Correr UNA sola vez:  mysql -u root -p checador < migraciones/001_roles.sql
-- =============================================================
USE checador;
SET NAMES utf8mb4;

-- Usuarios del panel: nombre, vínculo opcional con empleados, quién lo registró
ALTER TABLE usuarios
  ADD COLUMN nombre VARCHAR(120) NULL AFTER id,
  ADD COLUMN empleado_id INT UNSIGNED NULL UNIQUE AFTER rol,
  ADD COLUMN creado_por INT UNSIGNED NULL AFTER activo,
  ADD COLUMN actualizado_en DATETIME NULL ON UPDATE CURRENT_TIMESTAMP AFTER creado_en,
  ADD CONSTRAINT fk_usuario_empleado FOREIGN KEY (empleado_id) REFERENCES empleados(id),
  ADD CONSTRAINT fk_usuario_creador FOREIGN KEY (creado_por) REFERENCES usuarios(id);

-- Empleados: quién los registró (rol empleado)
ALTER TABLE empleados
  ADD COLUMN registrado_por INT UNSIGNED NULL AFTER activo,
  ADD CONSTRAINT fk_empleado_registrador FOREIGN KEY (registrado_por) REFERENCES usuarios(id);

-- Datos de prueba existentes
UPDATE usuarios SET nombre = 'Administrador' WHERE email = 'admin@checador.local' AND nombre IS NULL;
UPDATE usuarios SET nombre = 'Supervisor' WHERE email = 'supervisor@checador.local' AND nombre IS NULL;
