# Solución Final y Correcta para Pagos con Stripe y Supabase

Este documento describe paso a paso cómo configurar correctamente el sistema de pagos para evitar el error `FunctionsHttpError: Edge Function returned a non-2xx status code` y errores de autorización.

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
*El flag `--no-verify-jwt` es opcional, pero útil si tienes problemas con la validación del token JWT durante el desarrollo. En producción, deberías quitarlo para mayor seguridad.*

## 4. Configuración del Cliente (App React Native)

Asegúrate de que tu archivo `.env` en la raíz del proyecto React Native tenga la clave pública correcta:

```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```
*(Esta clave empieza con `pk_` y es pública. No uses la `sk_` aquí).*

## 5. Solución de Problemas de Autorización ("Unauthorized")

Si recibes el error `Extracted error message from server: Unauthorized`, significa que el token de usuario no está llegando correctamente a la función o ha expirado.

1.  **Asegúrate de estar logueado** en la app.
2.  El código actualizado en `hooks/useStripePayment.ts` ahora envía explícitamente el header `Authorization: Bearer <token>`.
3.  Si estás probando localmente, asegúrate de que tu reloj esté sincronizado, ya que los tokens JWT tienen fecha de expiración.
4.  La función ahora verifica explícitamente la presencia de `SUPABASE_URL` y `SUPABASE_ANON_KEY` en el entorno de la Edge Function. Si recibes un error sobre esto, es posible que algo esté mal con la configuración interna de Supabase (poco probable en producción, pero posible en self-hosting o setups raros).
5.  Si el error dice "getUser failed: ... (status: 401)", entonces tu token ha expirado. Cierra sesión y vuelve a entrar en la app.

## 6. Verificación y Logs

Si sigues recibiendo errores, sigue estos pasos para encontrar la causa exacta:

1.  Ve al **Dashboard de Supabase** -> **Edge Functions**.
2.  Haz clic en `create-payment-intent`.
3.  Ve a la pestaña **Logs**.
4.  Busca la entrada con el error (círculo rojo) y expande los detalles.
    *   Si dice `Authorization header is missing`, el cliente no está enviando el token.
    *   Si dice `Unauthorized: ...`, el token es inválido o el usuario no existe.
    *   Si dice `STRIPE_SECRET_KEY is missing`, repite el paso 2.

## Resumen de Cambios Aplicados en el Código

Hemos aplicado los siguientes arreglos en el código para que sea más robusto:

1.  **`databasePAYMENTS.sql`**: Script SQL completo para crear la estructura necesaria.
2.  **`supabase/functions/create-payment-intent/index.ts`**:
    *   Se añadió validación de variables de entorno al inicio.
    *   Se mejoró la validación del header `Authorization`.
    *   Se cambió `.single()` por `.maybeSingle()` para evitar errores si el usuario no tiene perfil.
    *   Se usa `.upsert()` para crear el perfil si no existe.
3.  **`hooks/useStripePayment.ts`**:
    *   Ahora envía explícitamente el header `Authorization`.
    *   Intenta leer el mensaje de error del servidor (JSON) para mostrarte *por qué* falló.

Sigue estos pasos en orden y el sistema de pagos funcionará correctamente.
