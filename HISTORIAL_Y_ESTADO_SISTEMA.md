# 📋 Reporte del Sistema, Historial y Control de Estado — TecnoBit / TecnoRide

> **Proyecto:** TecnoBit (TecnoRide) — Plataforma PWA de Streaming de Radio y Consola DJ Pro  
> **Versión Activa:** `v2.6.0 (PRO-LANDSCAPE)` (Branch: `develop` / `main`)  
> **Servidor Cloud:** Oracle Cloud Infrastructure (OCI) — `143.47.101.209`  
> **Dominio Oficial:** [https://tecnobit.club](https://tecnobit.club)  
> **Fecha de Actualización:** Noviembre 2026  

---

## 1. 🏗️ Ficha Técnica y Stack de la Aplicación

| Componente | Tecnología | Versión / Detalle |
| :--- | :--- | :--- |
| **Framework Frontend** | React + TypeScript | React 19.x + TS 5.9.x |
| **Empaquetador** | Vite | Vite 7.x con soporte HMR ultrarrápido |
| **Estilos & UI** | TailwindCSS + Framer Motion | TailwindCSS 4.x + Lucide Icons + FontAwesome 6 |
| **Motor de Audio Principal** | Tone.js | v15.x (Web Audio API, enrutamiento, sintetizadores, BPM sync) |
| **Renderizado de Ondas** | Wavesurfer.js | v7.x (Waveform interactivo, timeline, scrubbing) |
| **Gestión de Estado** | Zustand | v5.x (`useDJStore`, `useRadioStore`) |
| **Persistencia Local** | LocalStorage / IndexedDB | Storage Key: `dj-storage-v4` |
| **Cloud & Base de Datos** | Supabase JS Client | Repositorio colaborativo de pistas / Crate Cloud |
| **Metadatos de Audio** | jsmediatags | Extracción de tags ID3 (artista, título, carátula) |
| **PWA & Offline** | vite-plugin-pwa | Service Worker (`sw.js`) con soporte offline |
| **Servidor Producción** | Nginx 1.18 en Ubuntu 20.04 | Oracle Cloud Infrastructure (OCI) |

---

## 2. 🌐 Topología de Ambientes

### Ambiente 1: Local (Mac)
- **Directorio Raíz:** `~/Documents/DeveOps/ProyectosWeb/TecnoRide/tecnoBit/`
- **Servidor Dev:** `npm run dev` ➔ `http://localhost:5173`
- **Compilación Producción:** `npm run build` ➔ genera carpeta `dist/`
- **Cockpit Terminal:** `terminal.html` / `TECNOBIT_TERMINAL.html` para gestión visual y copiado de comandos en 1 clic.

### Ambiente 2: Producción (Oracle Cloud VPS)
- **IP Pública:** `143.47.101.209`
- **Usuario SSH:** `ubuntu`
- **Llave SSH:** `~/Downloads/ssh-key-2026-01-09.key` (o en `Reyval/ssh-key-2026-01-09.key`)
- **Directorio en Servidor:** `/var/www/tecnobit/` (y `/var/www/tecno`)
- **Dominio:** `https://tecnobit.club` (Redirección automática de HTTP 80 a HTTPS 443 con certificado Let's Encrypt).
- **Servicio Systemd:** N/A (Es una SPA estática entregada por Nginx; no consume memoria Node.js en el VPS).

### Convivencia con otras Aplicaciones en el mismo Oracle Cloud:
El servidor VPS alberga múltiples proyectos en simultáneo. Se debe tener cuidado extremo de no alterar sus rutas:
1. **TecnoBit (Este Proyecto):** `https://tecnobit.club/` ➔ `/var/www/tecnobit/`
2. **KrakenBits / AbTech:** `http://143.47.101.209/` (Frontend) + `http://143.47.101.209/api/` (Backend Express en puerto 8082, PM2)
3. **CasaVida:** `http://143.47.101.209/casavida/` (Java 17 Spring Boot en puerto 8080/8083)
4. **Barbershop / LoteMaster:** Puerto 8085 (Java)
5. **LaCanchita:** Puerto 8084 (Java)
6. **Netdata Monitoring:** Puerto 19999

---

## 3. 🚨 Puntos Críticos y Precauciones Técnicas

1. **Gestión de Autoplay en Móviles (Safari iOS / Android):**
   - Los navegadores bloquean la Web Audio API si no se inicia desde un evento táctil o de clic del usuario.
   - Las llamadas a `Tone.start()` y `Tone.context.resume()` deben ser estrictamente sincrónicas en gestos del usuario.
2. **Estrategia "Silent Handover":**
   - Al pasar de la Radio a la Consola DJ en smartphones, NUNCA pausar/destruir totalmente el elemento HTML5 Audio.
   - En su lugar, emitir un bucle de silencio (Base64 WAV a volumen 0) para engañar al sistema operativo y evitar que mate la sesión de audio en segundo plano.
3. **Rutas de Archivos de Audio:**
   - En `useDJStore.ts` y componentes de la lista de tracks, las rutas deben ser estrictamente relativas (ej. `Audios/Track.mp3` sin slash inicial `/`), asegurando que funcionen tanto en `http://localhost:5173/` como bajo subdominios o subdirectorios.
4. **Nginx Single Page Application (SPA):**
   - Siempre debe incluir `try_files $uri $uri/ /index.html;` en el bloque de servidor de `tecnobit.club`.
5. **Persistencia Local (`dj-storage-v4`):**
   - Si se cambia la estructura de los datos del reproductor o la lista de canciones, debe incrementarse el prefijo de versión (`dj-storage-v5`) para forzar una migración limpia del cache de los usuarios.
6. **Seguridad:**
   - NUNCA commitear al repositorio las llaves SSH (`*.key`), archivos `.env` con credenciales de Supabase o tokens privados.

---

## 4. 📜 Historial de Sesiones y Bitácora de Cambios

### [Sesión 2026-11-06] — Sincronización Git, Cockpit Terminal & Sistema de Reportes
- **Diagnóstico Inicial:** El directorio local `tecnoBit` presentaba corrupción en objetos de Git (`bad tree object HEAD`) y archivos faltantes.
- **Acción Realizada:**
  1. Se descargó la versión limpia y completa desde el repositorio remoto GitHub (`https://github.com/frannivan/tecnoBit.git`).
  2. Se configuraron y verificaron las ramas `develop` (`v2.6.0 PRO-LANDSCAPE`) y `main`.
  3. Se ejecutó `npm install` y se verificó la compilación con `npm run build` (3.47s sin errores, bundle generado exitosamente).
  4. Se integró el nuevo archivo interactivo `terminal.html` con estética Cockpit Ultra-Pro, Prompt Master Diario colapsable con 1-clic copy, monitor de commits y accesos directos de desarrollo, Git y despliegue a Oracle Cloud.
  5. Se implementó el **Servidor Puente Local (`bridge.cjs`)** en el puerto `9099` con SSE (`/stream`) y ejecución en vivo (`/run`), permitiendo que cada clic en los botones ejecute los comandos directamente en la Mac y muestre el estatus y salida de consola en tiempo real en la pantalla.
  6. Se creó este archivo maestro de control `HISTORIAL_Y_ESTADO_SISTEMA.md`.
- **Estado al Cerrar:** Repositorio en rama `develop` 100% limpio, dependencias listas, build verificado, bridge en vivo activo en puerto 9099 y terminal operativa.

---

## 5. 🐛 Bugs Conocidos, Retos y Estado de Resolución

| ID | Descripción del Bug / Reto | Severidad | Estado | Solución Técnica / Mitigación |
| :--- | :--- | :--- | :--- | :--- |
| **BUG-01** | Suspensión de audio en Safari iOS al alternar Radio ➔ Mixer DJ | Alta | Resuelto | Implementado "Silent Handover" en `useAudioPlayer` emitiendo bucle de silencio WAV en segundo plano. |
| **BUG-02** | Glitches de audio / Pitch agudo en ciertos dispositivos Android | Media | Resuelto | Forzado de frecuencia a 44.1kHz en Tone.js y `lookAhead` fijado en 0.1s. |
| **BUG-03** | Error 404 al recargar subrutas (`/home`, `/radio`) en producción | Alta | Resuelto | Nginx configurado con `try_files $uri $uri/ /index.html;` en `tecnobit.club`. |
| **BUG-04** | Bloqueo de audio si el usuario no interactúa con la pantalla | Baja (Comportamiento SO) | Resuelto | Pantalla de inicio con botón "Start Audio Engine" que inicializa el contexto de Tone.js bajo gesto de usuario. |
| **BUG-05** | Fallo en hot-reload por caché IndexedDB viejo | Baja | Resuelto | Incrementado storage key a `dj-storage-v4` con auto-limpieza en caso de incompatibilidad. |
| **BUG-06** | En celulares iPhone el volumen de la radio se movía visualmente pero no cambiaba el sonido | Alta | Resuelto | En iOS Safari, `HTMLMediaElement.volume` está bloqueado por hardware por diseño de Apple. Se implementó una solución profesional: en Android y Desktop el Knob y botones regulan `audio.volume` de forma desacoplada y fluida; en iPhone/iOS el botón Mute silencia/activa al 100%, y al interactuar con el Knob o botones +/- se despliega una notificación flotante indicando el uso de los botones laterales físicos, manteniendo la reproducción nativa HTML5 intacta sin cortes de señal. |

---

## 6. 🔒 Protocolo de Cierre de Sesión ("Handover Protocol")

Cuando el usuario indique: **"vamos a cerrar la sesión"** o **"guarda todo lo necesario"**, se debe ejecutar obligatoriamente el siguiente protocolo:

1. **Revisión de Repositorio:**
   - Ejecutar `git status` para confirmar si hay archivos modificados o sin seguimiento.
   - Si hay cambios, proponer o realizar commit con mensaje descriptivo siguiendo convención (ej. `feat: ...`, `fix: ...`, `docs: ...`).
2. **Actualización de la Bitácora:**
   - Registrar la fecha y resumen de cambios implementados en la sección **4. Historial de Sesiones**.
   - Registrar cualquier nuevo bug detectado o pendiente en la sección **5. Bugs Conocidos**.
3. **Prueba de Build:**
   - Ejecutar `npm run build` para asegurar que el proyecto compila sin errores TypeScript ni de empaquetado.
4. **Verificación de Despliegue:**
   - Indicar si los cambios requieren o ya tienen despliegue en Oracle Cloud (`npm run deploy`).
5. **Confirmación Final al Usuario:**
   - Entregar un resumen ejecutivo del estado del proyecto, confirmando que todo está guardado y listo para reanudar en la siguiente sesión con el **Prompt Master de Inicio**.

