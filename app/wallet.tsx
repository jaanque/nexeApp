import { View, StyleSheet, Text, Dimensions, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { RealtimeChannel } from '@supabase/supabase-js';
import { LinearGradient } from 'expo-linear-gradient';

// Mock data for transactions since backend table is not available
const TRANSACTIONS = [
  { id: '1', title: 'Starbucks', date: 'Hoy, 10:30 AM', amount: '-50', type: 'spend', icon: 'cafe-outline' },
  { id: '2', title: 'Top Up', date: 'Ayer, 4:15 PM', amount: '+200', type: 'earn', icon: 'arrow-down-outline' },
  { id: '3', title: 'Uber Eats', date: '12 May, 2024', amount: '-25', type: 'spend', icon: 'fast-food-outline' },
  { id: '4', title: 'Apple Store', date: '10 May, 2024', amount: '-1200', type: 'spend', icon: 'logo-apple' },
  { id: '5', title: 'Bonus', date: '01 May, 2024', amount: '+100', type: 'earn', icon: 'gift-outline' },
];

export default function WalletScreen() {
  const [points, setPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("Usuario");

  useEffect(() => {
    let channel: RealtimeChannel;

    async function setupWallet() {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
            // Get user name
            const meta = session.user.user_metadata;
            const name = meta?.full_name || meta?.username || session.user.email?.split('@')[0] || "Usuario";
            setUserName(name);

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
    ? [points * 0.8, points * 0.85, points * 0.9, points * 0.95, points * 0.98, points]
    : [0, 0, 0, 0, 0, 0];

  const chartData = {
    labels: ["", "", "", "", "", ""],
    datasets: [
      {
        data: dataPoints,
        color: (opacity = 1) => `rgba(10, 126, 164, ${opacity})`, // Using theme tint color
        strokeWidth: 2
      }
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Black line
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "0", // No dots for cleaner look
    },
    fillShadowGradientFrom: "#000",
    fillShadowGradientTo: "#fff",
    fillShadowGradientOpacity: 0.1,
  };

  const screenWidth = Dimensions.get("window").width;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
            <View style={styles.headerAvatar}>
                <Text style={styles.headerAvatarText}>{userName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{flex: 1, marginLeft: 12}}>
                <Text style={styles.headerGreeting}>Hola, {userName.split(' ')[0]}</Text>
                <Text style={styles.headerStatus}>Nexe Member</Text>
            </View>
            <TouchableOpacity style={styles.iconButton}>
                 <Ionicons name="notifications-outline" size={24} color="#000" />
            </TouchableOpacity>
        </View>

        {/* Neobank Card */}
        <View style={styles.cardWrapper}>
            <LinearGradient
                colors={['#1a1a1a', '#000000']} // Black metal look
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
            >
                <View style={styles.cardTop}>
                    <Text style={styles.cardBrand}>NEXE METAL</Text>
                    <Ionicons name="wifi" size={24} color="rgba(255,255,255,0.6)" style={{ transform: [{ rotate: '90deg' }] }} />
                </View>

                <View style={styles.cardChipContainer}>
                    <View style={styles.cardChip} />
                    {/* Simulated Chip */}
                </View>

                <View style={styles.cardCenter}>
                     <Text style={styles.cardBalanceLabel}>Saldo disponible</Text>
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" style={{alignSelf: 'flex-start', marginTop: 5}} />
                    ) : (
                        <Text style={styles.cardBalance}>{points.toLocaleString()} pts</Text>
                    )}
                </View>

                <View style={styles.cardBottom}>
                    <Text style={styles.cardHolderName}>{userName.toUpperCase()}</Text>
                    <View style={styles.cardLogo}>
                         <View style={[styles.cardLogoCircle, { backgroundColor: 'rgba(255,255,255,0.8)' }]} />
                         <View style={[styles.cardLogoCircle, { backgroundColor: 'rgba(255,255,255,0.5)', marginLeft: -10 }]} />
                    </View>
                </View>
            </LinearGradient>

            {/* Card Shadow/Reflection effect */}
            <View style={styles.cardReflection} />
        </View>

        {/* Action Buttons - Round like Revolut */}
        <View style={styles.actionRow}>
            <ActionButton icon="add" label="Añadir" color="#E3F2FD" iconColor="#2196F3" />
            <ActionButton icon="arrow-forward" label="Enviar" color="#E8F5E9" iconColor="#4CAF50" />
            <ActionButton icon="swap-horizontal" label="Canjear" color="#FFF3E0" iconColor="#FF9800" />
            <ActionButton icon="ellipsis-horizontal" label="Más" color="#F3E5F5" iconColor="#9C27B0" />
        </View>

        {/* Analytics / Chart */}
        <View style={styles.section}>
             <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Analíticas</Text>
                <TouchableOpacity>
                    <Text style={styles.seeAllText}>Ver todo</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.chartContainer}>
                {!loading && (
                    <LineChart
                        data={chartData}
                        width={screenWidth - 40}
                        height={160} // compact
                        chartConfig={chartConfig}
                        bezier
                        withDots={false}
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

        {/* Transactions List */}
        <View style={[styles.section, { marginBottom: 100 }]}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Transacciones</Text>
                <TouchableOpacity>
                    <Text style={styles.seeAllText}>Ver todo</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.transactionList}>
                {TRANSACTIONS.map((item, index) => (
                    <View key={item.id} style={[styles.transactionItem, index === TRANSACTIONS.length - 1 && { borderBottomWidth: 0 }]}>
                        <View style={styles.transactionIconBox}>
                             <Ionicons name={item.icon as any || "card-outline"} size={20} color="#333" />
                        </View>
                        <View style={styles.transactionDetails}>
                            <Text style={styles.transactionTitle}>{item.title}</Text>
                            <Text style={styles.transactionDate}>{item.date}</Text>
                        </View>
                        <Text style={[
                            styles.transactionAmount,
                            { color: item.type === 'earn' ? '#4CAF50' : '#000' }
                        ]}>
                            {item.amount}
                        </Text>
                    </View>
                ))}
            </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton({ icon, label, color, iconColor }: { icon: any, label: string, color: string, iconColor: string }) {
  return (
    <TouchableOpacity style={styles.actionButton}>
      <View style={[styles.actionCircle, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#f0f0f0',
      justifyContent: 'center',
      alignItems: 'center',
  },
  headerAvatarText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
  },
  headerGreeting: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#000',
  },
  headerStatus: {
      fontSize: 12,
      color: '#666',
  },
  iconButton: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },

  // Card
  cardWrapper: {
      paddingHorizontal: 20,
      marginBottom: 30,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
  },
  card: {
      height: 220,
      borderRadius: 20,
      padding: 24,
      position: 'relative',
      justifyContent: 'space-between',
  },
  cardReflection: {
      position: 'absolute',
      top: 20,
      left: 20,
      right: 20,
      height: 100,
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 20,
      transform: [{ skewY: '-10deg' }],
  },
  cardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  cardBrand: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 2,
  },
  cardChipContainer: {
      marginTop: 20,
  },
  cardChip: {
      width: 40,
      height: 30,
      borderRadius: 6,
      backgroundColor: '#d4af37', // Gold chip color
      borderWidth: 1,
      borderColor: '#b8860b',
  },
  cardCenter: {
      marginTop: 10,
  },
  cardBalanceLabel: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 4,
  },
  cardBalance: {
      color: '#fff',
      fontSize: 32,
      fontWeight: 'bold',
      letterSpacing: 1,
  },
  cardBottom: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
  },
  cardHolderName: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: 1,
  },
  cardLogo: {
      flexDirection: 'row',
  },
  cardLogoCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
  },

  // Actions
  actionRow: {
      flexDirection: 'row',
      justifyContent: 'space-around', // Changed to space-around for even distribution
      paddingHorizontal: 10,
      marginBottom: 30,
  },
  actionButton: {
      alignItems: 'center',
      width: 70, // Fixed width
  },
  actionCircle: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
  },
  actionLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: '#333',
  },

  // Section
  section: {
      paddingHorizontal: 20,
      marginBottom: 24,
  },
  sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
  },
  sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#000',
  },
  seeAllText: {
      fontSize: 14,
      color: '#2196F3',
      fontWeight: '600',
  },

  // Chart
  chartContainer: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 10,
      borderWidth: 1,
      borderColor: '#f0f0f0',
  },
  chart: {
      paddingRight: 0,
  },

  // Transactions
  transactionList: {
      backgroundColor: '#fff',
  },
  transactionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: '#f5f5f5',
  },
  transactionIconBox: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#f5f5f5',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
  },
  transactionDetails: {
      flex: 1,
  },
  transactionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#000',
      marginBottom: 2,
  },
  transactionDate: {
      fontSize: 12,
      color: '#888',
  },
  transactionAmount: {
      fontSize: 16,
      fontWeight: '600',
  },
});
