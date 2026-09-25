-- =============================================================
-- Checador Inteligente - Esquema MySQL 8
-- Dueño: Jeshua E. Pérez (/database)
-- Uso: mysql -u root -p < schema.sql
-- =============================================================

CREATE DATABASE IF NOT EXISTS checador
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE checador;
SET NAMES utf8mb4;

-- Usuarios del panel admin (RH / supervisores)
CREATE TABLE IF NOT EXISTS usuarios (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email           VARCHAR(120) NOT NULL UNIQUE,
  password_hash   VARCHAR(100) NOT NULL,
  rol             ENUM('admin','supervisor') NOT NULL DEFAULT 'supervisor',
  activo          TINYINT(1) NOT NULL DEFAULT 1,
  creado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Empleados que checan (se quita huella_token del PDF: la huella nunca sale del teléfono)
CREATE TABLE IF NOT EXISTS empleados (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre               VARCHAR(120) NOT NULL,
  email                VARCHAR(120) NULL UNIQUE,
  hora_entrada         TIME NOT NULL DEFAULT '08:00:00',
  tolerancia_min       SMALLINT UNSIGNED NOT NULL DEFAULT 10,
  foto_registro_path   VARCHAR(255) NULL,         -- foto de referencia para DeepFace (carpeta privada)
  activo               TINYINT(1) NOT NULL DEFAULT 1,
  creado_en            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Códigos de vinculación de 6 dígitos (un solo uso, 15 minutos)
CREATE TABLE IF NOT EXISTS codigos_vinculacion (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empleado_id   INT UNSIGNED NOT NULL,
  codigo        CHAR(6) NOT NULL,
  expira_en     DATETIME NOT NULL,
  usado_en      DATETIME NULL,
  CONSTRAINT fk_codigo_empleado FOREIGN KEY (empleado_id) REFERENCES empleados(id),
  INDEX idx_codigo (codigo)
) ENGINE=InnoDB;

-- La huella como dato: llave pública creada por el teléfono y protegida con la huella
CREATE TABLE IF NOT EXISTS huellas (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empleado_id     INT UNSIGNED NOT NULL,
  llave_publica   TEXT NOT NULL,                 -- base64 X.509 RSA 2048
  dispositivo     VARCHAR(120) NULL,
  activa          TINYINT(1) NOT NULL DEFAULT 1,
  registrada_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_huella_empleado FOREIGN KEY (empleado_id) REFERENCES empleados(id),
  INDEX idx_huella_empleado (empleado_id, activa)
) ENGINE=InnoDB;

-- Retos de un solo uso que la app firma con la huella
CREATE TABLE IF NOT EXISTS retos (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empleado_id   INT UNSIGNED NOT NULL,
  valor         CHAR(36) NOT NULL,
  expira_en     DATETIME NOT NULL,
  usado         TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_reto_empleado FOREIGN KEY (empleado_id) REFERENCES empleados(id)
) ENGINE=InnoDB;

-- Registros de asistencia
CREATE TABLE IF NOT EXISTS checkins (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empleado_id       INT UNSIGNED NOT NULL,
  huella_id         INT UNSIGNED NULL,
  registrado_en     DATETIME(3) NOT NULL,          -- hora del servidor en UTC
  tipo              ENUM('entrada','salida') NOT NULL,
  tarde             TINYINT(1) NOT NULL DEFAULT 0,
  foto_path         VARCHAR(255) NULL,             -- selfie del check-in
  verificado        TINYINT(1) NOT NULL DEFAULT 0, -- resultado de DeepFace
  distancia         DECIMAL(6,4) NULL,
  es_real           TINYINT(1) NULL,               -- resultado de anti_spoofing
  idempotency_key   CHAR(36) NOT NULL UNIQUE,
  CONSTRAINT fk_checkin_empleado FOREIGN KEY (empleado_id) REFERENCES empleados(id),
  CONSTRAINT fk_checkin_huella FOREIGN KEY (huella_id) REFERENCES huellas(id),
  INDEX idx_checkin_empleado_fecha (empleado_id, registrado_en)
) ENGINE=InnoDB;

-- Avisos del ticker de la TV
CREATE TABLE IF NOT EXISTS avisos (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  mensaje        VARCHAR(255) NOT NULL,
  activo         TINYINT(1) NOT NULL DEFAULT 1,
  fecha_inicio   DATE NULL,
  fecha_fin      DATE NULL,
  creado_por     INT UNSIGNED NULL,
  creado_en      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_aviso_usuario FOREIGN KEY (creado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- Videos del modo multimedia
CREATE TABLE IF NOT EXISTS multimedia (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo      VARCHAR(120) NOT NULL,
  url         VARCHAR(255) NOT NULL,
  orden       SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  activo      TINYINT(1) NOT NULL DEFAULT 1,
  creado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Pantallas (Roku) autorizadas; el token se guarda como hash SHA-256
CREATE TABLE IF NOT EXISTS dispositivos_tv (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre           VARCHAR(80) NOT NULL,
  token_hash       CHAR(64) NOT NULL UNIQUE,
  activo           TINYINT(1) NOT NULL DEFAULT 1,
  ultimo_contacto  DATETIME NULL
) ENGINE=InnoDB;

-- Nota: la tabla "permisos" del PDF se sustituye por los roles en código (server/src/middlewares/auth.js).
