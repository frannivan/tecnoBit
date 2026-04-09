# 📟 Guía Maestra Técnica: Ecosistema TecnoBit & CasaVida

Esta guía contiene la arquitectura completa, configuraciones de red, seguridad y el inventario detallado de todas las aplicaciones alojadas en el servidor Oracle Cloud.

---

## 🌍 Información General del Servidor
- **IP Pública**: `143.47.101.209`
- **Sistema Operativo**: Ubuntu 20.04 LTS
- **Dominios Principales**:
  - `tecnobit.club` (Activo / HTTPS en proceso)
  - `electrobit.club` (Configurado / Pendiente DNS)
- **Stack Base**: 
  - **Servidor Web**: Nginx 1.18.0
  - **Lenguajes**: Java 17 (OpenJDK), Node.js v20.19.6
  - **Seguridad**: Certbot (Let's Encrypt), UFW/Iptables

---

## 🚀 Inventario de Aplicaciones

| Aplicación | Tipo | Tecnología | URL / Acceso | Directorio Root | Servicio Systemd |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TecnoBit** | Frontend | React + Vite | `https://tecnobit.club/` | `/var/www/tecnobit` | N/A (Estático) |
| **CasaVida** | Fullstack | Java 17 + Angular | `http://IP/casavida/` | `/var/www/casavida` | `casavida.service` |
| **Barbershop** | Fullstack | Java 17 + Static | `http://IP:8085` | `/var/www/barbershop` | `barbershop.service` |
| **LoteMaster** | Backend | Java (H2 DB) | Puerto 8085 (Interno) | `/var/www/lotemaster` | `lotemaster.service` |
| **LaCanchita** | Backend | Java | Puerto 8084 (Interno) | `/var/www/lacanchita` | `lacanchita.service` |
| **ABTech** | Backend | Java | Puerto 8082 (Interno) | `/opt/abtech` | `abtech.service` |
| **Amulets of Siam**| Backend | Java | Puerto 8081 (Interno) | `/opt/amulets` | `amulets.service` |
| **Monitoring** | Tools | GoAccess | `/monitoring/` | `/var/www/monitoring`| N/A |

---

## 🛠️ Detalle por Aplicación

### 1. TecnoBit (DJ & Radio Experience)
- **Tecnología**: React 18+, TypeScript, Vite.
- **Configuración Especial**: 
  - Todo el tráfico de subrutas (`/home`, `/xxx`) se redirige automáticamente a la raíz `/`.
  - Optimizado para compartir en redes sociales (WhatsApp/Twitter) con Open Graph de alta calidad.
- **Menú Principal**:
  - `Inicio` (Reproductor de Radio)
  - `Audios / Galería` 
  - `Contacto`

### 2. CasaVida (Gestión Inmobiliaria)
- **Tecnología**: Java 17 (Spring Boot) + Angular.
- **Base de Datos**: Externa (Configurada en el JAR).
- **Submenús / Secciones**:
  - **Dashboard**: Estadísticas generales de ventas.
  - **Inventario de Lotes**: Gestión de disponibilidad y estados (APARTADO, VENDIDO).
  - **Clientes**: Dossier completo con historial de pagos y comprobantes.
  - **Fraccionamientos**: Mapa interactivo con polígonos y pines de ubicación.
  - **Carga Masiva**: Plantillas Excel para importación de datos.

### 3. Barbershop
- **Tecnología**: Java 17 + Frontend estático.
- **Configuración de Red**: Movido al puerto **8085** para evitar conflictos con el dominio raíz.
- **Menú**: Gestión de Barberos, Citas, Servicios.

---

## 📡 Configuración de Red y Seguridad

### Puertos Abiertos (VCN Oracle Cloud)
| Puerto | Servicio | Estado / Nota |
| :--- | :--- | :--- |
| **80** | HTTP | **ABIERTO**. Sirve CasaVida (IP) y redirige Dominios a HTTPS. |
| **443** | HTTPS | **BLOQUEADO (VCN)**. Necesario para ver el "Candado" en `tecnobit.club`. |
| **8085** | Barbershop | **BLOQUEADO (VCN)**. Necesario para acceder a la app de barbería. |
| **22** | SSH | **ABIERTO**. Para mantenimiento técnico. |
| **19999** | Netdata | **ABIERTO**. Monitorización de recursos. |

### Lógica de Nginx (Versión Actual: v12)
El servidor actúa como un "Policía de Tráfico" inteligente:
- **Prioridad IP**: Si entras por `http://143.47.101.209/`, te permite ver todo por HTTP (seguridad mínima para trabajar rápido).
- **Prioridad Dominio**: Si entras por `tecnobit.club`, te obliga a usar HTTPS (profesionalidad).
- **Limpieza de Rutas**: Cualquier error en la URL te devuelve automáticamente a la página principal para evitar pantallas de error 404.

---

## 📂 Guía de Despliegue (Cómo subir cambios)

### Para TecnoBit (Local -> Servidor)
1. En tu carpeta local: `npm run build`
2. Subir archivos: 
   ```bash
   scp -i tu-llave.key -r dist/* ubuntu@143.47.101.209:/var/www/tecnobit/
   ```

### Para CasaVida (Backend)
1. Subir el JAR a `/var/www/casavida/`.
2. Reiniciar servicio:
   ```bash
   sudo systemctl restart casavida
   ```

---

> [!IMPORTANT]
> **Acción Requerida**: Para que la configuración HTTPS sea visible desde el exterior, debes entrar al panel de Oracle Cloud e incluir los puertos **443** y **8085** en las Ingress Rules de tu Security List.
