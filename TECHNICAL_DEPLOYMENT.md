# Technical Deployment Guide - TecnoBit

Este documento describe la configuración técnica y los pasos de despliegue para la aplicación TecnoBit en el servidor Oracle Cloud.

## Información del Servidor
- **IP Pública**: `143.47.101.209`
- **Usuario**: `ubuntu`
- **Clave SSH**: `~/Downloads/ssh-key-2026-01-09.key`

## Estructura de Rutas
La aplicación está configurada para funcionar en un subdirectorio para convivir con otras aplicaciones en el mismo servidor:
- **URL Pública**: [http://tecnobit.club/](http://tecnobit.club/)
- **Directorio Raíz Web**: `/var/www/tecno` (Será mapeado a la raíz en Nginx)

## Cockpit y Servicios
Es importante entender que TecnoBit es una **Aplicación Frontend Estática** (HTML/React). A diferencia de CasaVida (que es un Backend de Java), TecnoBit no corre como un proceso independiente en el sistema, sino que es servida directamente por Nginx. Por esta razón:
- **Nginx** es el servicio encargado de TecnoBit.
- No aparecerá un servicio llamado "tecnobit" en Cockpit porque no hay un proceso en segundo plano; los archivos simplemente "están ahí" y Nginx los entrega.

## Configuración de Nginx (Versión Final v5)
Para evitar que otras apps (como Barbershop o CasaVida) interfieran, TecnoBit se ha subido al inicio de la configuración con prioridad máxima (`^~`):

```nginx
# Configuración para tecnobit.club
server {
    listen 80;
    server_name tecnobit.club;

    root /var/www/tecno;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Redirección de /tecno/ a la raíz
    location /tecno/ {
        return 301 http://tecnobit.club/;
    }

    # Logs específicos para TecnoBit
    access_log /var/log/nginx/tecno_access.log;
    error_log /var/log/nginx/tecno_error.log;
}
```

## Solución de Problemas (Si no abre)
Si la URL [http://143.47.101.209/tecno/](http://143.47.101.209/tecno/) te sigue redirigiendo:
1. **Borrar Caché del Navegador**: El navegador puede haber guardado una redirección vieja de pruebas anteriores.
2. **Modo Incógnito**: Es la prueba definitiva. Si funciona en incógnito, es caché.
3. **Service Workers**: Si alguna de tus otras apps (Barbershop) instaló un Service Worker, este puede estar interceptando la red. Se recomienda "Limpiar datos del sitio" en la pestaña Application > Storage de las herramientas de desarrollador (F12).

He confirmado con `curl` desde fuera que el servidor entrega el título `<title>tecnobit</title>` correctamente.


## Pasos para el Despliegue (desde Local)

1. **Preparar el build**:
   Asegúrate de que `vite.config.ts` tenga `base: '/'`.
   ```bash
   npm run build
   ```

2. **Subir archivos al servidor**:
   ```bash
   scp -i ~/Downloads/ssh-key-2026-01-09.key -r dist/* ubuntu@143.47.101.209:/var/www/tecno/
   ```

3. **Reiniciar Nginx (si hay cambios en config)**:
   ```bash
   ssh -i ~/Downloads/ssh-key-2026-01-09.key ubuntu@143.47.101.209 "sudo systemctl restart nginx"
   ```

## Notas Importantes
- **Audio**: Las rutas de los archivos de audio en el `useDJStore.ts` deben ser relativas (sin `/` inicial) para que funcionen correctamente tanto en local como en el subdirectorio del servidor.
- **Persistencia**: Se ha incrementado la versión del storage (`dj-storage-v4`) para asegurar que los clientes reciban las rutas corregidas al actualizar.
