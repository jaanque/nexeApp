import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStripePayment } from '@/hooks/useStripePayment';

interface CartItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

export default function CheckoutScreen() {
  const { cartData, restaurantName } = useLocalSearchParams();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { initializePaymentSheet, openPaymentSheet } = useStripePayment();

  useEffect(() => {
    if (typeof cartData === 'string') {
      try {
        setItems(JSON.parse(cartData));
      } catch (e) {
        console.error("Error parsing cart data", e);
      }
    }
  }, [cartData]);

  const totalCost = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
         Alert.alert("Error", "Debes iniciar sesión para realizar un pedido.");
         setLoading(false);
         return;
      }

      // 1. Initialize Stripe Payment
      const orderId = await initializePaymentSheet(items);
      if (!orderId) {
          setLoading(false);
          return;
      }

      // 2. Present Payment Sheet
      const { success, canceled } = await openPaymentSheet();

      if (canceled) {
          setLoading(false);
          return;
      }

      if (success) {
          // Insert movement record (optional, as webhook handles orders)
          const restName = Array.isArray(restaurantName) ? restaurantName[0] : restaurantName;
          const { error: movementError } = await supabase.from('movements').insert({
            user_id: session.user.id,
            amount: -totalCost,
            description: `Pedido #${orderId} en ${restName || 'Restaurante'}`,
            type: 'spend'
          });

          if (movementError) {
            console.error("Error saving movement:", movementError);
          }

          // Finish
          Alert.alert("¡Pedido Confirmado!", "Tu pedido ha sido realizado correctamente.", [
            { text: "OK", onPress: () => router.dismissAll() }
          ]);
      }

    } catch (error) {
      console.error("Payment error:", error);
      Alert.alert("Error", "Hubo un problema al procesar el pago.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resumen del Pedido</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.restaurantName}>{restaurantName}</Text>

        <View style={styles.itemsList}>
          {items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemQuantity}>
                <Text style={styles.qtyText}>{item.quantity}x</Text>
              </View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>{(item.price * item.quantity).toFixed(2)}€</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total a pagar</Text>
          <Text style={styles.summaryValue}>{totalCost.toFixed(2)}€</Text>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
            style={[styles.payButton, loading && styles.disabledButton]}
            onPress={handlePayment}
            disabled={loading}
        >
            {loading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={styles.payButtonText}>Pagar {totalCost.toFixed(2)}€</Text>
            )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  itemsList: {
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  itemQuantity: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 12,
  },
  qtyText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  payButton: {
    backgroundColor: '#222',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
