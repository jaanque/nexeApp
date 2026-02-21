# Solución Final y Correcta para Pagos con Stripe y Supabase

Este documento describe paso a paso cómo configurar correctamente el sistema de pagos para evitar el error `FunctionsHttpError: Edge Function returned a non-2xx status code`.

## 1. Configuración de Base de Datos (Crucial)

El error 500 a menudo ocurre porque la función intenta escribir en tablas que no existen.

1.  Ve al **SQL Editor** de tu proyecto en Supabase.
2.  Copia y ejecuta el contenido del archivo `databasePAYMENTS.sql` que se encuentra en la raíz de este proyecto.
    *   Este script crea las tablas `orders` y `payment_attempts`.
    *   Añade la columna `stripe_customer_id` a la tabla `profiles`.
    *   Configura las políticas de seguridad (RLS).

## 2. Configuración de Secretos en Supabase (El Error Más Común)

Las Edge Functions **NO** tienen acceso a tu archivo `.env` local. Debes subir las claves a la nube de Supabase.

Ejecuta estos comandos en tu terminal:

```bash
# 1. Tu Clave Secreta de Stripe (Empieza con sk_...)
supabase secrets set STRIPE_SECRET_KEY=sk_test_...

# 2. (Opcional si usas webhooks) Tu Clave de Firma de Webhook (Empieza con whsec_...)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

*Nota: La clave `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_URL` se inyectan automáticamente en Supabase, no necesitas configurarlas manualmente.*

## 3. Despliegue de la Función (Actualizar Código)

Si has hecho cambios en `supabase/functions/create-payment-intent/index.ts` (como los que hemos aplicado para mejorar el manejo de errores), debes redesplegar la función.

```bash
supabase functions deploy create-payment-intent --no-verify-jwt
```
*El flag `--no-verify-jwt` es opcional, pero útil si tienes problemas con la validación del token JWT durante el desarrollo.*

## 4. Configuración del Cliente (App React Native)

Asegúrate de que tu archivo `.env` en la raíz del proyecto React Native tenga la clave pública correcta:

```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```
*(Esta clave empieza con `pk_` y es pública. No uses la `sk_` aquí).*

## 5. Verificación y Logs

Si sigues recibiendo el error, sigue estos pasos para encontrar la causa exacta:

1.  Ve al **Dashboard de Supabase** -> **Edge Functions**.
2.  Haz clic en `create-payment-intent`.
3.  Ve a la pestaña **Logs**.
4.  Busca la entrada con el error (círculo rojo) y expande los detalles.
    *   Si dice `STRIPE_SECRET_KEY is missing`, repite el paso 2.
    *   Si dice `relation "public.profiles" does not exist`, repite el paso 1.
    *   Si dice `Error creating order...`, revisa los permisos RLS.

## Resumen de Cambios Aplicados en el Código

Hemos aplicado los siguientes arreglos en el código para que sea más robusto:

1.  **`databasePAYMENTS.sql`**: Script SQL completo para crear la estructura necesaria.
2.  **`supabase/functions/create-payment-intent/index.ts`**:
    *   Se añadió validación de variables de entorno al inicio.
    *   Se cambió `.single()` por `.maybeSingle()` para evitar errores si el usuario no tiene perfil.
    *   Se usa `.upsert()` para crear el perfil si no existe.
    *   Se mejoró el manejo de errores para devolver un mensaje JSON claro en lugar de un error genérico.
3.  **`hooks/useStripePayment.ts`**:
    *   Ahora intenta leer el mensaje de error del servidor (JSON) para mostrarte *por qué* falló, en lugar de solo decir "non-2xx status code".

Sigue estos pasos en orden y el sistema de pagos funcionará correctamente.
