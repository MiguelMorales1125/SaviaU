import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Alert, ScrollView, TouchableOpacity, Image, ImageBackground, Animated, ActivityIndicator, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { registerStyles as styles } from './register.styles';

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [universidad, setUniversidad] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [carrera, setCarrera] = useState('');
  const [semestre, setSemestre] = useState('');
  const { register, loading } = useAuth();
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Options
  const carreras: string[] = [
    'Ingeniería de Sistemas',
    'Medicina',
    'Administración',
    'Ingeniería Industrial',
    'Derecho',
    'Comunicación Social',
    'Otra'
  ];

  const universidades: string[] = [
    'Unillanos',
    'Cooperativa',
    'Santo Tomás',
    'Unimeta',
    'Autónoma de Nariño',
    'Otra'
  ];

  // Small Select component with Picker fallback
  const Select = ({
    options,
    selected,
    onSelect,
    placeholder,
  }: {
    options: string[];
    selected: string;
    onSelect: (v: string) => void;
    placeholder?: string;
  }) => {
    // Try to load native Picker if available
    let PickerComp: any = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('@react-native-picker/picker');
      PickerComp = mod.Picker || mod;
    } catch (e) {
      PickerComp = null;
    }

    const [open, setOpen] = useState(false);

    if (PickerComp) {
      return (
        <View style={{ width: '100%', borderWidth: 1, borderColor: '#198754', borderRadius: 8, marginBottom: 12, overflow: 'hidden', backgroundColor: '#f8fffe' }}>
          <PickerComp selectedValue={selected} onValueChange={(v: any) => onSelect(String(v))} style={{ height: 48 }}>
            <PickerComp.Item label={placeholder || 'Seleccione...'} value={''} />
            {options.map((o) => (
              <PickerComp.Item key={o} label={o} value={o} />
            ))}
          </PickerComp>
        </View>
      );
    }

    // Fallback inline dropdown that appears right below the input
    return (
      <>
        <Pressable onPress={() => setOpen(!open)} style={[styles.input, { justifyContent: 'center' }]}> 
          <Text style={{ color: selected ? '#000' : '#999' }}>{selected || placeholder || 'Seleccione...'}</Text>
        </Pressable>
        {open ? (
          <View style={{ width: '100%', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e6e6e6', borderRadius: 8, maxHeight: 200, marginBottom: 12 }}>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable onPress={() => { onSelect(item); setOpen(false); }} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#f2f2f2' }}>
                  <Text>{item}</Text>
                </Pressable>
              )}
            />
          </View>
        ) : null}
      </>
    );
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
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

  // Validation helpers
  const isNameValid = (n: string) => {
    // Allow letters, spaces, hyphens and accents (basic latin accents and ñ)
    const re = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s'-]+$/;
    return re.test(n);
  };

  const isEmailValid = (mail: string) => {
    const re = /^\S+@\S+\.\S+$/;
    return re.test(mail);
  };

  // Password must contain at least one digit and one special character
  const passwordValidation = (pw: string) => {
    if (!pw) return { valid: false, msg: 'La contraseña es requerida' };
    const hasNumber = /\d/.test(pw);
    if (!hasNumber) return { valid: false, msg: 'La contraseña debe contener al menos un número' };
    return { valid: true, msg: '' };
  };

  const isFormValid = () => {
    if (!nombre || !apellidos || !email || !password || !carrera || !universidad || !semestre) return false;
    if (!isNameValid(nombre) || !isNameValid(apellidos)) return false;
    if (!isEmailValid(email)) return false;
    const pw = passwordValidation(password);
    if (!pw.valid) return false;
    return true;
  };

  const handleRegister = async () => {
    if (!email || !password || !nombre || !apellidos || !carrera || !universidad || !semestre) {
      Alert.alert('Error', 'Por favor completa todos los campos.');
      return;
    }

    const fullName = `${nombre} ${apellidos}`.trim();
    const semestreNum = Number(semestre) || 0;

    try {
      const result = await register(fullName, email, password, carrera, universidad, semestreNum);
      if (result.success) {
        // Navegar a pantalla principal
        router.replace('/(tabs)/home');
      } else {
        Alert.alert('Error', result.error || 'No se pudo registrar');
      }
    } catch (err) {
      console.error('Error en registro:', err);
      Alert.alert('Error', 'Error inesperado al registrar.');
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
                { alignItems: "center", marginBottom: 15 },
                { transform: [{ scale: logoScale }] }
              ]}
            >
              <Image
                source={require("../../assets/images/Logo-SaviaU.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>
            
            <Text style={styles.title}>Crear cuenta</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              placeholderTextColor="#aaa" 
              value={nombre}
              onChangeText={(val) => setNombre(val.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s'-]/g, ''))}
              autoComplete="off"
              autoCorrect={false}
            />
            {nombre && !isNameValid(nombre) ? (
              <Text style={styles.errorText}>El nombre sólo debe contener letras y espacios</Text>
            ) : null}
            <TextInput
              style={styles.input}
              placeholder="Apellidos"
              placeholderTextColor="#aaa" 
              value={apellidos}
              onChangeText={(val) => setApellidos(val.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s'-]/g, ''))}
              autoComplete="off"
              autoCorrect={false}
            />
            {apellidos && !isNameValid(apellidos) ? (
              <Text style={styles.errorText}>Los apellidos sólo deben contener letras y espacios</Text>
            ) : null}
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
            {!isEmailValid(email) && email ? (
              <Text style={styles.errorText}>Ingresa un correo electrónico válido</Text>
            ) : null}
            <Select options={carreras} selected={carrera} onSelect={setCarrera} placeholder="Seleccione carrera..." />

            <Select options={universidades} selected={universidad} onSelect={setUniversidad} placeholder="Seleccione universidad..." />

            <Select options={Array.from({ length: 10 }, (_, i) => String(i + 1))} selected={semestre} onSelect={setSemestre} placeholder="Seleccione semestre..." />
            {semestre && (Number(semestre) < 1 || Number(semestre) > 10) ? (
              <Text style={styles.errorText}>El semestre debe estar entre 1 y 10</Text>
            ) : null}
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#aaa" 
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password-new"
              autoCorrect={false}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
            {!passwordValidation(password).valid && password ? (
              <Text style={styles.errorText}>{passwordValidation(password).msg}</Text>
            ) : null}
            {passwordFocused || !password ? (
              <Text style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>La contraseña debe contener al menos un número.</Text>
            ) : null}
            
            <TouchableOpacity style={[styles.registerButton, { opacity: (!isFormValid() || loading) ? 0.6 : 1 }]} onPress={handleRegister} disabled={!isFormValid() || loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerButtonText}>Registrarse</Text>}
            </TouchableOpacity>
            
            <Text style={styles.loginText} onPress={() => router.replace('/login')}>
              ¿Ya tienes cuenta? Inicia sesión
            </Text>
          </Animated.View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}