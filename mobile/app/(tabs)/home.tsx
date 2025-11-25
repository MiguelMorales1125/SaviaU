import { View, Text, Image } from 'react-native';
import Head from 'expo-router/head';
import { tabsStyles } from '../../styles/tabs.styles';

export default function HomeScreen() {
  return (
    <View style={tabsStyles.homeContainer}>
      <Head>
        <title>Inicio • SaviaU</title>
        <meta name="description" content="Tu plataforma para retos, noticias y temáticas educativas." />
      </Head>
      <Image
        source={require('../../assets/images/Logo-SaviaU.png')}
        style={tabsStyles.homeLogo}
        resizeMode="contain"
      />
      <Text style={tabsStyles.homeTitle}>¡Bienvenido a SaviaU!</Text>
      {/* El texto descriptivo se movió al meta description en <Head> para SEO */}
    </View>
  );
}
