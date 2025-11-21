# Implementación de Geolocalización IP - Guía Completa

## 📊 Opciones Gratuitas para Uso Comercial

Después de analizar las opciones disponibles, aquí están las **mejores soluciones gratuitas** para geolocalización IP con alto volumen de usuarios:

---

## ✅ OPCIÓN RECOMENDADA: Base de Datos Local (GeoLite2 / DB-IP)

### **Ventajas:**
- ✅ **100% GRATIS** para uso comercial
- ✅ **Sin límites de consultas** (lookup local)
- ✅ **Ultra rápido** (< 1ms por lookup)
- ✅ **Sin dependencia de APIs externas**
- ✅ **Perfecto para alto volumen**
- ✅ **Incluye país, estado/región y ciudad**

### **Desventajas:**
- ⚠️ Requiere actualización periódica (semanal/mensual)
- ⚠️ Ocupa espacio en disco (~100-200MB)
- ⚠️ Requiere librería de lectura MMDB

---

## 🎯 IMPLEMENTACIÓN RECOMENDADA

### **1. MaxMind GeoLite2 (RECOMENDADO)**

#### Características:
- **Licencia:** Gratuita con atribución (CC BY-SA 4.0)
- **Actualización:** 2 veces por semana (automático)
- **Precisión:** ~99.8% para país, ~90% para ciudad
- **Datos incluidos:** País, región/estado, ciudad, código postal, latitud/longitud

#### Instalación:

```bash
# En el servidor
cd server
npm install maxmind
```

#### Descargar base de datos:

```bash
# Opción 1: Via CDN (actualizado automáticamente)
curl -o GeoLite2-City.mmdb https://cdn.jsdelivr.net/npm/@ip-location-db/geolite2-city-mmdb/geolite2-city.mmdb

# Opción 2: Desde npm package
npm install @ip-location-db/geolite2-city-mmdb
```

#### Código de implementación:

```javascript
// server/src/utils/geoip.js
import maxmind from 'maxmind';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cityLookup = null;

/**
 * Inicializar el lector de GeoIP
 */
export async function initGeoIP() {
    try {
        const dbPath = path.join(__dirname, '../../data/GeoLite2-City.mmdb');
        cityLookup = await maxmind.open(dbPath);
        console.log('✅ GeoIP database loaded successfully');
        return true;
    } catch (error) {
        console.error('❌ Error loading GeoIP database:', error);
        return false;
    }
}

/**
 * Obtener información geográfica de una IP
 * @param {string} ip - Dirección IP a consultar
 * @returns {Object} Información geográfica
 */
export function getGeoData(ip) {
    if (!cityLookup) {
        return {
            country: null,
            state: null,
            city: null
        };
    }

    try {
        const data = cityLookup.get(ip);
        
        if (!data) {
            return {
                country: null,
                state: null,
                city: null
            };
        }

        return {
            country: data.country?.names?.en || null,
            countryCode: data.country?.iso_code || null,
            state: data.subdivisions?.[0]?.names?.en || null,
            stateCode: data.subdivisions?.[0]?.iso_code || null,
            city: data.city?.names?.en || null,
            postalCode: data.postal?.code || null,
            latitude: data.location?.latitude || null,
            longitude: data.location?.longitude || null,
            timezone: data.location?.time_zone || null
        };
    } catch (error) {
        console.error('Error getting geo data:', error);
        return {
            country: null,
            state: null,
            city: null
        };
    }
}

/**
 * Verificar si una IP es válida
 */
export function isValidIP(ip) {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}
```

#### Uso en las suscripciones:

