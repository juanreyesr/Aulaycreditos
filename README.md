# Aula Virtual CPG + Créditos Académicos (Repo integrado)

Este repositorio integra **dos web apps** en un solo proyecto Next.js:

1. **Aula Virtual CPG (Next.js)**
   - Catálogo de cursos (tipo “Netflix”) con YouTube embed.
   - Evaluaciones (quiz), intento, aprobación y emisión de certificado PDF.
   - Panel de administración (/admin) para cursos, evaluaciones y ajustes de certificados.

2. **Créditos Académicos (módulo estático dentro del mismo dominio)**
   - Se aloja en `public/creditos/*`.
   - Se accede desde la SPA en `/creditos` (se muestra embebido en un iframe).
   - **NO** incluye credenciales hardcodeadas: se inyectan desde Next en `/creditos/env`.

## Principio clave de esta integración
La verificación de administración **se toma de la app de Créditos Académicos**.

- La tabla autoridad es: `public.perfiles`
- El campo que define admin es: `public.perfiles.is_admin`

La app **Aula Virtual** no usa `profiles.role`.

---

## Requisitos
- Node.js 20 LTS (Vercel lo soporta).
- Un proyecto Supabase (idealmente el MISMO que ya usas para Créditos Académicos).

Opcional:
- `YOUTUBE_API_KEY` (para obtener duración real desde YouTube Data API v3).

---

## 1) Supabase: ejecutar el esquema de Aula Virtual (sin romper Créditos)

En tu proyecto de Supabase (el que ya funciona con Créditos Académicos):

1. Supabase → **SQL Editor**
2. Abre el archivo: `supabase/schema.sql` (en este repo) y ejecútalo completo.

Notas:
- Este `schema.sql` **no crea** triggers sobre `auth.users` (para no chocar con Créditos).
- La función `is_admin(uid)` consulta `public.perfiles.is_admin`.

### Definir administrador (desde tu base de Créditos)
Si tu usuario ya existe en Auth, solo marca admin así:

```sql
update public.perfiles
set is_admin = true
where user_id = (select id from auth.users where email = 'TU_CORREO_ADMIN');
```

---

## 2) Variables de entorno (Vercel o local)

### Obligatorias
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

> En Supabase, el **publishable key** normalmente corresponde al “anon key”.

### Opcionales (Aula Virtual)
- `YOUTUBE_API_KEY`
- `NEXT_PUBLIC_CERT_LOGO_URL` (logo PNG para certificados)
- `NEXT_PUBLIC_SITE_URL` (URL pública en producción; mejora enlaces de verificación)

### Cómo funciona Créditos sin hardcodear credenciales
Los HTML de `public/creditos/*.html` cargan:

- `/creditos/env`

Ese endpoint entrega un script que setea `window.SB_URL` y `window.SB_KEY` usando las variables de entorno anteriores.

---

## 3) Desarrollo local (macOS)

1. Instala dependencias:
```bash
npm install
```

2. Crea un archivo `.env.local` en la raíz (no se sube a GitHub):
```bash
NEXT_PUBLIC_SUPABASE_URL="https://TU_PROYECTO.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="TU_PUBLISHABLE_KEY"
```

3. Ejecuta:
```bash
npm run dev
```

4. Abre:
- Aula Virtual: `http://localhost:3000/`
- Créditos: `http://localhost:3000/creditos`

---

## 4) Deploy en Vercel (recomendado)

1. Sube este repo a GitHub.
2. Vercel → **New Project** → Importa el repositorio.
3. Framework: Next.js.
4. Agrega variables de entorno (sección 2).
5. Deploy.

---

## Rutas principales

### Aula Virtual
- `/` catálogo
- `/v/<courseId>` detalle del curso
- `/v/<courseId>/quiz` evaluación
- `/my` progreso
- `/admin` administración (requiere `perfiles.is_admin = true`)

### Créditos Académicos (módulo)
- `/creditos` (contenedor/iframe)
- `/creditos/index.html` (app original)
- `/creditos/verificar.html` (verificación pública)
- `/auth-callback.html` (callback requerido por la app de Créditos)
- `/creditos/env` (inyector de credenciales)

---

## Notas prácticas
- Si ya tienes usuarios, registros y super-admin en Créditos, **no los toques**: esta integración está hecha para reutilizar esa misma autoridad (`perfiles.is_admin`).
- Si necesitas que Aula y Créditos compartan sesión en un solo login (SSO real), se puede implementar luego (implica migrar el módulo estático a flujos SSR/cookies o mover Créditos a rutas Next nativas).
