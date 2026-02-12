import { View, StyleSheet, Text } from 'react-native';

export default function ScanScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Escanear</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
