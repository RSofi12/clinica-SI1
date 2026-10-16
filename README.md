# Centro Médico La Cruz - Sistema Web de Gestión Clínica 🏥

Sistema web integral para la administración hospitalaria y clínica del **Centro Médico La Cruz**. Proyecto académico desarrollado con arquitectura desacoplada en monorepo: API REST en **Laravel (PHP)**, base de datos relacional en **PostgreSQL**, y frontend moderno en **React + TypeScript** estilizado con **Tailwind CSS**.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Frontend** | [React 19](https://react.dev/) + [Vite](https://vite.dev/) | SPA rápida, reactiva y modular |
| **Lenguaje Frontend** | [TypeScript](https://www.typescriptlang.org/) | Tipado estático y seguridad de datos clínicos |
| **Estilos & UI** | [Tailwind CSS v4](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/) | Diseño responsive, moderno con paleta turquesa institucional |
| **Tipografía** | Montserrat (Bold & Regular) | Identidad visual corporativa |
| **Backend** | [PHP 8.5+](https://www.php.net/) + [Laravel 13](https://laravel.com/) | API REST robusta, arquitectura MVC, validaciones y seguridad |
| **Base de Datos** | [PostgreSQL 16+](https://www.postgresql.org/) | Base de datos relacional transaccional y escalable |
| **Control de Versiones** | Git & GitHub | Monorepo estructurado (`/backend` y `/frontend`) |

---

## 📁 Estructura del Monorepo

```text
clinica-SI1/
├── backend/                  # API REST en Laravel (PHP)
│   ├── app/                  # Modelos, Controladores y Lógica de negocio
│   ├── config/               # Configuraciones (CORS, BD, sesión, etc.)
│   ├── database/             # Migraciones y Seeders PostgreSQL
│   ├── routes/               # Rutas web y api
│   ├── .env.example          # Plantilla de variables de entorno (preconfigurada)
│   └── composer.json         # Dependencias de PHP
├── frontend/                 # Aplicación Web React (SPA)
│   ├── src/
│   │   ├── assets/           # Logotipos institucionales y fuentes Montserrat
│   │   ├── components/       # Componentes reutilizables (BackgroundGlow, etc.)
│   │   ├── pages/            # Vistas (HomePage, LoginPage, Dashboard)
│   │   ├── App.tsx           # Enrutamiento y control de vistas principales
│   │   └── index.css         # Importación de Tailwind CSS y fuentes
│   ├── package.json          # Dependencias de Node.js
│   └── vite.config.ts        # Configuración de Vite y Tailwind
├── .gitignore                # Exclusiones de Git (seguridad y dependencias)
└── README.md                 # Guía de instalación y documentación
```

---

## 📋 Requisitos Previos

Asegúrate de tener instalados en tu computadora:

1. **PHP:** Versión `8.2` o superior con las extensiones `pdo_pgsql` y `pgsql` habilitadas en `php.ini`.
2. **Composer:** Gestor de paquetes de PHP.
3. **Node.js:** Versión `18.x`, `20.x` o `22.x` con `npm`.
4. **PostgreSQL:** Servidor local (pgAdmin) o servicio en la nube (Neon.tech / Supabase).
5. **Git:** Para clonar y versionar el repositorio.

---

## 🚀 Guía de Instalación y Puesta en Marcha

Sigue estos pasos para clonar y levantar el proyecto completo en tu entorno local:

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd clinica-SI1
```

---

### 2. Configuración y Levantamiento del Backend (Laravel)

Abre una terminal en la carpeta `backend`:

```powershell
cd backend
```

1. **Instalar dependencias de PHP:**
   ```powershell
   composer install
   ```

2. **Crear archivo de entorno `.env`:**
   ```powershell
   copy .env.example .env
   ```

3. **Generar la clave de la aplicación:**
   ```powershell
   php artisan key:generate
   ```

4. **Configurar la Base de Datos:**
   Abre el archivo `backend/.env` y asegúrate de que coincida con tus credenciales de PostgreSQL:
   ```env
   DB_CONNECTION=pgsql
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_DATABASE=clinica_db
   DB_USERNAME=postgres
   DB_PASSWORD=tu_contraseña_postgres
   ```
   *(Crea la base de datos `clinica_db` en pgAdmin o con el comando `psql -U postgres -c "CREATE DATABASE clinica_db;"`)*.

5. **Ejecutar las migraciones:**
   ```powershell
   php artisan migrate
   ```

6. **Iniciar el servidor de desarrollo del Backend:**
   ```powershell
   php artisan serve
   ```
   *La API estará disponible en:* **`http://127.0.0.1:8000`**

---

### 3. Configuración y Levantamiento del Frontend (React + Vite)

Abre una **segunda terminal** en la carpeta `frontend`:

```powershell
cd frontend
```

1. **Instalar dependencias de Node.js:**
   ```powershell
   npm install
   ```

2. **Iniciar el servidor de desarrollo del Frontend:**
   ```powershell
   npm run dev
   ```
   *El sistema web estará disponible en:* **`http://localhost:5173`**

---

## 🎨 Pantallas y Funcionalidades Disponibles

* **Página de Inicio (`/`):**
  * Presentación institucional del Centro Médico La Cruz.
  * Efecto de orbe luminoso médico con el isotipo de la clínica.
  * Botones de acceso rápido al portal de gestión clínica.
* **Página de Autenticación (`/login`):**
  * Formulario seguro para personal de la clínica.
  * Selector para mostrar u ocultar contraseña.
  * Puntos clave de seguridad institucional y navegación de retorno.
* **Panel de Control Clínico (Dashboard):**
  * Resumen de pacientes registrados, citas de hoy y médicos en atención.
  * Tabla de agenda del día con badges de estado (`Confirmada`, `En Espera`, `Pendiente`).
  * Buscador interactivo por paciente o especialidad médica.

---

## 🔒 Variables de Entorno y Seguridad

* El archivo `backend/.env` se encuentra explícitamente ignorado por `.gitignore` para no exponer credenciales de base de datos ni llaves criptográficas.
* Para producción o despliegue en la nube (AWS / Azure / GCP / Render / Railway), las variables deben configurarse en el panel de control del proveedor respectivo.

---

## 👥 Equipo y Créditos

Proyecto Académico desarrollado para la materia de **Sistemas de Información (SI1)**.  
*Institución:* **Centro Médico La Cruz**
