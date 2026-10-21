-- =============================================================================
-- SCRIPT DE POBLACIÓN DE DATOS MAESTROS Y PRUEBA (POBLACION_DATABASE_CLINICA.SQL)
-- Clínica Vida Salud — Centro Médico La Cruz
-- Metodología: PUDS / RUP | Examen Parcial II
-- Contenido: Roles, Usuarios base, Pacientes (CU04), Especialidades (CU07) y Médicos (CU06)
-- =============================================================================

BEGIN;

-- 1. ESPECIALIDADES MÉDICAS (CU07 / RF04)
INSERT INTO especialidades (id_especialidad, nombre, nombre_normalizado, descripcion, edad_min_anios, edad_max_anios, precio_consulta, estado, created_at, updated_at) VALUES
(1, 'Medicina General', 'medicina-general', 'Atención integral, triaje preventivo y patologías comunes en adultos jóvenes y adultos.', 15, 59, 70.00, 'ACTIVO', now(), now()),
(2, 'Pediatría', 'pediatria', 'Cuidado clínico integral, desarrollo infantil y patologías pediátricas hasta los 14 años.', 0, 14, 90.00, 'ACTIVO', now(), now()),
(3, 'Geriatría', 'geriatria', 'Manejo clínico especializado para adultos mayores a partir de los 60 años.', 60, 130, 90.00, 'ACTIVO', now(), now()),
(4, 'Cardiología', 'cardiologia', 'Diagnóstico, tratamiento y prevención de enfermedades cardiovasculares e hipertensión.', 15, NULL, 120.00, 'ACTIVO', now(), now()),
(5, 'Ginecología y Obstetricia', 'ginecologia-y-obstetricia', 'Salud reproductiva femenina, control prenatal y patologías ginecológicas.', 12, NULL, 100.00, 'ACTIVO', now(), now()),
(6, 'Traumatología y Ortopedia', 'traumatologia-y-ortopedia', 'Tratamiento de lesiones óseas, fracturas, articulares y aparato locomotor.', NULL, NULL, 110.00, 'ACTIVO', now(), now()),
(7, 'Dermatología', 'dermatologia', 'Diagnóstico y tratamiento de enfermedades cutáneas, alergias y cuidado dérmico.', NULL, NULL, 95.00, 'ACTIVO', now(), now()),
(8, 'Oftalmología', 'oftalmologia', 'Salud ocular, agudeza visual y tratamiento de patologías de la visión.', NULL, NULL, 85.00, 'ACTIVO', now(), now())
ON CONFLICT (id_especialidad) DO NOTHING;

SELECT setval('especialidades_id_especialidad_seq', (SELECT MAX(id_especialidad) FROM especialidades));

-- 2. PLANTEL DE MÉDICOS (CU06 / RF03 - Actor Médico Unificado)
INSERT INTO medicos (id_medico, id_usuario, codigo_profesional, nombres, apellidos, telefono_contacto, correo_profesional, estado_activo, created_at, updated_at) VALUES
(1, (SELECT id_usuario FROM usuarios WHERE username = 'doctor.perez' LIMIT 1), 'MED-10492', 'Juan Carlos', 'Pérez Saucedo', '71023456', 'juan.perez@clinicalacruz.com', true, now(), now()),
(2, (SELECT id_usuario FROM usuarios WHERE username = 'doctor.alejandro' LIMIT 1), 'MED-20831', 'Alejandro', 'Morales Terrazas', '72134567', 'alejandro.cardiologia@clinicalacruz.com', true, now(), now()),
(3, (SELECT id_usuario FROM usuarios WHERE username = 'doctora.elena' LIMIT 1), 'MED-31950', 'Elena Sofía', 'Paredes Justiniano', '73245678', 'elena.pediatria@clinicalacruz.com', true, now(), now()),
(4, (SELECT id_usuario FROM usuarios WHERE username = 'doctora.carmen' LIMIT 1), 'MED-45012', 'Carmen Rosa', 'Mendoza Vaca', '74356789', 'carmen.mendoza@clinicalacruz.com', true, now(), now()),
(5, (SELECT id_usuario FROM usuarios WHERE username = 'doctor.roberto' LIMIT 1), 'MED-58190', 'Roberto Carlos', 'Suárez Mercado', '75467890', 'roberto.suarez@clinicalacruz.com', true, now(), now()),
(6, (SELECT id_usuario FROM usuarios WHERE username = 'doctora.mariana' LIMIT 1), 'MED-62734', 'Mariana', 'Vaca Ribera', '76578901', 'mariana.vaca@clinicalacruz.com', true, now(), now())
ON CONFLICT (id_medico) DO NOTHING;

