import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Alert, ScrollView, TouchableOpacity, Image, ImageBackground, Animated, ActivityIndicator, Pressable, SafeAreaView, KeyboardAvoidingView, Platform, Modal, Dimensions, FlatList } from 'react-native';
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
  const [search, setSearch] = useState('');
  const slideAnim = useRef(new Animated.Value(300)).current; // for modal slide-up

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
    // Fallback: render options inside a Modal so they float above the ScrollView and avoid layout/scroll conflicts
    // We'll animate the modal content with slide-up and include a header with a close button.
    useEffect(() => {
      if (open) {
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }).start();
      } else {
        // reset position for next open
        slideAnim.setValue(300);
      }
    }, [open]);

    const closeModal = () => {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 220,
        useNativeDriver: true,
      }).start(() => setOpen(false));
    };

    const openModal = () => setOpen(true);

    return (
      <>
        <Pressable onPress={openModal} style={[styles.input, { justifyContent: 'center' }]}> 
          <Text style={{ color: selected ? '#000' : '#999' }}>{selected || placeholder || 'Seleccione...'}</Text>
        </Pressable>
        <Modal visible={open} transparent animationType="none" onRequestClose={closeModal}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 24 }} onPress={closeModal}>
            
            <Pressable onPress={(e) => e.stopPropagation()} style={{ alignSelf: 'center' }}>
              {(() => {
                const screenWidth = Dimensions.get('window').width;
                const screenHeight = Dimensions.get('window').height;
                
                const modalWidth = screenWidth >= 1024 ? 880 : screenWidth >= 700 ? 640 : Math.max(screenWidth - 32, 280);

                const modalHeight = Math.min(screenHeight * 0.75, 720);

                const listReserved = 110;
                const listHeight = Math.max(120, modalHeight - listReserved);
                return (
                  <Animated.View style={{ backgroundColor: '#fff', borderRadius: 12, height: modalHeight, overflow: 'hidden', width: modalWidth, transform: [{ translateY: slideAnim }] }}>
                    {/* Header */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                      <Text style={{ fontSize: 16, fontWeight: '600' }}>{placeholder || 'Seleccione'}</Text>
                      <TouchableOpacity onPress={closeModal} style={{ padding: 6 }} accessibilityLabel="Cerrar modal">
                        <Text style={{ fontSize: 20, color: '#198754' }}>✕</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Search input */}
                    <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' }}>
                      <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Buscar..."
                        placeholderTextColor="#999"
                        style={{ backgroundColor: '#f7f7f7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, fontSize: 15 }}
                        returnKeyType="search"
                      />
                    </View>

                    {/* Scrollable list inside the modal using FlatList for better performance on long lists */}
                    {(() => {
                      const filtered = options.filter(o => o.toLowerCase().includes(search.trim().toLowerCase()));
                      return (
                        <FlatList
                          data={filtered}
                          keyExtractor={(item) => item}
                          style={{ height: listHeight }}
                          contentContainerStyle={{ paddingBottom: 8 }}
                          keyboardShouldPersistTaps="handled"
                          nestedScrollEnabled
                          ListEmptyComponent={() => (
                            <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center' }}>
                              <Text style={{ color: '#666', fontSize: 16 }}>No existe</Text>
                            </View>
                          )}
                          renderItem={({ item }) => {
                            const isSelected = item === selected;
                            return (
                              <Pressable onPress={() => { onSelect(item); closeModal(); }} style={{ paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: isSelected ? '#e8f7ef' : '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Text style={{ fontSize: 16, color: isSelected ? '#0b6b3b' : '#111' }}>{item}</Text>
                                {isSelected ? <Text style={{ color: '#0b6b3b', fontSize: 16 }}>✓</Text> : null}
                              </Pressable>
                            );
                          }}
                        />
                      );
                    })()}
                  </Animated.View>
                );
              })()}
            </Pressable>
          </Pressable>
        </Modal>
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
      
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
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
            
            <TouchableOpacity activeOpacity={0.85} style={[styles.registerButton, { opacity: (!isFormValid() || loading) ? 0.85 : 1 }]} onPress={handleRegister} disabled={!isFormValid() || loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerButtonText}>Registrarse</Text>}
            </TouchableOpacity>
            
            <Text style={styles.loginText} onPress={() => router.replace('/login')}>
              ¿Ya tienes cuenta? Inicia sesión
            </Text>
          </Animated.View>
        </View>
          </ScrollView>
        </KeyboardAvoidingView>
      
    </ImageBackground>
  );
}