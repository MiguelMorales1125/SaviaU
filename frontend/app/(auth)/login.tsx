import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { loginStyles as styles } from "./login.styles";

export default function Login() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email y contraseña requeridos");
      return;
    }

    setError("");

    try {
      const result = await login(email, password);

      if (result.success) {
        console.log("Login exitoso, redirigiendo a tabs");
        router.replace("/(tabs)/home");
      } else {
        setError(result.error || "Error de autenticación");
      }
    } catch (error) {
      console.error("Error en handleLogin:", error);
      setError("Error inesperado. Intenta de nuevo.");
    }
    
  };

  return (
    <ImageBackground
      source={require("../../assets/images/Fondo.png")}
      style={styles.background}
      resizeMode="cover"
      blurRadius={2}
    >
      <View style={styles.centeredContainer}>
        <View style={styles.formContainer}>
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <Image
              source={require("../../assets/images/Logo-SaviaU.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

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
        </View>
      </View>
    </ImageBackground>
  );
}
