# Centro Médico La Cruz - Sistema Web de Gestión Clínica

Sistema web integral para la administración hospitalaria y clínica del **Centro Médico La Cruz**. Proyecto académico desarrollado con arquitectura desacoplada en monorepo: API REST en **Laravel (PHP)**, base de datos relacional en **PostgreSQL**, y frontend interactivo en **React (JavaScript puro)** estilizado con **Tailwind CSS**.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Frontend** | [React 19](https://react.dev/) + [Vite](https://vite.dev/) | SPA reactiva y modular con arquitectura por dominios |
| **Lenguaje Frontend** | JavaScript (ES6+ / JSX) | Desarrollo ágil en JavaScript puro sin sobrecarga de tipos |
| **Estilos & UI** | [Tailwind CSS v4](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/) | Diseño responsive con paleta turquesa institucional |
| **Tipografía** | Montserrat (Bold & Regular) | Identidad visual corporativa |
| **Backend** | [PHP 8.2+](https://www.php.net/) + [Laravel](https://laravel.com/) | API REST robusta, arquitectura MVC, validaciones y seguridad |
| **Base de Datos** | [PostgreSQL 16+](https://www.postgresql.org/) | Base de datos relacional transaccional y normalizada |
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
│   ├── .env.example          # Plantilla de variables de entorno
│   └── composer.json         # Dependencias de PHP
├── frontend/                 # Aplicación Web React (JavaScript / JSX)
│   ├── src/
│   │   ├── assets/           # Logotipos institucionales, imágenes y fuentes Montserrat
│   │   ├── components/       # Componentes reutilizables (BackgroundGlow, etc.)
│   │   ├── pages/            # Vistas (HomePage.jsx, LoginPage.jsx)
│   │   ├── App.jsx           # Enrutamiento condicional y vista previa del Dashboard
│   │   ├── main.jsx          # Punto de entrada de la aplicación React
│   │   └── index.css         # Importación de Tailwind CSS y fuentes
│   ├── package.json          # Dependencias (react, lucide-react, tailwindcss)
│   └── vite.config.js        # Configuración de Vite con plugins React y Tailwind
├── docs/                     # Documentación y requisitos del proyecto
├── .gitignore                # Exclusiones de Git (node_modules, vendor, etc.)
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

### 3. Configuración y Levantamiento del Frontend (React + JavaScript + Vite)

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

## 🤝 Flujo de Trabajo en Equipo y Registro de Sesiones (`docs/ai/sessions/`)

Para mantener la trazabilidad, evitar conflictos entre integrantes y facilitar el relevo entre sesiones y agentes de IA:

> [!IMPORTANT]
> **Regla de Colaboración Obligatoria:** Cada vez que un integrante del equipo o agente modifique el proyecto (backend, base de datos o frontend), **debe registrar un archivo Markdown en [`docs/ai/sessions/`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/sessions/)** resumiendo las modificaciones implementadas.

### 📝 Formato del Archivo de Sesión:
- **Ruta:** `docs/ai/sessions/YYYY-MM-DD-autor-o-tarea.md` (ej. `2026-10-21-implementacion-cu01-al-cu07.md`).
- **Estructura Requerida:**
  1. **Encabezado:** Fecha, autor/agente y Casos de Uso (`CUxx`) o requerimientos abordados.
  2. **Backend:** Nuevas migraciones, modelos creados en español, FormRequests, controladores y endpoints REST.
  3. **Frontend:** Nuevas vistas, modales, servicios API y ajustes de navegación.
  4. **Comandos post-pull:** Lista de comandos que sus compañeros deben ejecutar tras hacer `git pull` (ej. `php artisan migrate`, `php artisan db:seed`, etc.).
  5. **Validación:** Comprobaciones realizadas (`php -l`, `npm run build`, pruebas funcionales superadas).
  6. **Actualización de Documentos:** Actualizar siempre [`docs/ai/CURRENT_STATE.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/CURRENT_STATE.md) y [`docs/ai/HANDOFF_LATEST.md`](file:///c:/Users/PERSONAL/clinica-SI1/docs/ai/HANDOFF_LATEST.md).

---

## 👥 Equipo y Créditos

Proyecto Académico desarrollado para la materia de **Sistemas de Información 1 (SI1)**.  
*Institución:* **Centro Médico La Cruz**
