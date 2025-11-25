import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Image, TouchableOpacity, Alert, ScrollView, StyleSheet, Platform, Modal, Pressable, Animated, Dimensions } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { getApiUrl } from '../../config/api';
import { tabsStyles } from '../../styles/tabs.styles';
import * as ImagePicker from 'expo-image-picker';
import { RankingWidget } from '../../components/ranking/RankingWidget';
// no router needed here

export default function Perfil() {
  const { logout, user, updateUser, onboard, supabaseAccessToken } = useAuth();

  const [fullName, setFullName] = useState<string>(user?.fullName || '');
  const [description, setDescription] = useState<string>(user?.description || '');
  const [universidad, setUniversidad] = useState<string>(user?.universidad || '');
  const [carrera, setCarrera] = useState<string>(user?.carrera || '');
  const [semestre, setSemestre] = useState<string>(user?.semestre ? String(user?.semestre) : '');
  const [alias, setAlias] = useState<string>((user as any)?.alias || '');
  const [interests, setInterests] = useState<string[]>(Array.isArray((user as any)?.interests) ? (user as any).interests : []);
  const [imageUri, setImageUri] = useState<string | undefined>(user?.profileUrl || undefined);
  // Para web: mantener base64 y mime para construir un Blob/File confiable
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [avatarKey, setAvatarKey] = useState<string | undefined>((user as any)?.avatarKey || undefined);
  const [saving, setSaving] = useState(false);
  const initialSnapshot = useRef<any>(null);
  const [editing, setEditing] = useState<boolean>(false);
  // Imagen predeterminada
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const defaultAvatar = require('../../assets/images/usuario.png');
  // Avatares predeterminados con imágenes locales
  const avatarImages: Record<string, any> = {
    avatar1: require('../../assets/images/avatar1.png'),
    avatar2: require('../../assets/images/avatar2.png'),
    avatar3: require('../../assets/images/avatar3.png'),
  };

  // Opciones 
  const carreras: string[] = [
    'Ingeniería de Sistemas',
    'Medicina',
    'Administración',
    'Ingeniería Industrial',
    'Derecho',
    'Licenciatura en educación física y deporte',
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

  // Intereses disponibles (puedes ajustar)
  const interestsOptions: string[] = [
    'Cambio climático',
    'Energías renovables',
    'Biodiversidad',
    'Reciclaje',
    'Agua y océanos',
    'Economía circular',
    'Calidad del aire',
    'Bosques y reforestación',
    'Agricultura sostenible',
    'Movilidad sostenible',
  ];

  // Componente Select similar al utilizado en register/onboard
  const Select = ({ options, selected, onSelect, placeholder }: { options: string[]; selected: string; onSelect: (v: string) => void; placeholder?: string }) => {
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
        <View style={{ width: '100%', borderWidth: 1, borderColor: '#e9ecef', borderRadius: 8, marginTop: 6, marginBottom: 10, backgroundColor: '#fff', overflow: 'hidden' }}>
          <PickerComp selectedValue={selected} onValueChange={(v: any) => onSelect(String(v))} style={{ height: 48 }}>
            <PickerComp.Item label={placeholder || 'Seleccione...'} value={''} />
            {options.map(o => <PickerComp.Item key={o} label={o} value={o} />)}
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
                  <Animated.View style={{ backgroundColor: '#fff', borderRadius: 12, height: modalHeight, overflow: 'hidden', width: modalWidth, transform: [{ translateY: slideAnim }] }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                      <Text style={{ fontSize: 16, fontWeight: '600' }}>{placeholder || 'Seleccione'}</Text>
                      <TouchableOpacity onPress={closeModal} style={{ padding: 6 }} accessibilityLabel="Cerrar modal">
                        <Text style={{ fontSize: 20, color: '#198754' }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f1f1' }}>
                      <TextInput value={search} onChangeText={setSearch} placeholder="Buscar..." placeholderTextColor="#999" style={{ backgroundColor: '#f7f7f7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, fontSize: 15 }} returnKeyType="search" />
                    </View>
                    <ScrollView style={{ height: listHeight }} nestedScrollEnabled>
                      {filtered.length === 0 ? (
                        <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: '#666', fontSize: 16 }}>No existe</Text>
                        </View>
                      ) : (
                        filtered.map(item => {
                          const isSelected = item === selected;
                          return (
                            <Pressable key={item} onPress={() => { onSelect(item); closeModal(); }} style={{ paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: isSelected ? '#e8f7ef' : '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Text style={{ fontSize: 16, color: isSelected ? '#0b6b3b' : '#111' }}>{item}</Text>
                              {isSelected ? <Text style={{ color: '#0b6b3b', fontSize: 16 }}>✓</Text> : null}
                            </Pressable>
                          );
                        })
                      )}
                    </ScrollView>
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
    setDescription(user?.description || '');
    setUniversidad(user?.universidad || '');
    setCarrera(user?.carrera || '');
    setSemestre(user?.semestre ? String(user.semestre) : '');
    setImageUri(user?.profileUrl || undefined);
    setAvatarKey((user as any)?.avatarKey || undefined);
    setAlias((user as any)?.alias || '');
    setInterests(Array.isArray((user as any)?.interests) ? (user as any).interests : []);
    setImageBase64(undefined);
  }, [user]);

  const startEditing = () => {
    // capture snapshot to detect unsaved changes
    initialSnapshot.current = {
      fullName, universidad, carrera, semestre, imageUri, avatarKey, alias, interests: [...interests]
    };
    setEditing(true);
  };

  const hasUnsavedChanges = () => {
    const s = initialSnapshot.current;
    if (!s) return false;
    return (
      s.fullName !== fullName || s.universidad !== universidad ||
      s.carrera !== carrera || s.semestre !== semestre || s.imageUri !== imageUri || s.avatarKey !== avatarKey ||
      s.alias !== alias || JSON.stringify(s.interests || []) !== JSON.stringify(interests)
    );
  };

  const cancelEditing = () => {
    if (hasUnsavedChanges()) {
      Alert.alert('Cambios sin guardar', 'Tienes cambios sin guardar. ¿Deseas descartarlos?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Descartar', style: 'destructive', onPress: () => {
          // revert
          const s = initialSnapshot.current || {};
          setFullName(s.fullName || '');
          setUniversidad(s.universidad || '');
          setCarrera(s.carrera || '');
          setSemestre(s.semestre || '');
          setImageUri(s.imageUri);
          setAvatarKey(s.avatarKey);
          setAlias(s.alias || '');
          setInterests(Array.isArray(s.interests) ? s.interests : []);
          setEditing(false);
        } }
      ]);
    } else {
      setEditing(false);
    }
  };

  const handleLogoutPressed = () => {
    if (editing && hasUnsavedChanges()) {
      Alert.alert('Cambios sin guardar', 'Tienes cambios sin guardar. ¿Deseas descartarlos y cerrar sesión?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Descartar y cerrar sesión', style: 'destructive', onPress: () => logout() }
      ]);
    } else {
      logout();
    }
  };

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
        base64: Platform.OS === 'web' ? true : false,
      } as any);

      // new expo returns result.canceled and result.assets
      // keep it local only (no backend upload yet)
      // handle both older and newer shapes
      // @ts-ignore
      const canceled = typeof result.canceled === 'boolean' ? result.canceled : (result as any).cancelled;
      if (!canceled) {
        // prefer assets array
        // @ts-ignore
        const asset = result.assets && result.assets.length > 0 ? result.assets[0] : undefined;
        const uri = asset?.uri || (result as any).uri;
        if (uri) setImageUri(uri);
        if (Platform.OS === 'web' && asset) {
          // @ts-ignore - expo returns base64 when requested
          if (asset.base64) setImageBase64(asset.base64 as string);
          // @ts-ignore
          if (asset.mimeType) setImageMime(asset.mimeType as string);
        } else {
          setImageBase64(undefined);
        }
        // if user picks a custom image, clear any avatar selection
        setAvatarKey(undefined);
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
    const doSave = async () => {
      if (!supabaseAccessToken) {
        Alert.alert('Error', 'No se encontró token de acceso. Inicia sesión de nuevo.');
        return;
      }

      setSaving(true);
      try {
  console.debug('[Perfil] Guardando perfil - snapshot', { fullName, universidad, carrera, semestre, avatarKey, imageUri });
        let uploadedPhotoUrl: string | undefined = undefined;

        // 1️⃣ Subir imagen si es local
        const isLocal = (u?: string) => {
          if (!u) return false;
          return (
            u.startsWith('file:') ||
            u.startsWith('content:') ||
            u.startsWith('data:') ||
            u.startsWith('blob:') ||
            u.startsWith('asset:')
          );
        };

        if (imageUri && isLocal(imageUri) && !avatarKey) {
          const form = new FormData();
          const name = imageUri.split('/').pop() || 'profile.jpg';
          // En web, necesitamos convertir el uri en Blob/File para que el navegador
          // establezca correctamente el multipart/form-data en lugar de octet-stream.
          if (Platform.OS === 'web') {
            try {
              let blob: Blob;
              if (imageBase64) {
                const byteCharacters = atob(imageBase64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
                const byteArray = new Uint8Array(byteNumbers);
                blob = new Blob([byteArray], { type: imageMime || 'image/jpeg' });
              } else {
                const res = await fetch(imageUri);
                blob = await res.blob();
              }
              const file = new File([blob], name, { type: (blob as any).type || imageMime || 'image/jpeg' });
              form.append('file', file);
            } catch (e) {
              // Fallback a un Blob vacío si algo falla
              const empty = new Blob([], { type: imageMime || 'image/jpeg' });
              const file = new File([empty], name, { type: imageMime || 'image/jpeg' });
              form.append('file', file);
            }
          } else {
            // @ts-ignore - React Native FormData file
            form.append('file', { uri: imageUri, name, type: 'image/jpeg' });
          }

          const url = getApiUrl('/api/profile/photo') + '?accessToken=' + encodeURIComponent(supabaseAccessToken);
          console.debug('[Perfil] Subiendo foto -> POST', url);
          const resp = await fetch(url, {
            method: 'POST',
            body: form,
            // ⚠️ No pongas Content-Type, React Native lo maneja automáticamente (y en web el navegador)
          });

          if (!resp.ok) {
            let json: any = {};
            try {
              json = await resp.json();
            } catch (e) {}
            console.warn('[Perfil] Error subida foto', resp.status, resp.statusText, json);
            throw new Error(json?.message || 'Error subiendo la foto');
          }

          const data = await resp.json();
          console.debug('[Perfil] Foto subida OK', data);
          uploadedPhotoUrl = data?.photoUrl || data?.profile?.photo_url || undefined;
        }

        // 2️⃣ PATCH: actualizar perfil (siempre JSON; la foto ya se configuró en el paso 1)
        const patchBody: any = {
          accessToken: supabaseAccessToken,
          fullName: fullName.trim(),
          carrera: carrera.trim(),
          universidad: universidad.trim(),
          semestre: semestre ? Number(semestre) : undefined,
          avatarKey: avatarKey || undefined,
          alias: alias?.trim() || undefined,
          interests: interests,
        };
        // Compatibilidad opcional con otros backends
        (patchBody as any).intereses = interests;

        console.debug('[Perfil] PATCH /api/profile payload', patchBody);
        const patchResp = await fetch(getApiUrl('/api/profile'), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patchBody),
        });

        if (!patchResp.ok) {
          let json: any = {};
          try {
            json = await patchResp.json();
          } catch (e) {}
          console.warn('[Perfil] PATCH fallo', patchResp.status, patchResp.statusText, json);
          const message = json?.message || 'No se pudo actualizar el perfil';
          throw new Error(message);
        }

        const patched = await patchResp.json();
        console.debug('[Perfil] PATCH OK respuesta', patched);
        const profile = patched?.profile || {};

        // Decidir URL final de perfil y avatarKey respetando exclusividad
        const serverAvatarKey: string | undefined = (profile.avatar_key ?? undefined) as any;
        const finalAvatarKey: string | undefined = serverAvatarKey !== undefined ? serverAvatarKey : (avatarKey || undefined);
        const isRemote = (u?: string) => !!u && /^https?:\/\//i.test(u);
        const finalProfileUrl: string | undefined = finalAvatarKey
          ? undefined
          : (uploadedPhotoUrl ?? profile.photo_url ?? (isRemote(imageUri) ? imageUri : undefined));

        updateUser({
          fullName: (profile.full_name ?? undefined) || fullName.trim(),
          carrera: (profile.carrera ?? undefined) || carrera.trim(),
          universidad: (profile.universidad ?? undefined) || universidad.trim(),
          semestre: (profile.semestre ?? undefined) || (semestre ? Number(semestre) : undefined),
          profileUrl: finalProfileUrl,
          avatarKey: finalAvatarKey,
          alias: (profile.alias ?? profile.handle ?? undefined) || alias?.trim() || undefined,
          interests: Array.isArray(profile.interests) ? profile.interests : (Array.isArray(profile.intereses) ? profile.intereses : interests),
        } as any);

        Alert.alert('Guardado', 'Perfil actualizado correctamente.');
        setEditing(false);
      } catch (err: any) {
        console.warn('Error al guardar perfil en backend:', err);
        Alert.alert('Error', err?.message || 'Ocurrió un error al guardar el perfil.');
        // Fallback: persistir al menos localmente para que permanezca tras reingreso
        try {
          const isRemote = (u?: string) => !!u && /^https?:\/\//i.test(u);
          const fallbackAvatarKey = avatarKey || undefined;
          const fallbackProfileUrl = fallbackAvatarKey ? undefined : (isRemote(imageUri) ? imageUri : undefined);
          updateUser({
            fullName: fullName.trim(),
            carrera: carrera.trim(),
            universidad: universidad.trim(),
            semestre: semestre ? Number(semestre) : undefined,
            alias: alias?.trim() || undefined,
            interests: interests,
            avatarKey: fallbackAvatarKey,
            profileUrl: fallbackProfileUrl,
          } as any);
        } catch {}
      } finally {
        setSaving(false);
      }
    };

    doSave();
  };

  // Vista estilo "perfil público" (como la imagen) vs modo edición
  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.container}>
        {!editing ? (
        <View style={styles.viewWrapper}>
          {/* Acción superior: botón de Cerrar sesión en esquina derecha */}
          <View style={styles.topActionsRow}>
            <TouchableOpacity onPress={handleLogoutPressed} style={styles.logoutTopBtn} accessibilityLabel="Cerrar sesión">
              <Text style={styles.logoutTopText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileCard}>
            {/* Avatar */}
            <View style={{ alignItems: 'center', marginTop: 0 }}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.bigAvatar} />
              ) : (avatarKey && avatarImages[avatarKey]) ? (
                <Image source={avatarImages[avatarKey]} style={styles.bigAvatar} />
              ) : (
                <Image source={defaultAvatar} style={styles.bigAvatar} />
              )}
            </View>

            {/* Nombre y líneas secundarias */}
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <Text style={styles.nameText}>{fullName || 'Tu nombre'}</Text>
              <Text style={styles.handleText}>@{(alias || (user?.email || '').split('@')[0]) || 'usuario'}</Text>
              <Text style={styles.locationText}> {universidad || '—'}</Text>
            </View>

            {/* Programa y semestre en chips */}
            <View style={styles.chipsRow}>
              {carrera ? (
                <View style={styles.chip}><Text style={styles.chipText}> {carrera}</Text></View>
              ) : null}
              {semestre ? (
                <View style={styles.chip}><Text style={styles.chipText}> Semestre {semestre}</Text></View>
              ) : null}
            </View>

            {/* Intereses seleccionados */}
            {interests.length > 0 ? (
              <View style={[styles.chipsRow, { marginTop: 12 }]}> 
                {interests.map((it) => (
                  <View key={it} style={styles.chip}><Text style={styles.chipText}> {it}</Text></View>
                ))}
              </View>
            ) : (
              <View style={styles.aboutBox}><Text style={styles.aboutText}>Agrega tus intereses para personalizar la experiencia.</Text></View>
            )}
          </View>

          {/* Progresos y logros */}
          <View style={{ width: '100%', maxWidth: 920, alignSelf: 'center', marginTop: 18 }}>
            <Text style={styles.sectionTitle}>Progresos y logros</Text>
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}><Text style={styles.metricValue}>8</Text><Text style={styles.metricLabel}>Insignias</Text></View>
              <View style={styles.metricCard}><Text style={styles.metricValue}>50%</Text><Text style={styles.metricLabel}>Áreas</Text></View>
              <View style={styles.metricCard}><Text style={styles.metricValue}>20</Text><Text style={styles.metricLabel}>Noticias</Text></View>
            </View>
          </View>

          {/* Información personal + Ranking (dos columnas) */}
          <View style={styles.twoColRow}>
            <View style={styles.infoCard}> 
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Información personal</Text>
                <TouchableOpacity onPress={startEditing} style={styles.headerBtn} accessibilityLabel="Editar información">
                  <Text style={styles.headerBtnText}>Editar</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.cardSubtext}>Administra los datos principales de tu cuenta.</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}><Text style={styles.infoLabel}>Nombre completo</Text><Text style={styles.infoValue}>{fullName || '—'}</Text></View>
                <View style={styles.infoItem}><Text style={styles.infoLabel}>Correo electrónico</Text><Text style={styles.infoValue}>{user?.email || '—'}</Text></View>
                <View style={styles.infoItem}><Text style={styles.infoLabel}>Universidad</Text><Text style={styles.infoValue}>{universidad || '—'}</Text></View>
                <View style={styles.infoItem}><Text style={styles.infoLabel}>Carrera</Text><Text style={styles.infoValue}>{carrera || '—'}</Text></View>
                <View style={styles.infoItem}><Text style={styles.infoLabel}>Semestre</Text><Text style={styles.infoValue}>{semestre || '—'}</Text></View>
              </View>
            </View>
            {/* Ranking lateral */}
            <View style={styles.rankingCard}>
              <Text style={styles.cardTitle}>🏆 Ranking</Text>
              <Text style={styles.cardSubtext}>Tu posición y progreso en la plataforma.</Text>
              <View style={{ height: 12 }} />
              {supabaseAccessToken ? (
                <RankingWidget 
                  accessToken={supabaseAccessToken}
                  currentUserId={user?.id}
                  showTop={10}
                />
              ) : (
                <Text style={{ color: '#999', textAlign: 'center', padding: 20 }}>
                  Inicia sesión para ver el ranking
                </Text>
              )}
            </View>
          </View>

          {/* Sin acciones inferiores en modo vista: el botón Editar queda en la tarjeta y Cerrar sesión arriba */}
        </View>
      ) : (
        // MODO EDICIÓN: reutilizamos el formulario existente para editar y luego Guardar
        <View style={{ width: '100%', maxWidth: 980, alignSelf: 'center' }}>
          <View style={styles.editHeaderRow}>
            <Text style={[tabsStyles.perfilTitle, styles.header, { marginBottom: 0 }]}>Editar perfil</Text>
            <View style={styles.headerButtonsRow}>
              <TouchableOpacity
                style={[styles.saveHeaderBtn, saving ? { opacity: 0.7 } : null]}
                onPress={onSave}
                disabled={saving}
                accessibilityLabel="Guardar cambios"
              >
                <Text style={styles.saveHeaderBtnText}>{saving ? 'Guardando...' : 'Guardar cambios'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutHeaderBtn}
                onPress={handleLogoutPressed}
                accessibilityLabel="Cerrar sesión"
              >
                <Text style={styles.logoutHeaderBtnText}>Cerrar sesión</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerBtn, { height: 40 }]}
                onPress={cancelEditing}
                accessibilityLabel="Cancelar edición"
              >
                <Text style={styles.headerBtnText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.imageWrapper}>
                  <Image source={imageUri ? { uri: imageUri } : (avatarKey && avatarImages[avatarKey]) ? avatarImages[avatarKey] : defaultAvatar} style={styles.avatar} />
                  <TouchableOpacity style={styles.pickButton} onPress={pickImage} accessibilityLabel="Seleccionar imagen">
                    <Text style={styles.pickButtonText}>Seleccionar imagen</Text>
                  </TouchableOpacity>

                  <View style={{ marginTop: 12 }}>
                    <Text style={{ fontWeight: '700', marginBottom: 8 }}>O elige un avatar</Text>
                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', maxWidth: '100%', justifyContent: 'flex-start' }}>
                      {Object.keys(avatarImages).map(k => (
                        <TouchableOpacity key={k} onPress={() => { setAvatarKey(k); setImageUri(undefined); setImageBase64(undefined); }} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: avatarKey === k ? '#e6f4ec' : '#f5f5f5', alignItems: 'center', justifyContent: 'center', borderWidth: avatarKey === k ? 2 : 0, borderColor: '#198754', overflow: 'hidden' }} accessibilityLabel={`Seleccionar avatar ${k}`}>
                          <Image source={avatarImages[k]} style={{ width: 44, height: 44, borderRadius: 22 }} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

              <View style={styles.infoWrapper}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.readonly}>{user?.email || ''}</Text>

                <Text style={styles.label}>Nombre completo</Text>
                <TextInput placeholderTextColor="#999" style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Tu nombre completo" />

                <Text style={styles.label}>Alias (público)</Text>
                <TextInput placeholderTextColor="#999" style={styles.input} value={alias} onChangeText={setAlias} placeholder="Tu alias público (opcional)" />

                {/* Descripción removida temporalmente; mostramos mensaje fijo en modo lectura */}
              </View>
            </View>
          </View>

          <View style={styles.rowSmall}>
            <View style={styles.field}>
              <Text style={styles.label}>Universidad</Text>
              <Select options={universidades} selected={universidad} onSelect={setUniversidad} placeholder="Seleccione universidad..." />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Carrera</Text>
              <Select options={carreras} selected={carrera} onSelect={setCarrera} placeholder="Seleccione carrera..." />
            </View>
          </View>

          <View style={styles.rowSmall}>
            <View style={styles.fieldSmall}>
              <Text style={styles.label}>Semestre</Text>
              <Select options={Array.from({ length: 10 }, (_, i) => String(i + 1))} selected={semestre} onSelect={setSemestre} placeholder="Seleccione semestre..." />
            </View>
          </View>

          {/* Intereses: selección por chips */}
          <View style={styles.prefsCard}>
            <Text style={styles.cardTitle}>Intereses</Text>
            <Text style={styles.cardSubtext}>Elige varios para personalizar contenidos.</Text>
            <View style={styles.pillGrid}>
              {interestsOptions.map((opt) => {
                const active = interests.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => {
                      setInterests((prev) => active ? prev.filter(x => x !== opt) : [...prev, opt]);
                    }}
                    style={[styles.pill, active ? styles.pillActive : styles.pillMuted]}
                  >
                    <Text style={[styles.pillText, active ? styles.pillTextActive : styles.pillTextMuted]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Acciones inferiores eliminadas: Cerrar sesión se ubica junto a Guardar cambios en el encabezado */}
        </View>
      )}
        
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#ecf8f0' },
  container: {
    padding: 16,
    paddingBottom: 88,
    minHeight: '100%',
    flexGrow: 1
  },
  topBar: {
    width: '100%',
    backgroundColor: '#198754',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  topBarBrand: { color: '#fff', fontWeight: '800', fontSize: 16 },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBarButton: { backgroundColor: '#156f44', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  topBarButtonSave: { backgroundColor: '#0f5d36' },
  topBarButtonSecondary: { backgroundColor: '#dc3545', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  topBarButtonText: { color: '#fff', fontWeight: '700' },
  actionsRow: { width: '100%', maxWidth: 920, alignSelf: 'center', marginBottom: 8, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  contentActions: { width: '100%', maxWidth: 980, alignSelf: 'center', marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 16 },
  primaryCTA: {
    flex: 1,
    backgroundColor: '#00c57a',
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryCTASave: { backgroundColor: '#0f9a5f' },
  primaryCTAText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  secondaryCTA: {
    backgroundColor: '#ff5b6a',
    paddingHorizontal: 18,
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCTAText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  // Acciones: sin fondo blanco, estilo limpio
  actionsCard: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 0,
    borderColor: 'transparent',
    padding: 0,
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPrimary: { backgroundColor: '#00c57a' },
  actionPrimaryText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  actionDanger: { backgroundColor: '#ffe3e3', borderWidth: 1, borderColor: '#ffc9c9' },
  actionDangerText: { color: '#b80e14b6', fontWeight: '800', fontSize: 15 },
  viewWrapper: { alignItems: 'center', width: '100%' },
  profileCard: {
    width: '100%',
    maxWidth: 920,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 18,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  bigAvatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: '#198754' },
  defaultAvatar: { backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  defaultAvatarIcon: { fontSize: 56, color: '#2b2b2b' },
  defaultAvatarIconLarge: { fontSize: 72, color: '#2b2b2b' },
  nameText: { fontSize: 20, fontWeight: '800', color: '#1f1f1f' },
  handleText: { color: '#198754', marginTop: 2 },
  locationText: { color: '#666', marginTop: 2 },
  metaText: { color: '#222', marginTop: 6 },
  chipsRow: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' },
  chip: { backgroundColor: '#f7fbf8', borderWidth: 1, borderColor: '#e0efe5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  chipText: { color: '#0b6b3b', fontWeight: '700' },
  aboutBox: {
    marginTop: 12,
    backgroundColor: '#fcfffd',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 10,
    padding: 12,
  },
  aboutText: { color: '#2b2b2b', textAlign: 'center', lineHeight: 22, fontStyle: 'italic', fontSize: 15 },
  sectionTitle: { color: '#2b2b2b', fontWeight: '700', marginLeft: 6, marginBottom: 6 },
  metricsRow: { flexDirection: 'row', gap: 14 },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  metricValue: { fontWeight: '800', fontSize: 18, color: '#1f1f1f' },
  metricLabel: { color: '#666', marginTop: 4 },
  singleRow: { width: '100%', maxWidth: 920, alignSelf: 'center', marginTop: 18, alignItems: 'flex-start' },
  twoColRow: { flexDirection: 'row', gap: 18, width: '100%', maxWidth: 920, alignSelf: 'center', marginTop: 18, flexWrap: 'wrap', alignItems: 'flex-start' },
  // Nuevas tarjetas inspiradas en el mock
  splitRow: { flexDirection: 'row', gap: 18, width: '100%', maxWidth: 920, alignSelf: 'center', marginTop: 18, flexWrap: 'wrap' },
  infoCard: { width: '100%', maxWidth: 480, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e9ecef', padding: 16, alignSelf: 'flex-start' },
  rankingCard: { flexGrow: 1, flexBasis: 320, maxWidth: 420, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e9ecef', padding: 16, alignSelf: 'flex-start' },
  statusCard: { flexGrow: 1, flexBasis: 420, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e9ecef', padding: 16 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { color: '#11ae0eff', fontWeight: '800' },
  cardSubtext: { color: '#6b7280', marginTop: 4 },
  headerBtn: { backgroundColor: '#f1f5f9', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: '#e5e7eb', minHeight: 40 },
  headerBtnText: { color: '#111827', fontWeight: '500', fontSize: 15 },
  infoGrid: { marginTop: 10, gap: 10 },
  infoItem: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { color: '#6b7280' },
  infoValue: { color: '#111827', fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDotOk: { color: '#16a34a', fontSize: 18, lineHeight: 18 },
  statusDotWarn: { color: '#dc2626', fontSize: 18, lineHeight: 18 },
  statusText: { color: '#111827' },
  prefsCard: { width: '100%', maxWidth: 920, alignSelf: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e9ecef', padding: 16, marginTop: 18 },
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  pill: { height: 44, borderRadius: 12, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  pillActive: { backgroundColor: '#e6f4ec', borderColor: '#d7e8dc' },
  pillMuted: { backgroundColor: '#f8fafc', borderColor: '#e5e7eb' },
  pillText: { fontWeight: '700' },
  pillTextActive: { color: '#0b6b3b' },
  pillTextMuted: { color: '#64748b' },
  rankingBox: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e9ecef', padding: 14 },
  rankingBadge: { alignSelf: 'center', backgroundColor: '#e6f4ec', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, marginBottom: 12 },
  rankingBadgeText: { color: '#198754', fontWeight: '800' },
  rankingPlaceholder: { borderWidth: 1, borderColor: '#eef1ee', borderRadius: 10, height: 120, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa' },
  topActionsRow: { width: '100%', maxWidth: 920, alignSelf: 'center', marginBottom: 8, alignItems: 'flex-end' },
  logoutTopBtn: { backgroundColor: '#ffe3e3', borderRadius: 10, height: 44, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ffc9c9' },
  logoutTopText: { color: '#c0353a', fontWeight: '800' },
  loginTopBtn: { backgroundColor: '#e6f4ec', borderRadius: 10, height: 40, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#cfe7d8' },
  loginTopText: { color: '#0b6b3b', fontWeight: '800' },
  editHeaderRow: { width: '100%', maxWidth: 980, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerButtonsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveHeaderBtn: { backgroundColor: '#00c57a', borderRadius: 10, height: 40, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  saveHeaderBtnText: { color: '#fff', fontWeight: '800' },
  logoutHeaderBtn: { backgroundColor: '#ffe3e3', borderRadius: 10, height: 40, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ffc9c9' },
  logoutHeaderBtnText: { color: '#c0353a', fontWeight: '800' },
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
  logoutSmall: { backgroundColor: '#dc3545', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  pickButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#198754',
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
  header: { color: '#198754', textAlign: 'center', marginBottom: 12 }
});
