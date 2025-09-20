import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [carrera, setCarrera] = useState('');
  const [semestre, setSemestre] = useState('');

  const handleRegister = () => {
    if (!email || !password || !nombre || !apellidos || !carrera || !semestre) {
      Alert.alert('Error', 'Por favor completa todos los campos.');
      return;
    }
   
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre"
        placeholderTextColor="#2a7c0cff" 
        value={nombre}
        onChangeText={setNombre}
        autoComplete="off"
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        placeholder="Apellidos"
        placeholderTextColor="#2a7c0cff" 
        value={apellidos}
        onChangeText={setApellidos}
      />
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor="#2a7c0cff" 
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Carrera"
        placeholderTextColor="#2a7c0cff" 
        value={carrera}
        onChangeText={setCarrera}
      />
      <TextInput
        style={styles.input}
        placeholder="Semestre"
        placeholderTextColor="#2a7c0cff"  
        value={semestre}
        onChangeText={setSemestre}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#2a7c0cff" 
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Registrarse" onPress={handleRegister} color="#198754" />
      <Text style={styles.loginText} onPress={() => router.replace('/login')}>
        ¿Ya tienes cuenta? Inicia sesión
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#198754',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#198754',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color:"#000",
    backgroundColor:"#fff",
  },
  loginText: {
    marginTop: 16,
    color: '#198754',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});