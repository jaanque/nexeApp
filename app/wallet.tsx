import { View, StyleSheet, Text, Dimensions, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { RealtimeChannel } from '@supabase/supabase-js';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';

// Mock data for transactions since backend table is not available
const TRANSACTIONS = [
  { id: '1', title: 'Compra en Tienda', date: 'Hoy, 10:30 AM', amount: '+50', type: 'earn' },
  { id: '2', title: 'Canje de Cupón', date: 'Ayer, 4:15 PM', amount: '-200', type: 'spend' },
  { id: '3', title: 'Bono de Bienvenida', date: '12 May, 2024', amount: '+100', type: 'earn' },
  { id: '4', title: 'Compra Online', date: '10 May, 2024', amount: '+25', type: 'earn' },
];

export default function WalletScreen() {
  const [points, setPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: RealtimeChannel;

    async function setupWallet() {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // 1. Initial Fetch
          const { data, error } = await supabase
            .from('profiles')
            .select('points')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Error fetching points:', error);
            setPoints(0);
          } else if (data) {
            setPoints(data.points || 0);
          }

          // 2. Real-time Subscription
          channel = supabase
            .channel(`public:profiles:${session.user.id}`)
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${session.user.id}`,
              },
              (payload) => {
                if (payload.new && typeof payload.new.points === 'number') {
                  setPoints(payload.new.points);
                }
              }
            )
            .subscribe();
        } else {
          setPoints(0);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    }

    setupWallet();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Generate chart data
  const dataPoints = points > 0
    ? [points * 0.2, points * 0.3, points * 0.25, points * 0.6, points * 0.8, points]
    : [0, 0, 0, 0, 0, 0];

  const chartData = {
    labels: ["", "", "", "", "", ""],
    datasets: [
      {
        data: dataPoints,
        color: (opacity = 1) => `rgba(10, 126, 164, ${opacity})`, // Using theme tint color
        strokeWidth: 3
      }
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(10, 126, 164, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#fff"
    },
    fillShadowGradientFrom: "#0a7ea4",
    fillShadowGradientTo: "#ffffff",
    fillShadowGradientOpacity: 0.3,
  };

  const screenWidth = Dimensions.get("window").width;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Mi Billetera</Text>
            <Text style={styles.headerSubtitle}>Gestiona tus puntos y recompensas</Text>
          </View>
          <TouchableOpacity style={styles.iconButton}>
             <Ionicons name="notifications-outline" size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>

        {/* Wallet Card */}
        <View style={styles.cardContainer}>
          <LinearGradient
            colors={[Colors.light.tint, '#005f73']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardLabel}>Puntos Disponibles</Text>
                {loading ? (
                    <ActivityIndicator size="small" color="#fff" style={{marginTop: 5, alignSelf: 'flex-start'}} />
                ) : (
                    <Text style={styles.cardBalance}>{points.toLocaleString()}</Text>
                )}
              </View>
              <Ionicons name="qr-code-outline" size={32} color="rgba(255,255,255,0.8)" />
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.tierBadge}>
                <Ionicons name="star" size={12} color="#FFD700" style={{ marginRight: 4 }} />
                <Text style={styles.tierText}>Miembro Gold</Text>
              </View>
              <Text style={styles.cardNumber}>**** **** **** 1234</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Action Grid */}
        <View style={styles.actionGrid}>
          <ActionButton icon="gift-outline" label="Canjear" />
          <ActionButton icon="time-outline" label="Historial" />
          <ActionButton icon="scan-outline" label="Escanear" />
          <ActionButton icon="information-circle-outline" label="Info" />
        </View>

        {/* Chart Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tendencia de Puntos</Text>
            <View style={styles.periodBadge}>
              <Text style={styles.periodBadgeText}>6M</Text>
            </View>
          </View>

          <View style={styles.chartWrapper}>
             {!loading && (
                <LineChart
                    data={chartData}
                    width={screenWidth - 40} // subtracting padding
                    height={180}
                    chartConfig={chartConfig}
                    bezier
                    withDots={true}
                    withInnerLines={false}
                    withOuterLines={false}
                    withVerticalLines={false}
                    withHorizontalLines={false}
                    withHorizontalLabels={false}
                    style={styles.chart}
                />
            )}
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={[styles.section, { marginBottom: 100 }]}>
          <Text style={styles.sectionTitle}>Actividad Reciente</Text>
          <View style={styles.transactionList}>
            {TRANSACTIONS.map((item) => (
              <View key={item.id} style={styles.transactionItem}>
                <View style={styles.transactionIconContainer}>
                  <Ionicons
                    name={item.type === 'earn' ? "arrow-down-circle" : "arrow-up-circle"}
                    size={24}
                    color={item.type === 'earn' ? "#4CAF50" : "#F44336"}
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionTitle}>{item.title}</Text>
                  <Text style={styles.transactionDate}>{item.date}</Text>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  { color: item.type === 'earn' ? "#4CAF50" : "#333" }
                ]}>
                  {item.amount} pts
                </Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton({ icon, label }: { icon: any, label: string }) {
  return (
    <TouchableOpacity style={styles.actionButton}>
      <View style={styles.actionIconCircle}>
        <Ionicons name={icon} size={24} color={Colors.light.tint} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Slightly off-white for depth
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  iconButton: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Card Styles
  cardContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    height: 200,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardBalance: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tierText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  cardNumber: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    letterSpacing: 1,
  },

  // Action Grid
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  actionButton: {
    alignItems: 'center',
    width: 70,
  },
  actionIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionLabel: {
    fontSize: 12,
    color: '#444',
    fontWeight: '500',
  },

  // Sections
  section: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  periodBadge: {
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  periodBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4A5568',
  },

  // Chart
  chartWrapper: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  chart: {
    marginTop: 10,
    borderRadius: 16,
  },

  // Transactions
  transactionList: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  transactionDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});
