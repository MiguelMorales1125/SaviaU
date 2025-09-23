import React, { useState } from 'react';
import { View, Text, TextInput, Alert, ScrollView, TouchableOpacity, Image, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { registerStyles as styles } from './register.styles';

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
    <ImageBackground
      source={require("../../assets/images/Fondo.png")}
      style={styles.background}
      resizeMode="cover"
      blurRadius={2}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.centeredContainer}>
          <View style={styles.formContainer}>
            <View style={{ alignItems: "center", marginBottom: 15 }}>
              <Image
                source={require("../../assets/images/Logo-SaviaU.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            
            <Text style={styles.title}>Crear cuenta</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              placeholderTextColor="#aaa" 
              value={nombre}
              onChangeText={setNombre}
              autoComplete="off"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              placeholder="Apellidos"
              placeholderTextColor="#aaa" 
              value={apellidos}
              onChangeText={setApellidos}
              autoComplete="off"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor="#aaa" 
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              placeholder="Carrera"
              placeholderTextColor="#aaa" 
              value={carrera}
              onChangeText={setCarrera}
              autoComplete="off"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              placeholder="Semestre"
              placeholderTextColor="#aaa"  
              value={semestre}
              onChangeText={setSemestre}
              keyboardType="numeric"
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
              autoComplete="password-new"
              autoCorrect={false}
            />
            
            <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
              <Text style={styles.registerButtonText}>Registrarse</Text>
            </TouchableOpacity>
            
            <Text style={styles.loginText} onPress={() => router.replace('/login')}>
              ¿Ya tienes cuenta? Inicia sesión
            </Text>
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}