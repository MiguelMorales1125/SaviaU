/*
  onboard.tsx

  Propósito (ES): Pantalla de onboarding / completado de perfil.
  - Permite al usuario completar datos de perfil (nombre, carrera, universidad, semestre).
  - Valida los campos y llama a la función `onboard` proporcionada por `AuthContext`.
  - Tras completar el perfil redirige al flujo del diagnóstico.
  - Este archivo contiene UI y lógica de cliente únicamente.
*/
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ImageBackground, Pressable, Modal, Animated, Dimensions, ScrollView } from 'react-native';
import { onboardStyles as styles } from './onboard.styles';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function Onboard() {
  const router = useRouter();
  const { user, onboard } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [carrera, setCarrera] = useState(user?.carrera || '');
  const [universidad, setUniversidad] = useState(user?.universidad || '');
  const [semestre, setSemestre] = useState(user?.semestre ? String(user.semestre) : '');
  const [loading, setLoading] = useState(false);

  const universidades = [
    'Unillanos',
    'Cooperativa',
    'Santo Tomás',
    'Unimeta',
    'Autónoma de Nariño',
    'Otra'
  ];

  const carreras = [
    'Ingeniería de Sistemas',
    'Medicina',
    'Administración',
    'Ingeniería Industrial',
    'Derecho',
    'Licenciatura en educación física y deporte',
    'Otra'
  ];

  const Select = ({ options, selected, onSelect, placeholder }: { options: string[]; selected: string; onSelect: (v: string) => void; placeholder?: string }) => {
    // Try native picker first
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
    const slideAnim = useRef(new Animated.Value(300)).current;

    useEffect(() => {
      if (open) {
        Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }).start();
      } else {
        slideAnim.setValue(300);
      }
    }, [open]);

    const closeModal = () => setOpen(false);
    const openModal = () => setOpen(true);

    if (PickerComp) {
      return (
        <View style={{ width: '100%', borderWidth: 1, borderColor: '#e9ecef', borderRadius: 8, marginBottom: 12, overflow: 'hidden', backgroundColor: '#fff' }}>
          <PickerComp selectedValue={selected} onValueChange={(v: any) => onSelect(String(v))} style={{ height: 48 }}>
            <PickerComp.Item label={placeholder || 'Seleccione...'} value={''} />
            {options.map((o) => <PickerComp.Item key={o} label={o} value={o} />)}
          </PickerComp>
        </View>
      );
    }

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

                const filtered = options.filter(o => o.toLowerCase().includes(search.trim().toLowerCase()));

                return (
                  <Animated.View style={{ backgroundColor: '#fff', borderRadius: 12, height: modalHeight, overflow: 'hidden', width: modalWidth, transform: [{ translateY: slideAnim }], elevation: 12, zIndex: 9999 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                      <Text style={{ fontSize: 16, fontWeight: '600' }}>{placeholder || 'Seleccione'}</Text>
                      <TouchableOpacity onPress={closeModal} style={{ padding: 6 }} accessibilityLabel="Cerrar modal">
                        <Text style={{ fontSize: 20, color: '#198754' }}>✕</Text>
                      </TouchableOpacity>
                    </View>

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

                    <Animated.View style={{ height: listHeight }}>
                      {/* use FlatList for performance and to ensure proper scrolling */}
                      <React.Fragment>
                        {/* Using native FlatList would require import; use map inside a scrollable container */}
                        <View style={{ maxHeight: listHeight }}>
                          {filtered.length === 0 ? (
                            <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center' }}>
                              <Text style={{ color: '#666', fontSize: 16 }}>No existe</Text>
                            </View>
                          ) : (
                            <ScrollView nestedScrollEnabled>
                              {filtered.map(item => {
                                const isSelected = item === selected;
                                return (
                                  <Pressable key={item} onPress={() => { onSelect(item); closeModal(); }} style={{ paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: isSelected ? '#e8f7ef' : '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Text style={{ fontSize: 16, color: isSelected ? '#0b6b3b' : '#111' }}>{item}</Text>
                                    {isSelected ? <Text style={{ color: '#0b6b3b', fontSize: 16 }}>✓</Text> : null}
                                  </Pressable>
                                );
                              })}
                            </ScrollView>
                          )}
                        </View>
                      </React.Fragment>
                    </Animated.View>
                  </Animated.View>
                );
              })()}
            </Pressable>
          </Pressable>
        </Modal>
      </>
    );
  };

  useEffect(() => {
    setFullName(user?.fullName || '');
    setCarrera(user?.carrera || '');
    setUniversidad(user?.universidad || '');
    setSemestre(user?.semestre ? String(user.semestre) : '');
  }, [user]);

  // Validation helpers for onboard form
  const isNameValid = (n: string) => {
    // Allow letters, spaces, hyphens and accents (basic latin accents and ñ)
    const re = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s'-]+$/;
    return re.test(n.trim());
  };
  const semNum = Number(semestre) || 0;
  const isFormValid = () => {
    return isNameValid(fullName) && Boolean(carrera) && Boolean(universidad) && semNum >= 1 && semNum <= 10;
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) return Alert.alert('Validación', 'Nombre completo es requerido');
    if (!universidad) return Alert.alert('Validación', 'Selecciona una universidad');
    const semNum = Number(semestre) || 0;
    if (semNum < 1 || semNum > 10) return Alert.alert('Validación', 'Semestre debe estar entre 1 y 10');
    setLoading(true);
    try {
      const res = await onboard(undefined, fullName.trim(), carrera.trim(), universidad.trim(), Number(semestre) || 0);
      if (res.success) {
        Alert.alert('¡Listo!', 'Perfil completado. Redirigiendo...');
        router.replace('/diagnostic');
      } else {
        Alert.alert('Error', res.error || 'No se pudo completar el perfil');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={require('../../assets/images/Fondo.png')} style={styles.background} resizeMode="cover" blurRadius={2}>
      <View style={styles.center}>
        <View style={styles.card}>
          <Text style={styles.title}>Completa tu perfil</Text>

          <Text style={styles.label}>Nombre completo { !isNameValid(fullName) ? <Text style={{ color: '#d9534f' }}>•</Text> : null }</Text>
          <TextInput value={fullName} onChangeText={setFullName} placeholder="Nombre completo" placeholderTextColor="#999" style={styles.input} />
          {fullName && !isNameValid(fullName) ? (
            <Text style={{ color: '#a00', marginBottom: 8 }}>El nombre sólo debe contener letras y espacios</Text>
          ) : null}

          <Text style={styles.label}>Carrera { !carrera ? <Text style={{ color: '#d9534f' }}>•</Text> : null }</Text>
          <Select options={carreras} selected={carrera} onSelect={setCarrera} placeholder="Carrera" />

          <Text style={styles.label}>Universidad { !universidad ? <Text style={{ color: '#d9534f' }}>•</Text> : null }</Text>
          <Select options={universidades} selected={universidad} onSelect={setUniversidad} placeholder="Universidad" />

          <Text style={styles.label}>Semestre { (semNum < 1 || semNum > 10) ? <Text style={{ color: '#d9534f' }}>•</Text> : null }</Text>
          <Select options={Array.from({ length: 10 }, (_, i) => String(i + 1))} selected={semestre} onSelect={setSemestre} placeholder="Semestre" />

          {/* Inline validation message */}
          {!isFormValid() && (
            <Text style={{ color: '#a00', marginBottom: 8, textAlign: 'center' }}>Todos los campos son obligatorios</Text>
          )}

          <TouchableOpacity onPress={handleSubmit} disabled={loading || !isFormValid()} style={[styles.button, { opacity: (loading || !isFormValid()) ? 0.6 : 1 }]}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Completar perfil</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}
