import { View, StyleSheet, Text, Button, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function ProfileScreen() {
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
      {session && session.user ? (
        <View style={styles.content}>
          <Text style={styles.title}>Perfil</Text>
          <Text style={styles.userInfo}>Usuario: {username}</Text>
          <Text style={styles.userInfo}>Email: {session.user.email}</Text>
          <View style={styles.logoutButtonContainer}>
            <Button title="Cerrar Sesión" onPress={signOut} color="#FF3B30" />
          </View>
        </View>
      ) : (
        <View style={styles.authContainer}>
          <Text style={styles.title}>Perfil</Text>
          <Text style={styles.subtitle}>Inicia sesión para ver tu perfil</Text>

          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/login')}>
            <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/register')}>
            <Text style={styles.secondaryButtonText}>Registrar</Text>
          </TouchableOpacity>
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
    backgroundColor: '#fff',
    padding: 20,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  authContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  userInfo: {
    fontSize: 18,
    marginBottom: 10,
    color: '#333',
  },
  logoutButtonContainer: {
    marginTop: 30,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#000',
    width: '100%',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    width: '100%',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
  },
  secondaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
