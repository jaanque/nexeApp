import { View, StyleSheet, FlatList, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { StatusBar } from 'expo-status-bar';
import { ModernHeader } from '@/components/ui/ModernHeader';
import CardDeckItem from '@/components/CardDeckItem'; // Import new component
import { HomeScreenSkeleton } from '@/components/HomeScreenSkeleton';

const { height } = Dimensions.get('window');

interface MenuItemResult {
    id: number;
    name: string;
    description: string;
    price: number;
    image_url: string;
    restaurant_id: number;
    restaurants?: {
        name: string;
    };
    category_id?: number;
}

export default function HomeScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [feedItems, setFeedItems] = useState<MenuItemResult[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  // Load initial session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchPoints(session.user.id);
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchPoints(session.user.id);
      } else {
          setPoints(0);
      }
    });

    fetchFeedItems();
  }, []);

  async function fetchPoints(userId: string) {
    try {
      const { data } = await supabase.from('profiles').select('points').eq('id', userId).single();
      if (data) setPoints(data.points || 0);
    } catch (error) {
      console.error('Error fetching points:', error);
    }
  }

  async function fetchFeedItems() {
      setLoading(true);
      try {
          // Fetch menu items with restaurant info.
          // We can limit to random items or "Moments".
          // For now, fetching first 50 items.
          const { data, error } = await supabase
            .from('menu_items')
            .select('*, restaurants(name)')
            .limit(50);

          if (!error && data) {
              setFeedItems(data as any);
          }
      } catch (e) {
          console.error("Error fetching feed:", e);
      } finally {
          setLoading(false);
      }
  }

  const getInitials = () => {
      if (!session?.user) return '?';
      const name = session.user.user_metadata?.full_name || session.user.user_metadata?.username || 'U';
      return name.charAt(0).toUpperCase();
  };

  if (loading) return <HomeScreenSkeleton />;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ModernHeader
        points={points}
        initials={getInitials()}
        isGuest={!session?.user}
        onWalletPress={() => router.push('/(tabs)/wallet')}
        onProfilePress={() => router.push('/(tabs)/profile')}
      />

      <FlatList
        data={feedItems}
        renderItem={({ item }) => (
            <CardDeckItem item={item} userPoints={points} />
        )}
        keyExtractor={(item) => item.id.toString()}
        pagingEnabled
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        snapToInterval={height} // Full screen snap
        contentContainerStyle={{ paddingBottom: 0 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8', // Match card background
  },
});
