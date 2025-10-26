import React, { useEffect, useRef, useState } from 'react';
import { useWindowDimensions, Platform } from 'react-native';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  ScrollView,
} from 'react-native';
// safe-area-context removed: using fixed header offsets instead
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { indexStyles as styles } from '../styles/index.styles';

export default function Index() {
  const { user, initialLoading } = useAuth();
  
  
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  
 
  

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  

  useEffect(() => {
   
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

  
    const animateCards = () => {
      cardAnimations.forEach((animation, index) => {
        Animated.timing(animation, {
          toValue: 1,
          duration: 600,
          delay: index * 200,
          useNativeDriver: true,
        }).start();
      });
    };
    setTimeout(animateCards, 1000);

    
    if (!initialLoading && user) {
      const timer = setTimeout(() => {
        router.replace('/(tabs)/home');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [user, initialLoading]);

  // Services data
  const services = [
    {
      title: 'Contenido Académico',
      description: 'Accede a material educativo actualizado y recursos especializados.',
      icon: '📚',
      color: '#198754',
    },
    {
      title: 'Retos Educativos',
      description: 'Participa en desafíos interactivos que potencian tu aprendizaje.',
      icon: '🎯',
      color: '#17a2b8',
    },
    {
      title: 'Progreso Personal',
      description: 'Mantén un seguimiento detallado de tus logros académicos.',
      icon: '📊',
      color: '#fd7e14',
    },
    {
      title: 'Comunidad Estudiantil',
      description: 'Conecta con otros estudiantes y comparte conocimientos.',
      icon: '👥',
      color: '#6f42c1',
    },
  ];

  const cardAnimations = useRef(services.map(() => new Animated.Value(0))).current;

  // Responsive columns based on window width
  const { width } = useWindowDimensions();
  const getColumns = (w: number) => {
    if (w < 480) return 1; // very narrow phones
    if (w < 900) return 2; // phones / small tablets
    if (w < 1400) return 3; // large tablets / small desktop
    return 4; // desktop
  };
  const columns = getColumns(width);

  // removed SafeAreaInsets usage per request


 // al principio del componente (antes de usar logoWidth/logoHeight)
const MOBILE_LOGO = { width: 200, height: 150 };   // cambiar aquí para móvil
const TABLET_LOGO = { width: 240, height: 110 };  // cambiar si quieres
const DESKTOP_LOGO = { width: 220, height: 220 };  // cambiar aquí para web/desktop

const isSmallScreen = width < 640;
let logoWidth = isSmallScreen ? MOBILE_LOGO.width : DESKTOP_LOGO.width;
let logoHeight = isSmallScreen ? MOBILE_LOGO.height : DESKTOP_LOGO.height;
  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={[styles.loadingContent, { opacity: fadeAnim }]}>
          <Animated.Image
            source={require('../assets/images/Logo-SaviaU.png')}
            style={[styles.loadingLogo, { transform: [{ scale: logoScale }] }]}
            resizeMode="contain"
          />
          <ActivityIndicator size="large" color="#4F46E5" style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Cargando SaviaU...</Text>
        </Animated.View>
      </View>
    );
  }

  
  if (user) {
    return (
      <View style={styles.welcomeContainer}>
        <Animated.View style={[styles.welcomeContent, { opacity: fadeAnim }]}>
          <Animated.Image
            source={require('../assets/images/Logo-SaviaU.png')}
            style={[styles.welcomeLogo, { transform: [{ scale: logoScale }] }]}
            resizeMode="contain"
          />
          <Text style={styles.welcomeTitle}>¡Bienvenido de nuevo!</Text>
          <Text style={styles.welcomeSubtitle}>Preparando tu experiencia de aprendizaje...</Text>
          <ActivityIndicator size="large" color="#4F46E5" style={styles.welcomeSpinner} />
        </Animated.View>
      </View>
    );
  }

  
  return (
    <View style={{ flex: 1, backgroundColor: styles.container.backgroundColor }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      
      <Animated.View
        style={[
          styles.header,
          {
            // simple fixed spacing to avoid status overlap
            paddingTop: 36,
            height: 132,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.navContainer}>
          <View style={[styles.logoSection, { marginTop: 8 }]}>
            <Image
              source={require('../assets/images/SaviaU-Logo.png')}
              style={[styles.navLogo, { width: logoWidth, height: logoHeight }]}
              resizeMode="contain"
            />
          </View>
          <View style={styles.navButtons}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.navButtonText}>Iniciar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Hero Section */}
      <Animated.View 
        style={[
          styles.heroSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>
              Plataforma de{'\n'}
              <Text style={styles.heroTitleAccent}>Aprendizaje Universitario</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              Accede a contenido académico, completa retos educativos y conecta 
              con la comunidad universitaria en una experiencia de aprendizaje integral.
            </Text>
            <TouchableOpacity
              style={styles.heroCTA}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={styles.heroCTAText}>Comenzar Ahora</Text>
            </TouchableOpacity>
          </View>
          {/* Imagen del hero removida para versión móvil/texto limpio */}
        </View>
      </Animated.View>

      <View style={styles.servicesSection}>
        <Text style={styles.sectionTitle}>Nuestros Servicios</Text>
        <View style={styles.servicesGrid}>
          {(() => {
            const rows: Array<typeof services> = [] as any;
            for (let i = 0; i < services.length; i += columns) {
              rows.push(services.slice(i, i + columns));
            }
            return rows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.servicesRow}>
                  {row.map((service, colIndex) => {
                    const index = rowIndex * columns + colIndex;
                    const itemWidth = `${100 / columns - 3}%`;
                    return (
                      <Animated.View
                        key={index}
                        style={[
                          styles.serviceCard,
                          { width: itemWidth as any },
                          hoveredCard === index && styles.serviceCardHover,
                          {
                            opacity: cardAnimations[index],
                            transform: [
                              {
                                translateY: cardAnimations[index].interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [30, 0],
                                }),
                              },
                            ],
                          },
                        ]}
                        onTouchStart={() => setHoveredCard(index)}
                        onTouchEnd={() => setHoveredCard(null)}
                      >
                        <View style={[styles.serviceIcon, { backgroundColor: service.color + '20' }]}>
                          <Text style={styles.serviceIconText}>{service.icon}</Text>
                        </View>
                        <View style={styles.serviceContent}>
                          <Text style={styles.serviceTitle}>{service.title}</Text>
                          <Text style={[
                            styles.serviceDescription,
                            hoveredCard === index && styles.serviceDescriptionVisible
                          ]}>
                            {service.description}
                          </Text>
                          <TouchableOpacity 
                            style={[
                              styles.serviceButton, 
                              { backgroundColor: service.color },
                              hoveredCard === index && styles.serviceButtonVisible
                            ]}
                            onPress={() => router.push('/(auth)/register')}
                          >
                            <Text style={styles.serviceButtonText}>Explorar</Text>
                          </TouchableOpacity>
                        </View>
                      </Animated.View>
                    );
                  })}
                  {Array.from({ length: Math.max(0, columns - row.length) }).map((_, i) => (
                    <View key={`spacer-${i}`} style={{ width: `${100 / columns - 3}%`, marginBottom: 16 }} />
                  ))}
                </View>
            ));
          })()}
        </View>
      </View>

  
      <Animated.View 
        style={[
          styles.ctaSection,
          { opacity: fadeAnim }
        ]}
      >
        <Text style={styles.ctaTitle}>¿Listo para transformar tu experiencia universitaria?</Text>
        <Text style={styles.ctaDescription}>
          Únete a miles de estudiantes que ya están aprovechando SaviaU para potenciar su aprendizaje.
        </Text>
        <View style={styles.ctaButtons}>
          <TouchableOpacity
            style={styles.ctaPrimaryButton}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.ctaPrimaryButtonText}>Crear Cuenta Gratis</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ctaSecondaryButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.ctaSecondaryButtonText}>Ya tengo cuenta</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      
      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <View style={styles.footerContent}>
          <Image
            source={require('../assets/images/Logo-SaviaU.png')}
            style={styles.footerLogo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.footerDescription}>
          Plataforma educativa diseñada para potenciar el aprendizaje universitario a través de la tecnología.
          
        </Text><Text style={styles.footerDescription}>
          
          @2025 SaviaU
        </Text>
      </Animated.View>
      </ScrollView>
    </View>
  );
}
