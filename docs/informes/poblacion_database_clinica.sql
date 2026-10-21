-- =============================================================================
-- POBLACIÓN DE DATOS INICIALES Y DE PRUEBA — CLÍNICA VIDA SALUD
-- Archivo: docs/informes/poblacion_database_clinica.sql
-- Módulo: CU04 (Gestionar Pacientes — RF02)
-- Generado: 20/10/2026
-- =============================================================================

-- Limpieza preventiva para recarga controlada (en orden de dependencias)
-- DELETE FROM contactos_emergencia;
-- DELETE FROM pacientes;

-- -----------------------------------------------------------------------------
-- 1. POBLACIÓN DE 15 PACIENTES CON DIVERSIDAD ETARIA Y DEMOGRÁFICA
-- Grupos:
--   • Pediátricos (<15 años): 4 pacientes (HC-0001 a HC-0004)
--   • Adultos (15-59 años): 7 pacientes (HC-0005 a HC-0011)
--   • Geriátricos (≥60 años): 4 pacientes (HC-0012 a HC-0015)
-- -----------------------------------------------------------------------------

INSERT INTO pacientes (
    id_paciente, id_usuario, numero_historia, numero_documento, nombres, apellidos, 
    fecha_nacimiento, sexo, tipo_sangre, telefono, correo, direccion, 
    notificaciones_activas, estado_paciente, fecha_registro
) VALUES
-- 1. Pediátrico (4 años)
(1, NULL, 'HC-0001', '12458901', 'Mateo', 'Morales Choque', '2022-04-12', 'MASCULINO', 'O+', '77123401', 'familia.morales@gmail.com', 'Barrio Equipetrol, Calle 7 Este #120', true, 'ACTIVO', '2026-01-15 08:30:00-04'),

-- 2. Pediátrico (8 años)
(2, NULL, 'HC-0002', '10982344', 'Luciana', 'Quispe Mendoza', '2018-09-24', 'FEMENINO', 'A+', '78541202', 'luciana.padres@hotmail.com', 'Av. Banzer 4to Anillo, Condominio Sevilla', true, 'ACTIVO', '2026-02-10 09:15:00-04'),

-- 3. Pediátrico (12 años)
(3, NULL, 'HC-0003', '98451230', 'Thiago', 'Rojas Gutiérrez', '2014-06-03', 'MASCULINO', 'B+', '76098203', 'rojas.thiago.salud@gmail.com', 'Av. San Martín #450, Barrio Sirari', true, 'ACTIVO', '2026-03-05 10:00:00-04'),

-- 4. Pediátrico (2 años)
(4, NULL, 'HC-0004', '13567891', 'Valentina', 'Fernández Arias', '2024-02-18', 'FEMENINO', 'O+', '71239804', 'valen.fernandez@gmail.com', 'Plan 3000, UV 105, Manzana 12', true, 'ACTIVO', '2026-03-20 11:30:00-04'),

-- 5. Adulto (28 años)
(5, NULL, 'HC-0005', '78923410', 'Carlos Andrés', 'Silva Vargas', '1998-05-14', 'MASCULINO', 'O+', '76345605', 'carlos.silva.v@gmail.com', 'Av. Bush, 2do Anillo #320', true, 'ACTIVO', '2026-04-02 14:00:00-04'),

-- 6. Adulto (34 años)
(6, NULL, 'HC-0006', '65432190', 'Mariana', 'Torrico Soliz', '1992-11-29', 'FEMENINO', 'A+', '70987606', 'mariana.torrico@gmail.com', 'Calle René Moreno #560, Centro', true, 'ACTIVO', '2026-04-18 15:45:00-04'),

-- 7. Adulto (45 años)
(7, NULL, 'HC-0007', '54321870', 'Rodrigo', 'Benítez Mercado', '1981-08-07', 'MASCULINO', 'B+', '77891207', 'r.benitez.m@empresa.com', 'Av. Monseñor Rivero #890', true, 'ACTIVO', '2026-05-10 08:00:00-04'),

-- 8. Adulto (22 años)
(8, NULL, 'HC-0008', '89012340', 'Gabriela', 'Paz Castedo', '2004-03-16', 'FEMENINO', 'O-', '78901208', 'gaby.paz.castedo@gmail.com', 'Av. Cristo Redentor 6to Anillo', true, 'ACTIVO', '2026-05-28 16:20:00-04'),

