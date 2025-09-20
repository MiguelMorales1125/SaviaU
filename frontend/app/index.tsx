import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter,Href } from 'expo-router';


export const options = {
  headerShown: false,
  title: 'SaviaU',
  headerBackVisible: false,
};

export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido a SaviaU</Text>
      <Button
        title="Continuar"
        color="#198754"
        onPress={() => router.push('/login')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    color: '#198754',
    fontWeight: 'bold',
  },
});
