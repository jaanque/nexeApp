import { View, StyleSheet, Button, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function HomeScreen() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [points, setPoints] = useState<number>(0);

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
      }
    });
  }, []);

  async function fetchPoints(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching points:', error);
      } else if (data) {
        setPoints(data.points || 0);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  }

  const username = session?.user?.user_metadata?.username || session?.user?.email?.split('@')[0] || "Usuario";

  return (
    <View style={styles.container}>
      {session && session.user ? (
        <>
          <View style={styles.topBar}>
            <View>
                <Text style={styles.greetingText}>Hola, {username}</Text>
            </View>
            <View style={styles.pointsPill}>
                 <Text style={styles.pointsText}>{points} pts</Text>
                 <IconSymbol size={16} name="star.fill" color="#FFD700" />
            </View>
          </View>

          <View style={styles.content}>
            <Text style={styles.subtitle}>Explora los mejores restaurantes</Text>
          </View>
        </>
      ) : (
        <View style={styles.content}>
            <Text style={styles.welcomeText}>Welcome to NexeApp</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60, // Safe area padding replacement
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  pointsPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f8f9fa',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#eee',
  },
  pointsText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#333',
      marginRight: 6,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
