# Bitácora de Sesión — 07/11/2026 (Fix: Modal Activar Paciente Fijo en Viewport)

## Tarea / Solicitud
- Corregir el comportamiento del modal "Activar Acceso de Paciente" ([`ActivatePatientModal.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/apps/clinical-resources/components/ActivatePatientModal.jsx)):
  - Al abrirse en el HomePage, el modal se desplazaba verticalmente con el scroll de la página y se perdía de la pantalla.
  - La barra de scroll del HomePage seguía interactiva.
  - El modal no se cerraba al hacer clic en el backdrop oscuro exterior ni al presionar Escape.

---

## Causa Raíz Identificada
1. **Containing Block por `transform` CSS:** El modal estaba envuelto dentro de `<div key="home-view" className="animate-view-fade">` en `App.jsx`. La animación `.animate-view-fade` usa `transform: translateY(0)` con `animation-fill-mode: forwards`, lo cual según la especificación W3C de CSS convierte a ese contenedor en el bloque de contención de cualquier hijo con `position: fixed`, provocando que el modal se mueva con la altura del documento en vez de fijarse al viewport de la ventana.
2. **Ausencia de Scroll Lock:** No se inhabilitaba el scroll del `document.body` al montarse el modal.
3. **Ausencia de Event Handlers en Backdrop:** El contenedor de fondo no interceptaba clics externos (`e.target === e.currentTarget`) para invocar `handleClose()`.

---

## Solución Aplicada
1. **React Portal (`createPortal`):**
   - El contenido del modal se renderiza directamente en `document.body` mediante `createPortal(modalContent, document.body)`, garantizando que el modal sea inmune a transformaciones o filtros de cualquier contenedor ancestro.
2. **Scroll Lock Automático:**
   - Se añadió un `useEffect` que guarda el overflow original de `document.body` y establece `overflow = 'hidden'` mientras `isOpen` sea `true`, restaurándolo de forma segura al cerrar o desmontar.
3. **Cierre por Backdrop y Teclado:**
   - Clic en el área oscura exterior (`e.target === e.currentTarget`) ejecuta `handleClose()`.
   - Se añadió listener para la tecla `Escape`.
   - Centrado vertical perfecto con `my-auto` en cualquier tamaño de pantalla.
4. **Desacoplamiento en [`App.jsx`](file:///c:/Users/PERSONAL/clinica-SI1/frontend/src/App.jsx):**
   - El modal en las vistas `home` y `login` ahora se renderiza fuera del contenedor `<div className="animate-view-fade">`.

---

## Commits Realizados
- `5c4fe1b`: `fix(auth): corregir modal de activacion de paciente con createPortal, scroll-lock y cierre en backdrop`

---

## Verificación
- Compilación `npm --prefix frontend run build`: **Exitoso (11.79s, 0 errores, 2043 módulos)**.
