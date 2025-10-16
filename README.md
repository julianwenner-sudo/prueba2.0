# Gestión de ofertas

Aplicación web sencilla desarrollada con Flask para registrar ofertas comerciales, administrar clientes y visualizar un dashboard configurable.

## Requisitos

- Python 3.10+
- Entorno virtual recomendado

## Instalación y ejecución

```bash
python -m venv .venv
source .venv/bin/activate  # En Windows usa .venv\\Scripts\\activate
pip install -r requirements.txt
flask --app app run --debug
```

La primera vez que se ejecute la aplicación se creará automáticamente un archivo SQLite `offers.db` en la raíz del proyecto.

## Funcionalidades

- **Dashboard personalizable** con tarjetas de resumen, filtros por estado, cliente y rango de fechas.
- **Gestión de clientes** para registrar nuevos clientes y ver los existentes.
- **Registro de ofertas** con selección de cliente existente o creación rápida de uno nuevo. Calcula el margen (precio - costo) automáticamente.

Las preferencias del dashboard (columnas visibles) se almacenan en la sesión del navegador, permitiendo ajustar la vista según las métricas relevantes para cada usuario.