```javascript
// server/src/routes/subscriptions.js
import { getGeoData } from '../utils/geoip.js';

router.post('/subscribe', async (req, res) => {
    try {
        const { endpoint, keys } = req.body;
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        
        // Obtener datos geográficos
        const geoData = getGeoData(ip);
        
        // Guardar suscripción con datos geográficos
        const result = await pool.query(`
            INSERT INTO subscriptions (
                endpoint, p256dh, auth, user_agent, ip, 
                country, state, city, site_id, user_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `, [
            endpoint,
            keys.p256dh,
            keys.auth,
            req.headers['user-agent'],
            ip,
            geoData.country,
            geoData.state,
            geoData.city,
            siteId,
            userId
        ]);
        
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        logger.error({ err: error }, 'Error in subscription');
        res.status(500).json({ success: false, error: 'Subscription failed' });
    }
});
```

#### Inicializar en app.js:

```javascript
// server/src/app.js
import { initGeoIP } from './utils/geoip.js';

// Al inicio de la aplicación
async function startServer() {
    // Inicializar GeoIP
    await initGeoIP();
    
    // ... resto del código
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer();
```

#### Script de actualización automática:

```javascript
// server/scripts/update-geoip-db.js
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_URL = 'https://cdn.jsdelivr.net/npm/@ip-location-db/geolite2-city-mmdb/geolite2-city.mmdb';
const DB_PATH = path.join(__dirname, '../data/GeoLite2-City.mmdb');

console.log('📥 Downloading GeoLite2 database...');

const file = fs.createWriteStream(DB_PATH);

https.get(DB_URL, (response) => {
    response.pipe(file);
    
    file.on('finish', () => {
        file.close();
        console.log('✅ GeoLite2 database updated successfully!');
    });
}).on('error', (err) => {
    fs.unlink(DB_PATH, () => {});
    console.error('❌ Error downloading database:', err.message);
    process.exit(1);
});
```

#### Agregar a package.json:

```json
{
  "scripts": {
    "update-geoip": "node scripts/update-geoip-db.js"
  }
}
```

#### Cron job para actualización semanal (Linux/Mac):

```bash
# Editar crontab
crontab -e

# Agregar (actualiza cada domingo a las 3 AM)
0 3 * * 0 cd /path/to/pushsaas/server && npm run update-geoip
```

---

## 🔄 OPCIÓN ALTERNATIVA: DB-IP Lite

Similar a GeoLite2, pero con licencia Creative Commons:

```bash
# Descargar DB-IP Lite
curl -o dbip-city.mmdb https://cdn.jsdelivr.net/npm/@ip-location-db/dbip-city-mmdb/dbip-city-ipv4.mmdb
```

Mismo código, solo cambiar la ruta del archivo.

---

## ❌ OPCIONES NO RECOMENDADAS PARA PRODUCCIÓN

### **ip-api.com**
- ❌ **45 requests/minuto** (muy limitado)
- ❌ **NO permitido para uso comercial** (versión gratuita)
- ✅ Requiere plan PRO ($13/mes) para uso comercial

### **geoip.sh**
- ❌ Sin límites documentados (riesgo)
- ❌ Sin garantías de uptime
- ❌ Dependencia de servicio externo

---

## 📈 COMPARATIVA DE RENDIMIENTO

| Método | Velocidad | Costo | Límites | Comercial |
|--------|-----------|-------|---------|-----------|
| **GeoLite2 Local** | <1ms | $0 | Ilimitado | ✅ Sí |
| **DB-IP Local** | <1ms | $0 | Ilimitado | ✅ Sí |
| ip-api.com | 50-200ms | $0 | 45/min | ❌ No |
| geoip.sh | 100-300ms | $0 | ? | ⚠️ No especificado |

---

## 🎯 RECOMENDACIÓN FINAL

**Usar MaxMind GeoLite2 con base de datos local**

### Por qué:
1. ✅ **Completamente gratuito** para uso comercial
2. ✅ **Sin límites** de consultas
3. ✅ **Ultra rápido** (importante con muchos usuarios)
4. ✅ **Alta precisión** (~99.8% para países)
5. ✅ **Fácil de implementar** (librería npm existente)
6. ✅ **Actualización automática** disponible
7. ✅ **Incluye todos los datos** necesarios (país, estado, ciudad)

### Costo de almacenamiento:
- Base de datos: ~100-200MB
- Memoria RAM en uso: ~50-100MB
- Totalmente aceptable para un servidor moderno

---

## 📝 PASOS DE IMPLEMENTACIÓN

1. ✅ **Ejecutar migración SQL** (ya creada)
2. ✅ **Instalar dependencias**: `npm install maxmind`
3. ✅ **Crear directorio data**: `mkdir server/data`
4. ✅ **Descargar base de datos**: `npm run update-geoip`
5. ✅ **Crear utils/geoip.js** (código arriba)
6. ✅ **Inicializar en app.js**
7. ✅ **Actualizar endpoint de suscripciones**
8. ✅ **Configurar actualización automática**

---

## 🔒 LICENCIA Y ATRIBUCIÓN

**GeoLite2:**
- Licencia: CC BY-SA 4.0
- Atribución requerida: "This product includes GeoLite2 data created by MaxMind, available from https://www.maxmind.com"
- ✅ Uso comercial permitido
- ❌ No usar para identificar individuos específicos
- ❌ No usar para propósitos FCRA

**DB-IP:**
- Licencia: CC BY 4.0
- Atribución: "IP Geolocation by DB-IP"
- ✅ Uso comercial permitido

---

## 📊 PLAN DE ACTUALIZACIÓN

- **Frecuencia recomendada:** Semanal
- **Método:** Cron job automático
- **Backup:** Mantener versión anterior por 7 días
- **Monitoreo:** Log de actualizaciones exitosas/fallidas

---

## 🚀 VENTAJAS PARA ALTO VOLUMEN

Con **miles de usuarios**:
- ✅ **0 costo** por consulta
- ✅ **0 latencia** de red (local)
- ✅ **Sin throttling** ni rate limits
- ✅ **100% disponibilidad** (no depende de APIs externas)
- ✅ **Escalable horizontalmente** (cada servidor tiene su DB)
