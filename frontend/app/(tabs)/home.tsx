import { View, Text, StyleSheet, Image } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/SaviaU-Logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>¡Bienvenido a SaviaU!</Text>
      <Text style={styles.subtitle}>
        Tu plataforma para retos, noticias y temáticas educativas.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#e8fce8',
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#198754',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
});
