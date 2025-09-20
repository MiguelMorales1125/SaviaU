import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!user || !password) {
      setError("Usuario y contraseña requeridos");
      return;
    }
    setError("");
    login(user, password);
    router.replace("/(tabs)/home");
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
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
          <TextInput
            style={styles.input}
            placeholder="Usuario"
            placeholderTextColor="#aaa"
            value={user}
            onChangeText={setUser}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="off"
            autoCorrect={false}
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
          />
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Ingresar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#28a745" }]}
            onPress={() => router.replace("/register")}
          >
            <Text style={styles.buttonText}>Registrarse</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.forgot}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: 235,
    height: 235,
    marginBottom: 10,
    alignSelf: "center",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#198754",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#f6fafd",
  },
  button: {
    width: "100%",
    backgroundColor: "#198754",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  secondaryButton: {
    width: "100%",
    backgroundColor: "#43b36a",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  secondaryButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  forgotText: {
    marginTop: 16,
    color: "#198754",
    textAlign: "center",
    textDecorationLine: "underline",
  },
  errorText: {
    color: "#d32f2f",
    marginBottom: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
});