-- 9. Adulto (52 años)
(9, NULL, 'HC-0009', '45678901', 'Javier', 'Mendoza Claros', '1974-01-22', 'MASCULINO', 'AB+', '71234509', 'javier.mendoza.c@yahoo.es', 'Barrio Las Palmas, Calle Los Tajibos #88', true, 'ACTIVO', '2026-06-12 10:40:00-04'),

-- 10. Adulto (38 años - Inactivo para prueba de baja lógica)
(10, NULL, 'HC-0010', '60123450', 'Valeria', 'Escalante Romero', '1988-07-30', 'FEMENINO', 'A-', '76543210', 'valeria.escalante@gmail.com', 'Villa 1ro de Mayo, Calle 3 #45', false, 'INACTIVO', '2026-06-25 12:10:00-04'),

-- 11. Adulto (19 años)
(11, NULL, 'HC-0011', '94561230', 'Fernando', 'Justiniano Vaca', '2007-10-05', 'MASCULINO', 'O+', '77451211', 'fer.justiniano@estudiante.edu', 'Av. Tres Pasos al Frente #1200', true, 'ACTIVO', '2026-07-04 17:00:00-04'),

-- 12. Geriátrico (67 años)
(12, NULL, 'HC-0012', '34567890', 'Donato', 'Flores Mamani', '1959-03-19', 'MASCULINO', 'O+', '78123412', 'donato.flores.m@gmail.com', 'Av. Santos Dumont 3er Anillo #230', true, 'ACTIVO', '2026-07-22 09:00:00-04'),

-- 13. Geriátrico (74 años)
(13, NULL, 'HC-0013', '23456780', 'Rosa Elena', 'Pinto vda. de Suárez', '1952-12-08', 'FEMENINO', 'A+', '70891213', 'contacto.familia.pinto@gmail.com', 'Barrio Hamacas, Calle 8 #34', true, 'ACTIVO', '2026-08-14 11:15:00-04'),

-- 14. Geriátrico (81 años)
(14, NULL, 'HC-0014', '18901230', 'Humberto', 'Arteaga Caballero', '1945-04-27', 'MASCULINO', 'B+', '76321214', 'humberto.arteaga@servicios.bo', 'Condominio Urbari, Casa 15', true, 'ACTIVO', '2026-09-02 14:30:00-04'),

-- 15. Geriátrico (63 años)
(15, NULL, 'HC-0015', '38901230', 'Carmen Teresa', 'Ribera Céspedes', '1963-08-11', 'FEMENINO', 'O+', '77894515', 'carmen.ribera.c@gmail.com', 'Av. Grigotá 2do Anillo #450', true, 'ACTIVO', '2026-09-20 16:00:00-04');

-- Reinicio del correlativo de la secuencia de pacientes
SELECT setval('pacientes_id_paciente_seq', (SELECT MAX(id_paciente) FROM pacientes));

-- -----------------------------------------------------------------------------
-- 2. CONTACTOS DE EMERGENCIA VINCULADOS A CADA PACIENTE
-- -----------------------------------------------------------------------------

INSERT INTO contactos_emergencia (id_contacto, id_paciente, nombre, parentesco, telefono) VALUES
(1, 1, 'Andrea Choque de Morales', 'Madre', '77123499'),
(2, 2, 'Jorge Quispe Balderrama', 'Padre', '78541288'),
(3, 3, 'Silvia Gutiérrez de Rojas', 'Madre', '76098277'),
(4, 4, 'Claudia Arias de Fernández', 'Madre', '71239866'),
(5, 5, 'Lorena Vargas Méndez', 'Madre', '76345655'),
(6, 6, 'Daniel Torrico Soliz', 'Hermano', '70987644'),
(7, 7, 'Beatriz Mercado vda. de Benítez', 'Esposa', '77891233'),
(8, 8, 'Eduardo Paz Cuéllar', 'Padre', '78901222'),
(9, 9, 'Teresa Claros de Mendoza', 'Esposa', '71234511'),
(10, 10, 'Gonzalo Escalante Romero', 'Hermano', '76543200'),
(11, 11, 'Patricia Vaca Justiniano', 'Madre', '77451299'),
(12, 12, 'Marcos Flores Quisbert', 'Hijo', '78123488'),
(13, 13, 'Sonia Suárez Pinto', 'Hija', '70891277'),
(14, 14, 'Guillermo Arteaga Peña', 'Hijo', '76321266'),
(15, 15, 'Mauricio Ribera Céspedes', 'Hijo', '77894555');

-- Reinicio del correlativo de la secuencia de contactos de emergencia
SELECT setval('contactos_emergencia_id_contacto_seq', (SELECT MAX(id_contacto) FROM contactos_emergencia));
