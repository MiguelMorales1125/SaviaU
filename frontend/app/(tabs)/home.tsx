import { View, Text, Image } from 'react-native';
import { homeStyles as styles } from './home.styles';

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
