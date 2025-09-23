import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ImageBackground,
  ActivityIndicator,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { loginStyles as styles } from "./login.styles";

export default function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showSuccessLoading, setShowSuccessLoading] = useState(false);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Animaciones del formulario al cargar la pantalla
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email y contraseña requeridos");
      return;
    }

    setError("");

    try {
      const result = await login(email, password);

      if (result.success) {
        console.log("Login exitoso, mostrando pantalla de carga");
        // Mostrar pantalla de carga por 2 segundos antes de ir a tabs
        setShowSuccessLoading(true);
        
        // Resetear animaciones para la pantalla de carga
        fadeAnim.setValue(0);
        logoScale.setValue(0.8);
        
        // Animar la pantalla de carga
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
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
        
        // Ir a tabs después de 2 segundos
        setTimeout(() => {
          router.replace("/(tabs)/home");
        }, 2000);
      } else {
        setError(result.error || "Error de autenticación");
      }
    } catch (error) {
      console.error("Error en handleLogin:", error);
      setError("Error inesperado. Intenta de nuevo.");
    }
    
  };

  // Mostrar pantalla de carga solo después de login exitoso
  if (showSuccessLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={[styles.loadingContent, { opacity: fadeAnim }]}>
          <Animated.Image
            source={require("../../assets/images/Logo-SaviaU.png")}
            style={[styles.loadingLogo, { transform: [{ scale: logoScale }] }]}
            resizeMode="contain"
          />
          <ActivityIndicator size="large" color="#198754" style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Cargando SaviaU...</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../../assets/images/Fondo.png")}
      style={styles.background}
      resizeMode="cover"
      blurRadius={2}
    >
      <View style={styles.centeredContainer}>
        <Animated.View 
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Animated.View 
            style={[
              { alignItems: "center", marginBottom: 32 },
              { transform: [{ scale: logoScale }] }
            ]}
          >
            <Image
              source={require("../../assets/images/Logo-SaviaU.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            autoCorrect={false}
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="off"
            autoCorrect={false}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Ingresar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#28a745" }]}
            onPress={() => router.replace("/(auth)/register")}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Registrarse</Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ImageBackground>
  );
}
