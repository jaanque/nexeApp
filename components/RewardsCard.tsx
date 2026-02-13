import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

interface MenuItem {
  id: number;
  name: string;
  price: number;
}

interface RewardsCardProps {
  currentPoints: number;
}

export function RewardsCard({ currentPoints }: RewardsCardProps) {
  const router = useRouter();
  const [nextReward, setNextReward] = useState<MenuItem | null>(null);

  useEffect(() => {
    async function fetchNextReward() {
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('id, name, price')
          .gt('price', currentPoints)
          .order('price', { ascending: true })
          .limit(1)
          .single();

        if (error) {
           // If no rows found, it might mean user has enough points for everything or table is empty
           setNextReward(null);
        } else {
          setNextReward(data);
        }
      } catch (e) {
        console.error('Error fetching next reward:', e);
      }
    }

    fetchNextReward();
  }, [currentPoints]);

  const progress = nextReward ? Math.min(currentPoints / nextReward.price, 1) : 1;
  const remainingPoints = nextReward ? Math.ceil(nextReward.price - currentPoints) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>NexeRewards</Text>
          <Text style={styles.points}>{currentPoints} pts</Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.milestones}>
            <Text style={styles.milestoneText}>0</Text>
            <Text style={styles.milestoneText}>{nextReward ? nextReward.price : 'MAX'}</Text>
          </View>
        </View>

        <Text style={styles.description}>
          {nextReward
            ? `Sólo faltan ${remainingPoints} puntos para desbloquear ${nextReward.name}`
            : '¡Tienes puntos suficientes para canjear cualquier recompensa!'}
        </Text>

        <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/(tabs)/wallet')}
        >
          <Text style={styles.buttonText}>Ver Premios</Text>
        </TouchableOpacity>

        <Pressable
            style={styles.walletLink}
            onPress={() => router.push('/(tabs)/wallet')}
        >
            <View style={styles.walletContent}>
                <Ionicons name="wallet-outline" size={20} color="#666" style={{ marginRight: 8 }} />
                <Text style={styles.walletText}>Mi Cartera</Text>
            </View>
            <View style={styles.walletRight}>
                <Text style={styles.walletValue}></Text>
                <Ionicons name="chevron-forward" size={16} color="#999" />
            </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800', // Extra bold like the image
    color: '#007aff', // Assuming a brand color, maybe green/red from 7-11
  },
  points: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4ade80', // Green progress bar
    borderRadius: 4,
  },
  milestones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  milestoneText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#444',
    marginBottom: 16,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#111',
    borderRadius: 25,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  walletLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: '#f0f0f0',
  },
  walletContent: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  walletText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#444',
  },
  walletRight: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  walletValue: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#111',
      marginRight: 4,
  },
});