SELECT setval('medicos_id_medico_seq', (SELECT MAX(id_medico) FROM medicos));

-- 3. ASIGNACIÓN MÉDICO - ESPECIALIDAD (N:M con especialidad principal)
INSERT INTO medico_especialidad (id_medico, id_especialidad, es_principal) VALUES
-- Dr. Juan Pérez: Principal Medicina General, Secundaria Dermatología
(1, 1, true),
(1, 7, false),
-- Dr. Alejandro Morales: Principal Cardiología, Secundaria Medicina General
(2, 4, true),
(2, 1, false),
-- Dra. Elena Paredes: Principal Pediatría
(3, 2, true),
-- Dra. Carmen Mendoza: Principal Geriatría, Secundaria Medicina General
(4, 3, true),
(4, 1, false),
-- Dr. Roberto Suárez: Principal Traumatología
(5, 6, true),
-- Dra. Mariana Vaca: Principal Ginecología
(6, 5, true)
ON CONFLICT (id_medico, id_especialidad) DO NOTHING;

-- 4. POBLACIÓN DE 15 PACIENTES (CU04 / RF02) CON DIVERSIDAD ETARIA
INSERT INTO pacientes (id_paciente, id_usuario, numero_historia, numero_documento, nombres, apellidos, fecha_nacimiento, sexo, tipo_sangre, telefono, correo, direccion, notificaciones_activas, estado_paciente, fecha_registro) VALUES
-- Pediátricos (<15 años)
(1, NULL, 'HC-1001', '9812340', 'Mateo', 'Roca Justiniano', '2019-04-12', 'MASCULINO', 'O+', '71234501', 'familia.roca@gmail.com', 'Barrio Equipetrol, Calle 7 #45', true, 'ACTIVO', now()),
(2, NULL, 'HC-1002', '9823451', 'Luciana', 'Vaca Pinto', '2016-08-23', 'FEMENINO', 'A+', '71234502', 'padres.vaca@hotmail.com', 'Av. Banzer Km 6, Condominio Sevilla', true, 'ACTIVO', now()),
(3, NULL, 'HC-1003', '9834562', 'Thiago Andrés', 'Suárez Aguilera', '2021-11-05', 'MASCULINO', 'B+', '71234503', 'suarez.thiago@gmail.com', 'Av. Santos Dumont, Calle 4', true, 'ACTIVO', now()),
(4, NULL, 'HC-1004', '9845673', 'Valentina', 'Flores Morales', '2013-02-18', 'FEMENINO', 'O-', '71234504', 'flores.val@gmail.com', 'Plan 3000, Barrio Guapurú', true, 'ACTIVO', now()),

