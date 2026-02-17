import { View, StyleSheet, Text, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack, useFocusEffect } from 'expo-router';

// Type for Movement
interface Movement {
  id: number;
  amount: number;
  description: string;
  type: 'earn' | 'spend';
  created_at: string;
}

export default function WalletScreen() {
  const [points, setPoints] = useState<number>(0);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      fetchWalletData();
    }, [])
  );

  async function fetchWalletData() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Fetch Points
        const { data: profile } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', session.user.id)
          .single();

        if (profile) setPoints(profile.points || 0);

        // Fetch Movements
        const { data: moves, error } = await supabase
          .from('movements')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (moves) setMovements(moves);
        if (error) console.error("Error fetching movements:", error);
      }
    } catch (error) {
      console.error("Error loading wallet:", error);
    } finally {
      setLoading(false);
    }
  }

  const renderItem = ({ item }: { item: Movement }) => {
    const isPositive = item.amount > 0;
    const date = new Date(item.created_at).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });

    return (
      <View style={styles.movementItem}>
        <View style={[styles.iconContainer, { backgroundColor: isPositive ? '#E8F5E9' : '#FFEBEE' }]}>
          <Ionicons
            name={isPositive ? "arrow-down" : "arrow-up"}
            size={20}
            color={isPositive ? "#4CAF50" : "#F44336"}
          />
        </View>
        <View style={styles.movementDetails}>
          <Text style={styles.movementTitle}>{item.description || "Movimiento"}</Text>
          <Text style={styles.movementDate}>{date}</Text>
        </View>
        <Text style={[styles.movementAmount, { color: isPositive ? "#4CAF50" : "#000" }]}>
          {isPositive ? "+" : ""}{item.amount} pts
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: 'Tu Cartera' }} />

      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Saldo Actual</Text>
        <Text style={styles.balanceValue}>{points.toLocaleString()} pts</Text>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>Historial</Text>
        {loading ? (
            <ActivityIndicator style={{marginTop: 20}} size="large" color="#000" />
        ) : movements.length === 0 ? (
            <Text style={styles.emptyText}>No tienes movimientos aún.</Text>
        ) : (
            <FlatList
                data={movements}
                renderItem={renderItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  balanceContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginHorizontal: 20,
      marginTop: 20,
      marginBottom: 10,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyText: {
      textAlign: 'center',
      marginTop: 40,
      color: '#888',
      fontSize: 16,
  },
  movementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  movementDetails: {
    flex: 1,
  },
  movementTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  movementDate: {
    fontSize: 12,
    color: '#888',
  },
  movementAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
