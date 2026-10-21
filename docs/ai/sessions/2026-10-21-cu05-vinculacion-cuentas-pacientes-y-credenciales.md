# Bitácora de Sesión: Vinculación de Cuentas de Pacientes (CU05) y Credenciales de Acceso

- **Fecha:** 21/10/2026
- **Autor / Agente:** Antigravity (Google DeepMind)
- **Caso de Uso:** CU05 (Gestionar Cuenta y Perfil del Paciente — §3.4 / Autoservicio) y CU01 (Autenticación / Login con CI).
- **Problema Reportado:** Al ingresar al portal como paciente (`paciente.carlos` / `Admin123@`), en la sección "Mi Perfil de Paciente (CU05)" aparecía la alerta: *"Ficha no Vinculada: No se encontró un registro clínico asociado a su cuenta de usuario"*.

---

## 1. Causa Raíz Detectada
1. En [`backend/database/seeders/PatientSeeder.php`](file:///c:/Users/PERSONAL/clinica-SI1/backend/database/seeders/PatientSeeder.php), todos los 15 pacientes se insertaban con `'id_usuario' => null`.
2. En [`backend/database/seeders/DatabaseSeeder.php`](file:///c:/Users/PERSONAL/clinica-SI1/backend/database/seeders/DatabaseSeeder.php), se creaban los usuarios web con rol `PACIENTE`, pero nunca se actualizaba la clave foránea `id_usuario` en la tabla `pacientes`.
3. Al loguearse el usuario, [`PatientProfileController::me()`](file:///c:/Users/PERSONAL/clinica-SI1/backend/app/Packages/ClinicalResources/Controllers/PatientProfileController.php) buscaba `Patient::where('id_usuario', $user->id_usuario)->first()`, el cual arrojaba `404 Not Found`, impidiendo visualizar la ficha clínica.

---

## 2. Cambios Implementados

### Backend
1. **[`backend/app/Packages/Security/Controllers/AuthController.php`](file:///c:/Users/PERSONAL/clinica-SI1/backend/app/Packages/Security/Controllers/AuthController.php):**
   - Se añadió soporte para iniciar sesión directamente con el **Carnet de Identidad (CI / `numero_documento`)** del paciente, además del nombre de usuario y correo electrónico.
2. **[`backend/app/Packages/ClinicalResources/Controllers/PatientProfileController.php`](file:///c:/Users/PERSONAL/clinica-SI1/backend/app/Packages/ClinicalResources/Controllers/PatientProfileController.php):**
   - En `me()` y `updateProfile()` se implementó un mecanismo de auto-vinculación defensiva: si el usuario autenticado aún no tiene asignado `id_usuario` en su ficha, el sistema busca coincidencias por correo o por número de documento (CI), guarda automáticamente la relación en PostgreSQL y retorna el perfil completo sin arrojar error.
3. **[`backend/database/seeders/DatabaseSeeder.php`](file:///c:/Users/PERSONAL/clinica-SI1/backend/database/seeders/DatabaseSeeder.php):**
   - Se alinearon las cuentas de pacientes demo con los registros del padrón clínico:
     - `paciente.carlos` -> `carlos.silva.v@gmail.com`
     - `paciente.mariana` -> `mariana.torrico@gmail.com`
     - `paciente.valeria` -> `valeria.escalante@gmail.com`
     - `paciente.fernando` -> `fer.justiniano@estudiante.edu`
4. **[`backend/database/seeders/PatientSeeder.php`](file:///c:/Users/PERSONAL/clinica-SI1/backend/database/seeders/PatientSeeder.php):**
   - Se obtienen dinámicamente los IDs de los usuarios de prueba y se asignan a las fichas clínicas correspondientes (Pacientes 5, 6, 10 y 11).
   - Se actualizó el bucle del seeder para que, si el paciente ya existía en la base de datos, actualice su `id_usuario` y `estado_paciente = 'ACTIVO'`.

---

## 3. Catálogo de Credenciales de Prueba del Sistema

Todos los usuarios de prueba tienen la contraseña común: **`Admin123@`**.

| Rol / Tipo | Usuario (`username`) | Alternativa de Login (CI o Correo) | Contraseña | Persona Asociada |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | `admin` | `admin@lacruz.com` | `Admin123@` | Administrador General |
| **RECEPCIONISTA** | `recepcion` | `recepcion@lacruz.com` | `Admin123@` | Recepcionista Central |
| **MÉDICO** | `doctor.perez` | `carlos.perez@lacruz.com` | `Admin123@` | Dr. Carlos Pérez Méndez (Med. General) |
| **MÉDICO** | `doctor.alejandro` | `alejandro.morales@lacruz.com` | `Admin123@` | Dr. Alejandro Morales Soliz (Cardiología) |
| **MÉDICO** | `doctora.elena` | `elena.paredes@lacruz.com` | `Admin123@` | Dra. Elena Paredes Vaca (Pediatría) |
| **MÉDICO** | `doctora.carmen` | `carmen.mendoza@lacruz.com` | `Admin123@` | Dra. Carmen Mendoza Rojas (Geriatría) |
| **MÉDICO** | `doctor.roberto` | `roberto.suarez@lacruz.com` | `Admin123@` | Dr. Roberto Suárez Ortiz (Traumatología) |
| **MÉDICO** | `doctora.mariana` | `mariana.vaca@lacruz.com` | `Admin123@` | Dra. Mariana Vaca Justiniano (Ginecología) |
| **PACIENTE** | `paciente.carlos` | CI: **`78923410`** / `carlos.silva.v@gmail.com` | `Admin123@` | Carlos Andrés Silva Vargas (HC-0005) |
| **PACIENTE** | `paciente.mariana` | CI: **`65432190`** / `mariana.torrico@gmail.com` | `Admin123@` | Mariana Torrico Soliz (HC-0006) |
| **PACIENTE** | `paciente.valeria` | CI: **`60123450`** / `valeria.escalante@gmail.com` | `Admin123@` | Valeria Escalante Romero (HC-0010) |
| **PACIENTE** | `paciente.fernando` | CI: **`94561230`** / `fer.justiniano@estudiante.edu` | `Admin123@` | Fernando Justiniano Vaca (HC-0011) |

---

## 4. Corrección de Navegación a "¿Olvidaste tu contraseña?" (CU01 / Seguridad)
- **Causa:** En [`frontend/src/App.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/App.jsx), cuando un usuario no autenticado abría la URL `/dashboard`, la aplicación renderizaba el formulario de login pero no le pasaba la propiedad `onNavigateForgotPassword`. Al hacer clic en el botón, se ejecutaba `undefined` y no abría la vista.
- **Solución:**
  1. Se agregó `onNavigateForgotPassword={() => navigateTo('forgot-password')}` en la instancia de `LoginPage` bajo la condición de dashboard no autenticado.
  2. Se añadió sincronización reactiva en `useEffect` para redirigir la URL limpia a `/login` si no hay sesión activa.
  3. Se protegió la llamada en [`LoginPage.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/pages/LoginPage.jsx) con verificación segura de función.

---

## 5. Comandos Ejecutados y Pruebas Realizadas
- `cd backend; php artisan db:seed --class=DatabaseSeeder`: Ejecutado exitosamente, poblando y vinculando los usuarios con las fichas clínicas.
- Prueba de autenticación vía API:
  - Login con username `paciente.carlos`: HTTP 200 OK (`id_usuario: 4`, Rol `PACIENTE`).
  - Login con CI `78923410`: HTTP 200 OK (`id_usuario: 4`, Rol `PACIENTE`).
- Verificación de lint sintáctico en PHP: Sin errores en ninguno de los archivos modificados.
