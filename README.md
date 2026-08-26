# Carlangax Hub

App personal: trading, video, organización y recordatorios. Login con cuenta propia, datos en Supabase (Postgres + Auth + Storage).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS · Supabase

## Setup

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta gratis.
2. Crea un proyecto nuevo (elige una región cercana, ej. `us-east-1`).
3. Cuando termine de aprovisionar, ve a **Project Settings → API**.
4. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Configurar variables de entorno

Edita `.env.local` en la raíz del proyecto y pega tus valores:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 3. Crear el esquema de base de datos

1. En el dashboard de Supabase, ve a **SQL Editor**.
2. Pega el contenido completo de [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) y ejecútalo (botón **Run**).
3. Esto crea las tablas `trades`, `videos`, `reminders`, sus políticas de seguridad (RLS — cada quien solo ve lo suyo) y el bucket de storage `videos` para tus archivos.

### 4. Instalar y correr

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Te va a mandar a `/login` — usa "¿Primera vez? Crea tu cuenta" para crear tu usuario.

> Si tu proyecto de Supabase tiene activada la confirmación por email (viene así por default), revisa tu correo y confirma antes de iniciar sesión.

## Estructura

```
src/
  app/
    login/            → pantalla de login/signup
    (app)/             → rutas protegidas (requieren sesión)
      dashboard/
      trading/
      videos/
      reminders/
    auth/callback/     → intercambio de código OAuth/email
  lib/
    supabase/          → clientes (browser, server, proxy/middleware)
    actions/           → Server Actions (mutaciones por módulo)
    types.ts
  components/          → UI + componentes por módulo
supabase/
  migrations/0001_init.sql
```

## Cómo agregar un módulo nuevo (a futuro)

1. Tabla nueva en `supabase/migrations/000X_xxx.sql` con RLS igual al patrón de las existentes.
2. Tipo en `src/lib/types.ts`.
3. Server Actions en `src/lib/actions/`.
4. Página en `src/app/(app)/tu-modulo/page.tsx`.
5. Entrada en el nav de [`src/components/Sidebar.tsx`](src/components/Sidebar.tsx).
