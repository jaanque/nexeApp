import { View, Text, StyleSheet, Pressable } from 'react-native';
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
          {nextReward && (
            <Text style={styles.milestoneText}>
              {currentPoints} / {nextReward.price}
            </Text>
          )}
        </View>

        <Text style={styles.description}>
          {nextReward
            ? `Te faltan ${remainingPoints} pts para ${nextReward.name}`
            : '¡Todo desbloqueado!'}
        </Text>

        <Pressable
            style={styles.walletLink}
            onPress={() => router.push('/wallet')}
        >
            <Text style={styles.walletText}>Ver premios</Text>
            <Ionicons name="chevron-forward" size={16} color="#06C167" />
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
    borderRadius: 12,
    padding: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  points: {
    fontSize: 16,
    fontWeight: '700',
    color: '#06C167', // Uber Eats green style
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#06C167',
    borderRadius: 3,
  },
  milestoneText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  walletLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
  },
  walletText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#06C167',
      marginRight: 2,
  },
});
