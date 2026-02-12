import { View, StyleSheet, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <Button title="Iniciar Sesión" onPress={() => router.push('/login')} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Registrar" onPress={() => router.push('/register')} />
      </View>
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
  buttonContainer: {
    marginVertical: 10,
    width: '100%',
  },
});