-- Adultos (15 a 59 años)
(5, (SELECT id_usuario FROM usuarios WHERE username = 'paciente.carlos' LIMIT 1), 'HC-1005', '5341201', 'Carlos Alberto', 'Gutiérrez Méndez', '1988-06-14', 'MASCULINO', 'O+', '71234505', 'carlos.paciente@gmail.com', 'Av. San Martín, Condominio Las Palmas', true, 'ACTIVO', now()),
(6, (SELECT id_usuario FROM usuarios WHERE username = 'paciente.valeria' LIMIT 1), 'HC-1006', '6452312', 'Valeria Nicole', 'Chávez Soliz', '1995-09-30', 'FEMENINO', 'A+', '71234506', 'valeria.chavez@gmail.com', 'Barrio Sirari, Calle Los Claveles #12', true, 'ACTIVO', now()),
(7, (SELECT id_usuario FROM usuarios WHERE username = 'paciente.fernando' LIMIT 1), 'HC-1007', '4321098', 'Fernando', 'Torrico Barba', '1982-12-03', 'MASCULINO', 'AB+', '71234507', 'fernando.torrico@hotmail.com', 'Av. Cristo Redentor, 4to Anillo', true, 'ACTIVO', now()),
(8, (SELECT id_usuario FROM usuarios WHERE username = 'paciente.camila' LIMIT 1), 'HC-1008', '7182930', 'Camila Andrea', 'Ribera Paz', '2001-07-21', 'FEMENINO', 'O+', '71234508', 'camila.ribera@yahoo.com', 'Barrio Hamacas, Calle 5', true, 'ACTIVO', now()),
(9, NULL, 'HC-1009', '5928374', 'Mauricio', 'Antelo Dorado', '1990-03-15', 'MASCULINO', 'B+', '71234509', 'mauricio.antelo@gmail.com', 'Av. Mutualista, Calle 8', true, 'ACTIVO', now()),
(10, NULL, 'HC-1010', '6839201', 'Gabriela', 'Montenegro Ruiz', '1997-10-11', 'FEMENINO', 'A-', '71234510', 'gaby.montenegro@gmail.com', 'Villa 1ro de Mayo, Calle 3', true, 'ACTIVO', now()),
(11, NULL, 'HC-1011', '4910293', 'Rodrigo', 'Salazar Céspedes', '1984-05-27', 'MASCULINO', 'O+', '71234511', 'rodrigo.salazar@live.com', 'Av. Busch, 3er Anillo Interno', true, 'ACTIVO', now()),

-- Geriátricos (≥60 años)
(12, NULL, 'HC-1012', '2345671', 'Guillermo', 'Hurtado Sandoval', '1952-01-20', 'MASCULINO', 'O+', '71234512', 'don.guillermo@gmail.com', 'Barrio Urbari, Calle Toborochi #80', true, 'ACTIVO', now()),
(13, NULL, 'HC-1013', '3124567', 'Esperanza', 'Salvatierra Vaca', '1948-11-14', 'FEMENINO', 'A+', '71234513', 'familia.salvatierra@gmail.com', 'Av. Irala #450, Centro', true, 'ACTIVO', now()),
(14, NULL, 'HC-1014', '2987654', 'Alcides', 'Cuéllar Moreno', '1958-07-09', 'MASCULINO', 'B-', '71234514', 'alcides.cuellar@gmail.com', 'Barrio El Trompillo, Calle Cochabamba', true, 'ACTIVO', now()),
(15, NULL, 'HC-1015', '3456789', 'Rosa María', 'Banegas de Justiniano', '1962-09-02', 'FEMENINO', 'O+', '71234515', 'rosamaria.banegas@gmail.com', 'Av. Las Américas, Edif. Torre Real', true, 'ACTIVO', now())
ON CONFLICT (id_paciente) DO NOTHING;

SELECT setval('pacientes_id_paciente_seq', (SELECT MAX(id_paciente) FROM pacientes));

-- 5. CONTACTOS DE EMERGENCIA
INSERT INTO contactos_emergencia (id_contacto, id_paciente, nombre, parentesco, telefono) VALUES
(1, 1, 'Mariana Justiniano', 'Madre', '71000001'),
(2, 2, 'Jorge Vaca', 'Padre', '71000002'),
(3, 3, 'Patricia Aguilera', 'Madre', '71000003'),
(4, 4, 'Claudia Morales', 'Tía', '71000004'),
(5, 5, 'Lorena Méndez', 'Esposa', '71000005'),
(6, 6, 'Ernesto Chávez', 'Padre', '71000006'),
(7, 7, 'Beatriz Barba', 'Hermana', '71000007'),
(8, 8, 'Carmen Paz', 'Madre', '71000008'),
(9, 9, 'Silvia Dorado', 'Cónyuge', '71000009'),
(10, 10, 'Raúl Montenegro', 'Hermano', '71000010'),
(11, 11, 'Carla Céspedes', 'Esposa', '71000011'),
(12, 12, 'Patricia Hurtado', 'Hija', '71000012'),
(13, 13, 'Fernando Salvatierra', 'Hijo', '71000013'),
(14, 14, 'Carlos Cuéllar', 'Hijo', '71000014'),
(15, 15, 'Hugo Justiniano', 'Esposo', '71000015')
ON CONFLICT (id_contacto) DO NOTHING;

SELECT setval('contactos_emergencia_id_contacto_seq', (SELECT MAX(id_contacto) FROM contactos_emergencia));

COMMIT;
