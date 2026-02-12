import { View, StyleSheet, Button, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

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

  return (
    <View style={styles.container}>
      {session && session.user ? (
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Bienvenido!</Text>
          <View style={styles.buttonContainer}>
            <Button title="Cerrar Sesión" onPress={() => signOut()} />
          </View>
        </View>
      ) : (
        <View style={styles.authContainer}>
          <View style={styles.buttonContainer}>
            <Button title="Iniciar Sesión" onPress={() => router.push('/login')} />
          </View>
          <View style={styles.buttonContainer}>
            <Button title="Registrar" onPress={() => router.push('/register')} />
          </View>
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
  },
  welcomeContainer: {
    alignItems: 'center',
    width: '100%',
  },
  authContainer: {
    width: '100%',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonContainer: {
    marginVertical: 10,
    width: '100%',
  },
});
