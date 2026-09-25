-- =============================================================
-- Datos semilla para pruebas (PDF: 1 admin + 1 supervisor, 5 empleados, 3 avisos, 2 videos)
-- Contraseñas de prueba: Admin123! y Super123!  (hash bcrypt, costo 10)
-- Token de TV de prueba: tv-demo-token-cambiar  (se guarda su SHA-256)
-- Uso: mysql -u root -p checador < seed.sql
-- =============================================================
USE checador;
SET NAMES utf8mb4;

INSERT INTO usuarios (email, password_hash, rol) VALUES
  ('admin@checador.local',      '$2b$10$GZ1TzmgJqFoDyuJAkQbB5ug75s0fthvUoFSDMJWa5VWVaIsbzmRdq', 'admin'),
  ('supervisor@checador.local', '$2b$10$RQEMh2GTymP/FphSrGk4wO2Nb0RrPsfMLz96MdD6NB4ppWWXRrEjq', 'supervisor');

INSERT INTO empleados (nombre, email, hora_entrada, tolerancia_min) VALUES
  ('Isabel Celis',       'isabel@checador.local',    '08:00:00', 10),
  ('Kassandra Cuadras',  'kassandra@checador.local', '08:00:00', 10),
  ('Jorge Ramírez',      'jorge@checador.local',     '08:00:00', 10),
  ('Jeshua E. Pérez',    'jeshua@checador.local',    '08:00:00', 10),
  ('Empleado Demo',      'demo@checador.local',      '09:00:00', 15);

INSERT INTO avisos (mensaje, creado_por) VALUES
  ('Bienvenidos al checador inteligente', 1),
  ('Reunión general a las 3 pm', 1),
  ('Feliz cumpleaños Ana', 1);

INSERT INTO multimedia (titulo, url, orden) VALUES
  ('Video institucional', '/uploads/multimedia/video1.mp4', 1),
  ('Video de seguridad',  '/uploads/multimedia/video2.mp4', 2);

INSERT INTO dispositivos_tv (nombre, token_hash) VALUES
  ('Roku Recepción', SHA2('tv-demo-token-cambiar', 256));
