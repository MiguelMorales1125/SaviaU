import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, Image, TouchableOpacity, Alert, ScrollView, StyleSheet, Platform } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { tabsStyles } from '../../styles/tabs.styles';
import * as ImagePicker from 'expo-image-picker';

export default function Perfil() {
  const { logout, user, updateUser, onboard } = useAuth();

  const [fullName, setFullName] = useState<string>(user?.fullName || '');
  const [description, setDescription] = useState<string>(user?.description || '');
  const [universidad, setUniversidad] = useState<string>(user?.universidad || '');
  const [carrera, setCarrera] = useState<string>(user?.carrera || '');
  const [semestre, setSemestre] = useState<string>(user?.semestre ? String(user?.semestre) : '');
  const [imageUri, setImageUri] = useState<string | undefined>(user?.profileUrl || undefined);

  useEffect(() => {
    
    setFullName(user?.fullName || '');
    setDescription(user?.description || '');
    setUniversidad(user?.universidad || '');
    setCarrera(user?.carrera || '');
    setSemestre(user?.semestre ? String(user.semestre) : '');
    setImageUri(user?.profileUrl || undefined);
  }, [user]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a la galería para seleccionar una imagen.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      // new expo returns result.canceled and result.assets
      // keep it local only (no backend upload yet)
      // handle both older and newer shapes
      // @ts-ignore
      const canceled = typeof result.canceled === 'boolean' ? result.canceled : (result as any).cancelled;
      if (!canceled) {
        // prefer assets array
        // @ts-ignore
        const uri = result.assets && result.assets.length > 0 ? result.assets[0].uri : (result as any).uri;
        if (uri) setImageUri(uri);
      }
    } catch (error) {
      console.warn('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    }
  };

  const onSave = () => {
    if (!fullName.trim()) {
      Alert.alert('Validación', 'El nombre completo no puede estar vacío.');
      return;
    }

    // Update local user state only. Backend integration pending endpoint.
    const doSave = async () => {
      // optimistic local update
      updateUser({
        fullName: fullName.trim(),
        description: description.trim(),
        universidad: universidad.trim(),
        carrera: carrera.trim(),
        semestre: semestre ? Number(semestre) : undefined,
        profileUrl: imageUri,
      });

      // If the user is not onboarded and we have an onboard function, try to send to backend
      try {
        if (onboard && !user?.onboarded) {
          const res = await onboard(undefined, fullName.trim(), carrera.trim(), universidad.trim(), Number(semestre) || 0);
          if (res.success) {
            Alert.alert('Perfil actualizado', 'Perfil completado correctamente en el servidor.');
            return;
          } else {
            // show message but keep local changes
            Alert.alert('Guardado local', res.error || 'No se pudo completar perfil en el servidor, cambios guardados localmente.');
            return;
          }
        }
        Alert.alert('Guardado', 'Cambios guardados localmente.');
      } catch (err) {
        console.warn('Error al guardar perfil en backend:', err);
        Alert.alert('Guardado local', 'Ocurrió un error al guardar en el servidor. Cambios guardados localmente.');
      }
    };

    doSave();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[tabsStyles.perfilTitle, styles.header]}>Mi perfil</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.imageWrapper}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>Sin imagen</Text>
              </View>
            )}
            <TouchableOpacity style={styles.pickButton} onPress={pickImage} accessibilityLabel="Seleccionar imagen">
              <Text style={styles.pickButtonText}>Seleccionar imagen</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoWrapper}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.readonly}>{user?.email || ''}</Text>

            <Text style={styles.label}>Nombre completo</Text>
            <TextInput placeholderTextColor="#999" style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Tu nombre completo" />

            <Text style={styles.label}>Descripción</Text>
            <TextInput placeholderTextColor="#999" style={[styles.input, styles.multiline]} multiline value={description} onChangeText={setDescription} placeholder="Una breve descripción sobre ti" />
          </View>
        </View>
      </View>

      <View style={styles.rowSmall}>
        <View style={styles.field}>
          <Text style={styles.label}>Universidad</Text>
          <TextInput placeholderTextColor="#999" style={styles.input} value={universidad} onChangeText={setUniversidad} placeholder="Universidad" />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Carrera</Text>
          <TextInput placeholderTextColor="#999" style={styles.input} value={carrera} onChangeText={setCarrera} placeholder="Carrera" />
        </View>
      </View>

      <View style={styles.rowSmall}>
        <View style={styles.fieldSmall}>
          <Text style={styles.label}>Semestre</Text>
          <TextInput placeholderTextColor="#999" style={styles.input} value={semestre} onChangeText={setSemestre} placeholder="1" keyboardType="numeric" />
        </View>
      </View>

      
      <View style={styles.buttonsRow}> 
        <TouchableOpacity style={styles.saveButton} onPress={onSave} accessibilityLabel="Guardar">
          <Text style={styles.saveButtonText}>Guardar (local)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={logout} accessibilityLabel="Cerrar sesión">
          <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  imageWrapper: {
    width: 160,
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#1f1f1f'
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: { color: '#444' },
  pickButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#0d6efd',
    borderRadius: 8,
    alignSelf: 'flex-start'
  },
  pickButtonText: { color: '#fff', fontWeight: '600' },
  infoWrapper: { flex: 1, paddingLeft: 8 },
  label: { fontWeight: '700', marginTop: 8, color: '#333' },
  readonly: { paddingVertical: 8, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#ffffff',
    color: '#111',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  rowSmall: { flexDirection: 'row', gap: 12, marginTop: 12 },
  field: { flex: 1 },
  fieldSmall: { width: 120 },
  note: { marginTop: 12, color: '#999' },
  buttonsRow: { flexDirection: 'row', gap: 12, marginTop: 16, alignItems: 'center' },
  saveButton: { backgroundColor: '#198754', padding: 14, borderRadius: 10, flex: 1, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '700' },
  logoutButton: { backgroundColor: '#dc3545', padding: 10, borderRadius: 8, alignItems: 'center', marginLeft: 12, width: 120 },
  logoutButtonText: { color: '#fff', fontWeight: '700' },
  header: { color: '#00c57a', textAlign: 'center', marginBottom: 12 }
});
