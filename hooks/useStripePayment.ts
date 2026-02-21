import { useState } from 'react';
import { Alert } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { supabase } from '@/lib/supabase';

interface CartItem {
    id: number;
    quantity: number;
}

export function useStripePayment() {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [loading, setLoading] = useState(false);

    const initializePaymentSheet = async (items: CartItem[]) => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user || !session?.access_token) {
                Alert.alert('Error', 'Debes iniciar sesión para pagar.');
                return null;
            }

            console.log('Invoking create-payment-intent with items:', items);
            // console.log('Using access token:', session.access_token.substring(0, 10) + '...');

            // 1. Fetch PaymentIntent params from Edge Function
            // Note: user_id is inferred from the Auth header automatically sent by supabase.functions.invoke
            // We explicitly pass the Authorization header just in case, though invoke() does it automatically.
            const { data, error } = await supabase.functions.invoke('create-payment-intent', {
                body: { items },
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });

            if (error) {
                console.error('Supabase function error:', error);
                let errorMessage = error.message;

                // Attempt to extract detailed error message from response body
                if (error && typeof error === 'object' && 'context' in error) {
                    const httpError = error as any;
                    // Check if context looks like a Response object (has json method)
                    if (httpError.context && typeof httpError.context.json === 'function') {
                        try {
                            const errorBody = await httpError.context.json();
                            if (errorBody && errorBody.error) {
                                errorMessage = errorBody.error;
                                console.error('Extracted error message from server:', errorMessage);
                            }
                        } catch (jsonError) {
                            // If JSON parsing fails, we fallback to error.message
                            console.warn('Could not parse error response JSON:', jsonError);
                        }
                    }
                }

                throw new Error(errorMessage || 'Error communicating with server');
            }

            if (!data) {
                throw new Error('No data returned from payment function');
            }

            const { paymentIntent, ephemeralKey, customer, orderId } = data;

            // 2. Initialize the Payment Sheet
            const { error: initError } = await initPaymentSheet({
                merchantDisplayName: 'NEXE App',
                customerId: customer,
                customerEphemeralKeySecret: ephemeralKey,
                paymentIntentClientSecret: paymentIntent,
                allowsDelayedPaymentMethods: true,
                defaultBillingDetails: {
                    email: session.user.email
                },
                returnURL: 'nexeapp://stripe-redirect',
            });

            if (initError) {
                console.error('Stripe init error:', initError);
                throw new Error(initError.message);
            }

            return orderId;

        } catch (e: any) {
            console.error('Payment initialization error:', e);
            Alert.alert('Error de Pago', e.message || 'No se pudo iniciar el proceso de pago.');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const openPaymentSheet = async () => {
        const { error } = await presentPaymentSheet();

        if (error) {
            if (error.code === 'Canceled') {
                return { success: false, canceled: true };
            }
            Alert.alert(`Error de pago`, error.message);
            return { success: false, error };
        } else {
            return { success: true };
        }
    };

    return {
        initializePaymentSheet,
        openPaymentSheet,
        loading,
    };
}
