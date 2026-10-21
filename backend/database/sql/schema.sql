-- =============================================================================
-- SISTEMA DE INFORMACIÓN WEB PARA LA GESTIÓN DE CITAS MÉDICAS
-- CLÍNICA VIDA SALUD / CENTRO MÉDICO LA CRUZ
-- Script DDL Oficial para PostgreSQL (Arquitectura 24 CU / PUDS-UML)
-- Materia: Sistemas de Información I - MSc. Ing. Angélica Garzón Cuéllar
-- =============================================================================

-- =============================================================================
-- PAQUETE 1: SEGURIDAD Y AUDITORÍA
-- =============================================================================

CREATE TABLE usuarios (
  id_usuario bigserial PRIMARY KEY,
  username varchar(50) NOT NULL UNIQUE,
  email varchar(120) NOT NULL UNIQUE,
  password_hash varchar(255) NOT NULL,
  tipo_usuario varchar(30) NOT NULL CHECK (tipo_usuario IN ('ADMIN', 'RECEPCIONISTA', 'MEDICO', 'PACIENTE')),
  estado varchar(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO', 'BLOQUEADO')),
  intentos_fallidos smallint NOT NULL DEFAULT 0,
  ultimo_acceso timestamptz,
  fecha_creacion timestamptz NOT NULL DEFAULT now(),
  fecha_actualizacion timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE roles (
  id_rol bigserial PRIMARY KEY,
  nombre varchar(50) NOT NULL UNIQUE
);

CREATE TABLE permisos (
  id_permiso bigserial PRIMARY KEY,
  nombre varchar(100) NOT NULL UNIQUE
);

CREATE TABLE usuario_rol (
  id_usuario bigint NOT NULL,
  id_rol bigint NOT NULL,
  PRIMARY KEY (id_usuario, id_rol)
);

CREATE TABLE rol_permiso (
  id_rol bigint NOT NULL,
  id_permiso bigint NOT NULL,
  PRIMARY KEY (id_rol, id_permiso)
);

CREATE TABLE tokens_recuperacion (
  id_token bigserial PRIMARY KEY,
  id_usuario bigint NOT NULL,
  token_hash varchar(255) NOT NULL,
  tipo_token varchar(50) NOT NULL DEFAULT 'RECUPERACION_PASSWORD',
  fecha_creacion timestamptz NOT NULL DEFAULT now(),
  fecha_expiracion timestamptz NOT NULL,
  usado boolean NOT NULL DEFAULT false
);

CREATE TABLE bitacora (
  id_bitacora bigserial PRIMARY KEY,
  id_usuario bigint,
  modulo varchar(100) NOT NULL,
  accion varchar(50) NOT NULL,
  tabla_afectada varchar(100),
  id_registro bigint,
  descripcion text,
  ip_origen varchar(45),
  fecha_registro timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- PAQUETE 2: DATOS MAESTROS Y RECURSOS CLÍNICOS
-- =============================================================================

CREATE TABLE especialidades (
  id_especialidad bigserial PRIMARY KEY,
  nombre varchar(100) NOT NULL,
  nombre_normalizado varchar(100) NOT NULL UNIQUE,
  descripcion text,
  edad_min_anios integer,
  edad_max_anios integer,
  precio_consulta numeric(10,2) NOT NULL DEFAULT 0.00,
  estado varchar(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
  CONSTRAINT chk_rango_edad CHECK (
    edad_max_anios IS NULL OR edad_min_anios IS NULL OR edad_max_anios >= edad_min_anios
  )
);

CREATE TABLE medicos (
  id_medico bigserial PRIMARY KEY,
  id_usuario bigint NOT NULL UNIQUE,
  codigo_profesional varchar(50) NOT NULL UNIQUE,
  nombres varchar(100) NOT NULL,
  apellidos varchar(100) NOT NULL,
  telefono_contacto varchar(30),
  correo_profesional varchar(120),
  estado_activo boolean NOT NULL DEFAULT true
);

CREATE TABLE medico_especialidad (
  id_medico bigint NOT NULL,
  id_especialidad bigint NOT NULL,
  es_principal boolean NOT NULL DEFAULT false,
  PRIMARY KEY (id_medico, id_especialidad)
);

CREATE TABLE disponibilidades (
  id_disponibilidad bigserial PRIMARY KEY,
  id_medico bigint NOT NULL,
  dia_semana smallint NOT NULL CHECK (dia_semana BETWEEN 1 AND 7), -- 1: Lunes .. 7: Domingo
  hora_inicio time NOT NULL,
  hora_fin time NOT NULL,
  duracion_cita_minutos integer NOT NULL DEFAULT 30 CHECK (duracion_cita_minutos > 0),
  activo boolean NOT NULL DEFAULT true,
  CONSTRAINT chk_disponibilidad_horas CHECK (hora_fin > hora_inicio)
);

CREATE TABLE bloqueos_horario (
  id_bloqueo bigserial PRIMARY KEY,
  id_medico bigint, -- NULL significa bloqueo institucional general (feriado clínica)
  fecha date NOT NULL,
  hora_inicio time,
  hora_fin time,
  motivo varchar(255) NOT NULL,
  CONSTRAINT chk_bloqueo_horas CHECK (
    (hora_inicio IS NULL AND hora_fin IS NULL) OR (hora_fin > hora_inicio)
  )
);

-- =============================================================================
-- PAQUETE PACIENTES (PERFIL Y CONTACTO DE EMERGENCIA)
-- =============================================================================

CREATE TABLE pacientes (
  id_paciente bigserial PRIMARY KEY,
  id_usuario bigint UNIQUE, -- NULL si fue registrado solo en ventanilla y no tiene cuenta web
  numero_historia varchar(50) NOT NULL UNIQUE,
  numero_documento varchar(30) NOT NULL UNIQUE, -- CI único obligatorio
  nombres varchar(100) NOT NULL,
  apellidos varchar(100) NOT NULL,
  fecha_nacimiento date NOT NULL,
  sexo varchar(20) NOT NULL,
  tipo_sangre varchar(10),
  telefono varchar(30),
  correo varchar(120),
  direccion text,
  notificaciones_activas boolean NOT NULL DEFAULT true,
  estado_paciente varchar(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estado_paciente IN ('ACTIVO', 'INACTIVO')),
  fecha_registro timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE contactos_emergencia (
  id_contacto bigserial PRIMARY KEY,
  id_paciente bigint NOT NULL,
  nombre varchar(150) NOT NULL,
  parentesco varchar(50) NOT NULL,
  telefono varchar(30) NOT NULL
);

-- =============================================================================
-- PAQUETE 3: GESTIÓN DE CITAS MÉDICAS
-- =============================================================================

CREATE TABLE tipos_cita (
  id_tipo_cita bigserial PRIMARY KEY,
  nombre varchar(50) NOT NULL UNIQUE -- 'PRIMERA CONSULTA', 'CONTROL', 'RECONSULTA'
);

CREATE TABLE citas (
  id_cita bigserial PRIMARY KEY,
  codigo_cita varchar(30) NOT NULL UNIQUE, -- ej: 'CM-0001' (RF06)
  id_paciente bigint NOT NULL,
  id_medico bigint NOT NULL,
  id_especialidad bigint NOT NULL,
  id_tipo_cita bigint NOT NULL,
  id_cita_origen bigint, -- Para reprogramaciones
  fecha_hora_inicio timestamptz NOT NULL,
  fecha_hora_fin timestamptz NOT NULL,
  motivo_breve varchar(255),
  modalidad varchar(30) NOT NULL DEFAULT 'PRESENCIAL',
  estado varchar(20) NOT NULL DEFAULT 'PROGRAMADA',
  motivo_cancelacion varchar(255),
  cancelada_en timestamptz,
  creada_por bigint NOT NULL,
  fecha_creacion timestamptz NOT NULL DEFAULT now(),
  fecha_actualizacion timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_cita_horas CHECK (fecha_hora_fin > fecha_hora_inicio),
  CONSTRAINT chk_estado_cita CHECK (
    estado IN ('PROGRAMADA', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA', 'INASISTENCIA')
  )
);

-- =============================================================================
-- REGLA CRÍTICA RF07 / RN07 / RN09: PREVENCIÓN DE DUPLICADOS Y LIBERACIÓN DE CUPOS
-- Garantiza por motor de BD que un médico no tenga 2 citas activas al mismo tiempo.
-- Si la cita se cancela ('CANCELADA'), el cupo se libera de inmediato automáticamente.
-- =============================================================================
CREATE UNIQUE INDEX uq_cita_medico_hora_activa
  ON citas (id_medico, fecha_hora_inicio)
  WHERE estado IN ('PROGRAMADA', 'CONFIRMADA');

CREATE TABLE cita_estado_historial (
  id_cambio bigserial PRIMARY KEY,
  id_cita bigint NOT NULL,
  estado_anterior varchar(20) NOT NULL,
  estado_nuevo varchar(20) NOT NULL,
  id_usuario bigint NOT NULL,
  observacion varchar(255),
  fecha_cambio timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- PAQUETE 4: HISTORIAL CLÍNICO Y CONSULTAS
-- =============================================================================

CREATE TABLE historias_clinicas (
  id_historia_clinica bigserial PRIMARY KEY,
  id_paciente bigint NOT NULL UNIQUE,
  fecha_apertura date NOT NULL DEFAULT CURRENT_DATE,
  estado varchar(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'ARCHIVADO'))
);

CREATE TABLE consultas_medicas (
  id_consulta bigserial PRIMARY KEY,
  id_cita bigint NOT NULL UNIQUE,
  id_historia_clinica bigint NOT NULL,
  id_medico bigint NOT NULL,
  motivo_consulta text NOT NULL,
  peso_kg numeric(5,2),
  talla_cm numeric(5,2),
  temperatura_c numeric(4,1),
  presion_arterial varchar(20),
  frecuencia_cardiaca smallint,
  observaciones text,
  plan_tratamiento text NOT NULL,
  fecha_consulta timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE antecedentes (
  id_antecedente bigserial PRIMARY KEY,
  id_historia_clinica bigint NOT NULL,
  tipo_antecedente varchar(50) NOT NULL, -- 'PATOLOGICO', 'QUIRURGICO', 'ALERGICO', 'FAMILIAR'
  descripcion text NOT NULL,
  registrado_por bigint NOT NULL,
  fecha_registro timestamptz NOT NULL DEFAULT now(),
  estado varchar(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);

CREATE TABLE diagnosticos (
  id_diagnostico bigserial PRIMARY KEY,
  id_historia_clinica bigint NOT NULL,
  id_consulta bigint NOT NULL,
  descripcion text NOT NULL,
  codigo_cie10 varchar(20),
  tipo varchar(30) NOT NULL DEFAULT 'PRESUNTIVO' CHECK (tipo IN ('PRESUNTIVO', 'DEFINITIVO')),
  fecha_registro timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE evoluciones (
  id_evolucion bigserial PRIMARY KEY,
  id_historia_clinica bigint NOT NULL,
  id_medico bigint NOT NULL,
  nota text NOT NULL,
  fecha_registro timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE recetas (
  id_receta bigserial PRIMARY KEY,
  id_historia_clinica bigint NOT NULL,
  id_consulta bigint NOT NULL,
  id_medico bigint NOT NULL,
  indicaciones_generales text,
  fecha_emision timestamptz NOT NULL DEFAULT now(),
  estado varchar(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'ANULADA'))
);

CREATE TABLE receta_detalles (
  id_detalle bigserial PRIMARY KEY,
  id_receta bigint NOT NULL,
  medicamento varchar(150) NOT NULL,
  dosis varchar(100) NOT NULL,
  frecuencia varchar(100) NOT NULL,
  duracion varchar(100) NOT NULL,
  indicaciones text
);

CREATE TABLE analisis_clinicos (
  id_analisis bigserial PRIMARY KEY,
  id_historia_clinica bigint NOT NULL,
  id_medico bigint NOT NULL,
  resumen text NOT NULL,
  alertas jsonb,
  modelo_ia varchar(100) NOT NULL,
  fecha_generacion timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- PAQUETES 5 Y 6: PAGOS, NOTIFICACIONES Y REPORTES IA
-- =============================================================================

CREATE TABLE pagos (
  id_pago bigserial PRIMARY KEY,
  id_cita bigint NOT NULL,
  id_paciente bigint NOT NULL,
  monto numeric(10,2) NOT NULL,
  moneda varchar(10) NOT NULL DEFAULT 'BOB',
  estado varchar(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'COMPLETADO', 'RECHAZADO')),
  stripe_payment_intent_id varchar(255) UNIQUE,
  fecha_pago timestamptz
);

CREATE TABLE notificaciones (
  id_notificacion bigserial PRIMARY KEY,
  id_usuario bigint NOT NULL,
  id_cita bigint,
  tipo varchar(50) NOT NULL, -- 'RECORDATORIO', 'CONFIRMACION', 'CANCELACION'
  titulo varchar(150) NOT NULL,
  mensaje text NOT NULL,
  estado varchar(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'ENVIADA', 'FALLIDA')),
  fecha_programada timestamptz NOT NULL,
  fecha_envio timestamptz
);

CREATE TABLE push_suscripciones (
  id_suscripcion bigserial PRIMARY KEY,
  id_usuario bigint NOT NULL,
  endpoint text NOT NULL,
  clave_p256dh varchar(255) NOT NULL,
  clave_auth varchar(255) NOT NULL,
  activa boolean NOT NULL DEFAULT true
);

CREATE TABLE reportes_ia (
  id_reporte bigserial PRIMARY KEY,
  id_usuario bigint NOT NULL,
  comando_texto text NOT NULL,
  filtros_json jsonb NOT NULL,
  tipo_reporte varchar(100) NOT NULL,
  fecha_generacion timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- DEFINICIÓN FORMAL DE CLAVES FORÁNEAS (RN10 / RN11: ON DELETE RESTRICT)
-- Se protegen los registros históricos de pacientes, médicos e historias clínicas.
-- =============================================================================

-- Seguridad
ALTER TABLE usuario_rol
  ADD CONSTRAINT fk_urol_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE CASCADE,
  ADD CONSTRAINT fk_urol_rol FOREIGN KEY (id_rol) REFERENCES roles (id_rol) ON DELETE CASCADE;

ALTER TABLE rol_permiso
  ADD CONSTRAINT fk_rper_rol FOREIGN KEY (id_rol) REFERENCES roles (id_rol) ON DELETE CASCADE,
  ADD CONSTRAINT fk_rper_permiso FOREIGN KEY (id_permiso) REFERENCES permisos (id_permiso) ON DELETE CASCADE;

ALTER TABLE tokens_recuperacion
  ADD CONSTRAINT fk_tokens_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE CASCADE;

ALTER TABLE bitacora
  ADD CONSTRAINT fk_bitacora_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE SET NULL;

-- Médicos y Especialidades
ALTER TABLE medicos
  ADD CONSTRAINT fk_medicos_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE RESTRICT;

ALTER TABLE medico_especialidad
  ADD CONSTRAINT fk_medesp_medico FOREIGN KEY (id_medico) REFERENCES medicos (id_medico) ON DELETE CASCADE,
  ADD CONSTRAINT fk_medesp_especialidad FOREIGN KEY (id_especialidad) REFERENCES especialidades (id_especialidad) ON DELETE RESTRICT;

ALTER TABLE disponibilidades
  ADD CONSTRAINT fk_disp_medico FOREIGN KEY (id_medico) REFERENCES medicos (id_medico) ON DELETE CASCADE;

ALTER TABLE bloqueos_horario
  ADD CONSTRAINT fk_bloqueo_medico FOREIGN KEY (id_medico) REFERENCES medicos (id_medico) ON DELETE CASCADE;

-- Pacientes
ALTER TABLE pacientes
  ADD CONSTRAINT fk_pacientes_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE SET NULL;

ALTER TABLE contactos_emergencia
  ADD CONSTRAINT fk_contemerg_paciente FOREIGN KEY (id_paciente) REFERENCES pacientes (id_paciente) ON DELETE CASCADE;

-- Citas Médicas
ALTER TABLE citas
  ADD CONSTRAINT fk_citas_paciente FOREIGN KEY (id_paciente) REFERENCES pacientes (id_paciente) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_citas_medico FOREIGN KEY (id_medico) REFERENCES medicos (id_medico) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_citas_especialidad FOREIGN KEY (id_especialidad) REFERENCES especialidades (id_especialidad) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_citas_tipocita FOREIGN KEY (id_tipo_cita) REFERENCES tipos_cita (id_tipo_cita) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_citas_reprogramada FOREIGN KEY (id_cita_origen) REFERENCES citas (id_cita) ON DELETE SET NULL,
  ADD CONSTRAINT fk_citas_creadapor FOREIGN KEY (creada_por) REFERENCES usuarios (id_usuario) ON DELETE RESTRICT;

ALTER TABLE cita_estado_historial
  ADD CONSTRAINT fk_hist_cita FOREIGN KEY (id_cita) REFERENCES citas (id_cita) ON DELETE CASCADE,
  ADD CONSTRAINT fk_hist_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE RESTRICT;

-- Historial Clínico y Consultas (RN10 / RN11: RESTRICT para resguardar historial legal)
ALTER TABLE historias_clinicas
  ADD CONSTRAINT fk_hc_paciente FOREIGN KEY (id_paciente) REFERENCES pacientes (id_paciente) ON DELETE RESTRICT;

ALTER TABLE consultas_medicas
  ADD CONSTRAINT fk_consultas_cita FOREIGN KEY (id_cita) REFERENCES citas (id_cita) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_consultas_hc FOREIGN KEY (id_historia_clinica) REFERENCES historias_clinicas (id_historia_clinica) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_consultas_medico FOREIGN KEY (id_medico) REFERENCES medicos (id_medico) ON DELETE RESTRICT;

ALTER TABLE antecedentes
  ADD CONSTRAINT fk_antecedentes_hc FOREIGN KEY (id_historia_clinica) REFERENCES historias_clinicas (id_historia_clinica) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_antecedentes_registrador FOREIGN KEY (registrado_por) REFERENCES usuarios (id_usuario) ON DELETE RESTRICT;

ALTER TABLE diagnosticos
  ADD CONSTRAINT fk_diag_hc FOREIGN KEY (id_historia_clinica) REFERENCES historias_clinicas (id_historia_clinica) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_diag_consulta FOREIGN KEY (id_consulta) REFERENCES consultas_medicas (id_consulta) ON DELETE RESTRICT;

ALTER TABLE evoluciones
  ADD CONSTRAINT fk_evol_hc FOREIGN KEY (id_historia_clinica) REFERENCES historias_clinicas (id_historia_clinica) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_evol_medico FOREIGN KEY (id_medico) REFERENCES medicos (id_medico) ON DELETE RESTRICT;

ALTER TABLE recetas
  ADD CONSTRAINT fk_recetas_hc FOREIGN KEY (id_historia_clinica) REFERENCES historias_clinicas (id_historia_clinica) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_recetas_consulta FOREIGN KEY (id_consulta) REFERENCES consultas_medicas (id_consulta) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_recetas_medico FOREIGN KEY (id_medico) REFERENCES medicos (id_medico) ON DELETE RESTRICT;

ALTER TABLE receta_detalles
  ADD CONSTRAINT fk_recdet_receta FOREIGN KEY (id_receta) REFERENCES recetas (id_receta) ON DELETE CASCADE;

ALTER TABLE analisis_clinicos
  ADD CONSTRAINT fk_ac_hc FOREIGN KEY (id_historia_clinica) REFERENCES historias_clinicas (id_historia_clinica) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_ac_medico FOREIGN KEY (id_medico) REFERENCES medicos (id_medico) ON DELETE RESTRICT;

-- Pagos y Notificaciones
ALTER TABLE pagos
  ADD CONSTRAINT fk_pagos_cita FOREIGN KEY (id_cita) REFERENCES citas (id_cita) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_pagos_paciente FOREIGN KEY (id_paciente) REFERENCES pacientes (id_paciente) ON DELETE RESTRICT;

ALTER TABLE notificaciones
  ADD CONSTRAINT fk_notif_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE CASCADE,
  ADD CONSTRAINT fk_notif_cita FOREIGN KEY (id_cita) REFERENCES citas (id_cita) ON DELETE SET NULL;

ALTER TABLE push_suscripciones
  ADD CONSTRAINT fk_push_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE CASCADE;

ALTER TABLE reportes_ia
  ADD CONSTRAINT fk_repia_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE CASCADE;
