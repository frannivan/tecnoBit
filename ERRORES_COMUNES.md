# Errores Comunes y Soluciones Técnicas (TecnoBit Mobile)

### 1. Silencio en el Mixer DJ (Móviles / iOS)

**Descripción:**
La Radio (HTML5 Audio) se escuchaba correctamente, pero al iniciar el Mixer DJ (Web Audio API / Tone.js), no se producía sonido alguno, aunque los indicadores visuales (Jogs, VU Meters) mostraran actividad.

**Causa Raíz:**
Los navegadores móviles (especialmente Safari iOS) tienen una política de gestión de energía y privacidad extremadamente estricta. Al pausar o limpiar la fuente (`src`) de un elemento de audio HTML5 (como la Radio), el navegador detecta que no hay medios activos y suspende inmediatamente la "Sesión de Audio" de la pestaña, ignorando cualquier intento de la Web Audio API de emitir sonido en segundo plano.

**Solución Aplicada (Estrategia "Silent Handover"):**
- **No Pausar Totalmente:** En lugar de pausar la Radio y destruir su origen de datos al encender el Mixer, el hook `useAudioPlayer` ahora cambia la fuente a un bucle de silencio absoluto (Base64 WAV) y mantiene la reproducción activa a volumen 0.
- **Mantenimiento de Sesión:** Esto "engaña" al sistema operativo para que mantenga el hardware de audio "caliente" y listo para recibir los datos de Tone.js.
- **Relé de Contexto:** Se sincronizaron las llamadas `Tone.start()` y `Tone.context.resume()` de forma estrictamente sincrónica dentro de los gestos de usuario (`click`) para garantizar la autoridad del audio.
- **Watchdog de Estado:** Se implementó un monitor visual del estado del motor en `App.tsx` para detectar y permitir el rescate manual si el navegador suspende el contexto (`audioStatus: suspended`).

---

### 2. Conflicto de Frecuencias de Muestreo (Sample Rate)

**Descripción:**
En algunos dispositivos Android, el mixer se escuchaba con un tono más agudo o con "glitches" digitales.

**Solución:**
Asegurar que el motor de audio (`Tone.context`) se inicie con una frecuencia estable de 44100Hz o dejar que el navegador elija la nativa pero reforzando la el `lookAhead` a 0.1s para evitar micro-cortes en redes móviles.
