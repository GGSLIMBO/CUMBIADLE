Cumbiadle — juego diario tipo "Wordle" basado en cumbia.

-Para acceder al juego online: cumbiadle.vercel.app

Resumen
- Juego web hecho con Next.js (App Router) + TypeScript + Tailwind.
- Cada día se selecciona una canción distinta (seed por fecha) y el jugador debe adivinarla con pistas y un preview restringido por tiempo.

Estado y cambios aplicados
- Cache y fallback local para `/api/game` (reduce dependencia de Deezer).
- Rate-limiting y cache corto en `/api/search` para proteger el proxy a Deezer.
- Banner de errores en UI cuando la partida no carga correctamente.
- Encabezados de seguridad básicos añadidos en `next.config.ts`.

Requisitos
- Node 18+ (recomendado) y npm

Instalación y ejecución local
```bash
npm install
npm run dev
```
Abrir http://localhost:3000

Endpoints útiles
- `GET /api/game` → devuelve `gameData` y `solution` para la partida del día.
- `GET /api/search?q=` → proxy a Deezer y filtrado por la lista local de artistas.

Notas de despliegue (Vercel)
- Este proyecto usa API routes serverless. Para producción recomendamos:
	- Usar Vercel Edge Cache o Vercel KV / Redis en vez de caches en memoria para persistencia entre invocations.
	- Si más adelante usas claves (p. ej. APIs privadas), configúralas como Secrets en Vercel (no las comitees).
	- Verificar que la política de caching (`revalidate`) se comporte como esperas en Vercel.

Seguridad y robustez
- Validar y normalizar datos externos (ya se hace cierta normalización en el backend).
- Reemplazar rate-limiter en memoria por una solución distribuida en producción.
- Añadir monitorización (Sentry) para capturar errores en funciones serverless.

Problemas comunes y soluciones rápidas
- Mensajes de "hydration mismatch" en dev: probar en ventana de incógnito sin extensiones (algunas extensiones inyectan atributos en el DOM). Se corrigió un caso en `app/layout.tsx`.

Pruebas rápidas
```bash
curl http://localhost:3000/api/game
curl 'http://localhost:3000/api/search?q=damas'
```

Siguientes pasos sugeridos
- Cambiar caches locales por Vercel KV / Redis.
- Añadir tests unitarios y E2E (Playwright).
- Añadir CI (GitHub Actions) y monitorización en producción.

Contacto
- Si quieres que implemente alguno de los pasos siguientes (CI, tests, Vercel KV, Sentry), indícamelo y lo comienzo.

