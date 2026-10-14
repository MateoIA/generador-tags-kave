# Generador Tags Kave

## Estado

✅ Producción

## Descripción

Aplicación web interna para la generación de etiquetas Kave Home a partir de datos de SIMGEST.

La aplicación permite seleccionar un rango de pedidos y generar automáticamente un fichero CSV compatible con los procesos internos de etiquetado.

## Tecnologías

- Node.js
- Express
- Firebird
- Docker
- Docker Compose
- Proxmox LXC
- NPM Plus
- Cloudflare DNS

## Arquitectura

Usuario
↓
tags-kave.famasofas.net
↓
NPM Plus
↓
Docker (kave-tags)
↓
Firebird SIMGEST

## Despliegue

### Servidor

Servidor:
apps-internas

IP:
10.2.2.121

### Contenedor Docker

Nombre:

kave-tags

Puerto interno:

3000

### DNS

Nombre:

tags-kave.famasofas.net

### SSL

Certificado TLS activo mediante:

- Let's Encrypt
- Desafío DNS de Cloudflare
- Gestionado desde NPM Plus

## Funcionalidades

- Consulta directa a Firebird
- Generación de CSV
- Historial de actividad
- Registro de IP
- Registro de tiempos de ejecución
- Descarga inmediata del fichero

## Ejemplo de log

```text
2026-10-09 09:13:08 | APP=KAVE | IP=10.2.2.35 | DESDE=2381 | HASTA=2389 | LINEAS=170 | TIEMPO=0.46s | CSV=kave_home_2381_2389.csv