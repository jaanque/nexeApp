# Configuración de Stripe y Supabase

Este documento detalla los pasos para configurar los pagos con Stripe en tu proyecto Supabase + React Native.

## 1. Configurar Secretos en Supabase

Para que las Edge Functions puedan comunicarse con Stripe de forma segura, necesitas establecer las variables de entorno.

**Opción A: Desde el Dashboard de Supabase**
1. Ve a tu proyecto en Supabase.
2. Navega a **Project Settings** -> **Edge Functions**.
3. Añade las siguientes variables:
   - `STRIPE_SECRET_KEY`: `<TU_CLAVE_SECRETA_DE_STRIPE>` (Tu clave secreta)
   - `STRIPE_WEBHOOK_SECRET`: (Se obtiene en el paso 3)

**Opción B: Usando Supabase CLI**
Ejecuta los siguientes comandos en tu terminal:

```bash
supabase secrets set STRIPE_SECRET_KEY=<TU_CLAVE_SECRETA_DE_STRIPE>
```

## 2. Desplegar Edge Functions

Despliega las funciones que hemos creado (`create-payment-intent` y `stripe-webhook`):

```bash
supabase functions deploy create-payment-intent
supabase functions deploy stripe-webhook
```

Si no tienes el CLI configurado, sigue la [guía oficial](https://supabase.com/docs/guides/cli).

## 3. Configurar Webhook de Stripe

Para que tu base de datos se actualice automáticamente cuando un pago sea exitoso:

1. Ve al [Dashboard de Stripe > Developers > Webhooks](https://dashboard.stripe.com/test/webhooks).
2. Haz clic en **Add endpoint**.
3. En **Endpoint URL**, introduce la URL de tu función desplegada:
   `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
   *(Reemplaza `<project-ref>` con el ID de tu proyecto Supabase, e.g., `wxhioiyilbgxvksxusya`)*.
4. En **Select events**, selecciona:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Haz clic en **Add endpoint**.
6. Una vez creado, verás un **Signing secret** (empieza por `whsec_...`). Copia este valor.
7. Configura este secreto en Supabase:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_tu_secreto_aqui
```

## 4. Base de Datos

Asegúrate de ejecutar el script `databasePAYMENTS.sql` en tu SQL Editor de Supabase para crear las tablas necesarias (`orders` y `payment_attempts`).

## 5. Frontend

El frontend necesita tu clave pública de Stripe. Crea un archivo `.env` en la raíz de tu proyecto y añade:

```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51RdwETLJN65JZ6ThYHq3XZ2GiEkN0rGeynIw6vnhjDxLnly2CYiYRECCEzpytp2zWdu4LeAfMT1VFrnHKTyAIS1U00hKky4Jc8
```

El archivo `app/_layout.tsx` utilizará esta variable de entorno.

## Notas Adicionales

- **Precios Seguros:** La función `create-payment-intent` recalcula los precios consultando la base de datos `items` para evitar manipulaciones desde el cliente.
- **Logs:** Se ha creado una tabla `payment_attempts` para registrar tanto los pagos exitosos como los fallidos.
