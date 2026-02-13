import { View, StyleSheet, Button, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Ionicons } from '@expo/vector-icons';

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

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#111" style={styles.searchIcon} />
            <TextInput
              placeholder="Buscar en NexeApp"
              placeholderTextColor="#666"
              style={styles.searchInput}
            />
          </View>

          {/* Filter Bar */}
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
                <FilterItem label="Per emportar" icon="bag-handle-outline" />
                <FilterItem label="Ofertes flash" icon="flash-outline" />
                <FilterItem label="Bescanviar" icon="swap-horizontal-outline" />
                <FilterItem label="Regalar punts" icon="gift-outline" />
                <FilterItem label="Ruleta" icon="color-wand-outline" />
                <FilterItem label="Mapa" icon="map-outline" />
            </ScrollView>
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

function FilterItem({ label, icon }: { label: string, icon: any }) {
    return (
        <TouchableOpacity style={styles.filterItem}>
             <Ionicons name={icon} size={18} color="#111" />
            <Text style={styles.filterText}>{label}</Text>
        </TouchableOpacity>
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

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6f6f6',
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchIcon: {
      marginRight: 10,
  },
  searchInput: {
      flex: 1,
      fontSize: 16,
      color: '#111',
      fontWeight: '500',
  },

  // Filter Bar
  filterContainer: {
      height: 50,
      marginBottom: 20,
  },
  filterContent: {
      paddingRight: 20,
  },
  filterItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f6f6f6',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginRight: 10,
  },
  filterText: {
      fontWeight: '600',
      fontSize: 14,
      color: '#111',
      marginLeft: 8,
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
