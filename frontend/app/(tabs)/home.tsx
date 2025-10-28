import { View, Text, Image } from 'react-native';
import { tabsStyles } from '../../styles/tabs.styles';

export default function HomeScreen() {
  return (
    <View style={tabsStyles.homeContainer}>
      <Image
        source={require('../../assets/images/Logo-SaviaU.png')}
        style={tabsStyles.homeLogo}
        resizeMode="contain"
      />
      <Text style={tabsStyles.homeTitle}>¡Bienvenido a SaviaU!</Text>
      <Text style={tabsStyles.homeSubtitle}>
        Tu plataforma para retos, noticias y temáticas educativas.
      </Text>
    </View>
  );
}
