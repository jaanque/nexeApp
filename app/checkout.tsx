import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CartItem {
  id: number;
  name: string;
  quantity: number;
  pointsPrice: number;
}

export default function CheckoutScreen() {
  const { cartData, restaurantName } = useLocalSearchParams();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [userPoints, setUserPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof cartData === 'string') {
      try {
        setItems(JSON.parse(cartData));
      } catch (e) {
        console.error("Error parsing cart data", e);
      }
    }
    fetchUserPoints();
  }, [cartData]);

  async function fetchUserPoints() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', session.user.id)
        .single();
      if (data) {
        setUserPoints(data.points);
      }
    }
  }

  const totalCost = items.reduce((sum, item) => sum + (item.pointsPrice * item.quantity), 0);
  const canPay = userPoints !== null && userPoints >= totalCost;

  const handlePayment = async () => {
    if (!canPay) {
      Alert.alert("Saldo insuficiente", "No tienes suficientes puntos para realizar este pedido.");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const newPoints = (userPoints || 0) - totalCost;

      const { error } = await supabase
        .from('profiles')
        .update({ points: newPoints })
        .eq('id', session.user.id);

      if (error) throw error;

      // Optimistically update local state or just finish
      Alert.alert("¡Pedido Confirmado!", "Tus puntos han sido canjeados correctamente.", [
        { text: "OK", onPress: () => router.dismissAll() } // Go back to root/home
      ]);

    } catch (error) {
      console.error("Payment error:", error);
      Alert.alert("Error", "Hubo un problema al procesar el pago.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

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
              <Text style={styles.itemPrice}>{item.pointsPrice * item.quantity} pts</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total a pagar</Text>
          <Text style={styles.summaryValue}>{totalCost} pts</Text>
        </View>

        <View style={styles.walletInfo}>
          <View style={styles.walletRow}>
             <Ionicons name="wallet-outline" size={20} color="#666" />
             <Text style={styles.walletLabel}>Tus puntos disponibles:</Text>
             <Text style={[styles.walletValue, !canPay && styles.insufficientFunds]}>
                {userPoints !== null ? userPoints : '...'} pts
             </Text>
          </View>
          {!canPay && userPoints !== null && (
              <Text style={styles.errorText}>Te faltan {totalCost - userPoints} puntos</Text>
          )}
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
            style={[styles.payButton, (!canPay || loading) && styles.disabledButton]}
            onPress={handlePayment}
            disabled={!canPay || loading}
        >
            {loading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={styles.payButtonText}>Pagar {totalCost} pts</Text>
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
  walletInfo: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  walletValue: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  insufficientFunds: {
    color: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'right',
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
