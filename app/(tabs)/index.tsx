import { View, StyleSheet, Button, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function HomeScreen() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  const username = session?.user?.user_metadata?.username || session?.user?.email;

  return (
    <View style={styles.container}>
      <View style={styles.notificationIcon}>
          <IconSymbol size={28} name="bell.fill" color="#000" />
      </View>

      {session && session.user ? (
        <>
          <View style={styles.header}>
            <Text style={styles.welcomeText}>Bienvenido, {username}</Text>
          </View>
          <View style={styles.content}>
            {/* Logged in content */}
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
  },
  notificationIcon: {
    position: 'absolute',
    top: 50,
    right: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
