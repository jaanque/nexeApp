import { View, StyleSheet, Text, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { RealtimeChannel } from '@supabase/supabase-js';

export default function WalletScreen() {
  const [points, setPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState("ALL");

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

  // Generate chart data based on current points to mimic history
  // Since we only have one value (current points), we simulate a growth curve
  // We use a safe value for the chart if points are 0 to avoid rendering issues with empty data
  // const chartPoints = points > 0 ? points : 100; // Visual fallback if 0, or just flat 0

  const dataPoints = points > 0
    ? [points * 0.2, points * 0.2, points * 0.5, points * 0.5, points * 0.8, points]
    : [0, 0, 0, 0, 0, 0];

  const chartData = {
    labels: ["", "", "", "", "", ""], // Hide labels on X axis for cleaner look similar to image
    datasets: [
      {
        data: dataPoints,
        color: (opacity = 1) => `rgba(139, 195, 74, ${opacity})`, // Light green
        strokeWidth: 3
      }
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(139, 195, 74, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "0",
      strokeWidth: "0",
    },
    fillShadowGradientFrom: "#dcedc8",
    fillShadowGradientTo: "#ffffff",
    fillShadowGradientOpacity: 0.5,
  };

  const screenWidth = Dimensions.get("window").width;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cartera</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.balanceSection}>
            {loading ? (
                <ActivityIndicator size="large" color="#8bc34a" />
            ) : (
                <>
                    <Text style={styles.balanceAmount}>{points.toLocaleString()}</Text>
                    <View style={styles.balanceLabelContainer}>
                        <Text style={styles.balanceLabel}>Puntos totales</Text>
                        <Ionicons name="eye-off-outline" size={16} color="#ccc" style={styles.eyeIcon} />
                    </View>
                </>
            )}
        </View>

        <View style={styles.chartWrapper}>
            {!loading && (
                <LineChart
                    data={chartData}
                    width={screenWidth}
                    height={220}
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

        <View style={styles.periodSelector}>
            {["1M", "3M", "6M", "1Y", "ALL"].map((period) => (
                <TouchableOpacity
                    key={period}
                    style={[styles.periodButton, activePeriod === period && styles.activePeriodButton]}
                    onPress={() => setActivePeriod(period)}
                >
                    <Text style={[styles.periodText, activePeriod === period && styles.activePeriodText]}>
                        {period}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  balanceSection: {
    paddingHorizontal: 20,
    marginBottom: 40, // Space between balance and chart
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  balanceLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  eyeIcon: {
      opacity: 0.5,
  },
  chartWrapper: {
    alignItems: 'center',
    marginBottom: 30,
  },
  chart: {
    paddingRight: 0,
    paddingLeft: 0,
  },
  periodSelector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
  },
  periodButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
  },
  activePeriodButton: {
      backgroundColor: '#333',
  },
  periodText: {
      color: '#999',
      fontWeight: '600',
      fontSize: 14,
  },
  activePeriodText: {
      color: '#fff',
  }
});
