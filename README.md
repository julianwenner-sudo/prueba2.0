# Gestión de ofertas (TypeScript + Next.js)

Aplicación web ligera para registrar clientes y ofertas comerciales totalmente construida con Next.js 14 y React en TypeScript. Pensada para desplegarse fácilmente en Vercel aprovechando el almacenamiento local del navegador.

## Características

- **Dashboard** con tarjetas de métricas, filtros por cliente, estado y fechas, y selección de columnas visibles.
- **Gestión de clientes** para registrar y listar clientes con persistencia en `localStorage`.
- **Registro de ofertas** con cálculo automático de margen y opción de crear clientes al vuelo.
- **Interfaz en español** basada en componentes de Bootstrap 5.

> Nota: Los datos se almacenan únicamente en el navegador mediante `localStorage` para simplificar el despliegue serverless. Cada navegador/usuario tendrá su propio conjunto de datos.

## Requisitos

- Node.js 18.17+ (recomendado Node 20)
- npm, pnpm o yarn

## Puesta en marcha

```bash
npm install
npm run dev
```

La aplicación quedará disponible en [http://localhost:3000](http://localhost:3000).

### Scripts disponibles

- `npm run dev`: inicia el servidor de desarrollo.
- `npm run build`: genera la versión optimizada para producción.
- `npm run start`: ejecuta la versión de producción.
- `npm run lint`: ejecuta las reglas de ESLint incluidas en Next.js.

## Despliegue en Vercel

1. Crea un nuevo proyecto en Vercel e importa este repositorio.
2. Selecciona **Next.js** como framework y utiliza los valores por defecto.
3. Tras el despliegue, los datos se guardarán por navegador gracias al uso de `localStorage` del lado del cliente.
