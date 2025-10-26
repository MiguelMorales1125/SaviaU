import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';

type UserRow = {
  id: string;
  email: string;
  role?: string;
  createdAt?: string;
};

const MOCK_USERS: UserRow[] = [
  { id: 'u1', email: 'ana@example.com', role: 'user', createdAt: '2024-01-10' },
  { id: 'u2', email: 'carlos@example.com', role: 'user', createdAt: '2024-03-02' },
  { id: 'u3', email: 'admin@example.com', role: 'admin', createdAt: '2023-11-20' },
];

export default function AdminPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserRow[]>(MOCK_USERS);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');

  const isAdmin = user?.role === 'admin';

  const fetchFromSupabase = async () => {
    if (!supabaseUrl || !anonKey) {
      Alert.alert('Faltan datos', 'Provee Supabase URL y ANON key para cargar usuarios reales.');
      return;
    }
    try {
      setLoading(true);
      const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/usuarios?select=*`;
      const resp = await fetch(url, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      });
      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      // map to UserRow
      const mapped = data.map((d: any) => ({ id: d.id?.toString() || d.email, email: d.email || d.id, role: d.role || 'user', createdAt: d.created_at || d.createdAt }));
      setUsers(mapped);
    } catch (err: any) {
      Alert.alert('Error cargando usuarios', err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Acceso denegado</Text>
        <Text style={styles.subtitle}>Sólo los administradores pueden ver esta página.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panel de Administrador</Text>
      <Text style={styles.subtitle}>Usuarios registrados (frontend-only)</Text>

      <View style={styles.rowInput}>
        <TextInput placeholder="Supabase URL (opcional)" value={supabaseUrl} onChangeText={setSupabaseUrl} style={styles.input} />
        <TextInput placeholder="Anon key (opcional)" value={anonKey} onChangeText={setAnonKey} style={styles.input} secureTextEntry />
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity style={styles.button} onPress={fetchFromSupabase} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Cargando...' : 'Cargar usuarios'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.ghost]} onPress={() => setUsers(MOCK_USERS)}>
          <Text style={[styles.buttonText, styles.ghostText]}>Usar datos de ejemplo</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator style={{ marginTop: 12 }} /> : (
        <FlatList
          data={users}
          keyExtractor={(i) => i.id}
          style={{ marginTop: 12, width: '100%' }}
          renderItem={({ item }) => (
            <View style={styles.userRow}>
              <Text style={styles.userEmail}>{item.email}</Text>
              <Text style={styles.userMeta}>{item.role} • {item.createdAt || '-'}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#0b1414' },
  title: { color: '#0dffc8', fontWeight: '800', fontSize: 18 },
  subtitle: { color: '#bfc9c7', marginTop: 6 },
  rowInput: { marginTop: 12, gap: 8 },
  input: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginTop: 6 },
  button: { marginTop: 10, backgroundColor: '#0d6efd', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '700' },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#cfd8d6', marginLeft: 8 },
  ghostText: { color: '#cfd8d6' },
  userRow: { padding: 12, backgroundColor: '#071010', borderRadius: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
  userEmail: { color: '#fff', fontWeight: '700' },
  userMeta: { color: '#9aa6a4' }
});
