import React, { useEffect, useState } from 'react';
import { Tabs, Link, usePathname } from 'expo-router';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
// import { IconSymbol } from '@/components/ui/icon-symbol';
// import { Colors } from '@/constants/theme';
// import { useColorScheme } from '@/hooks/use-color-scheme';

import { useAuth } from '../../context/AuthContext';
import LoginScreen from '../(auth)/login';

function UserMenu() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { setMenuOpen(false); }, [pathname]);
  return (
    <View style={{ position: 'relative' }}>
      <Pressable onPress={() => setMenuOpen((v) => !v)} style={({ pressed }) => [stylesTop.userChip, pressed && { opacity: 0.85 }]}>
        <Ionicons name="person-circle-outline" size={18} color="#0f172a" />
        <Text style={[stylesTop.userChipText, { color: '#0f172a' }]} numberOfLines={1}>
          {user?.fullName || user?.email || 'Perfil'}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#0f172a" />
      </Pressable>
      {menuOpen && (
        <View style={[stylesTop.menu, { top: 44, right: 0 }] }>
          <Link href={'/(tabs)/perfil'} asChild>
            <Pressable style={({ pressed }) => [stylesTop.menuItem, pressed && stylesTop.menuItemPressed]} onPress={() => setMenuOpen(false)}>
              <Ionicons name="person-outline" size={16} color="#0f172a" />
              <Text style={stylesTop.menuText}>Perfil</Text>
            </Pressable>
          </Link>
          <Pressable
            style={({ pressed }) => [stylesTop.menuItem, pressed && stylesTop.menuItemPressed]}
            onPress={() => { setMenuOpen(false); logout(); }}>
            <Ionicons name="log-out-outline" size={16} color="#c0353a" />
            <Text style={[stylesTop.menuText, { color: '#c0353a' }]}>Cerrar sesión</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function ProtectedTabs() {
  const { user } = useAuth();
  // const colorScheme = useColorScheme();

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.75)',
        tabBarStyle: { backgroundColor: '#198754', borderTopColor: '#198754', height: 56, paddingBottom: 6, paddingTop: 6 },
        tabBarButton: HapticTab,
        tabBar: (props) => <CustomTabBar {...props} />,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: '¡Bienvenido!',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="retos"
        options={{
          title: 'Retos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="help-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tematicas"
        options={{
          title: 'Temáticas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default ProtectedTabs;

const stylesTop = StyleSheet.create({
  userChip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#ffffff', gap: 8, maxWidth: 260 },
  userChipText: { fontWeight: '700', maxWidth: 180 },
  menu: { position: 'absolute', backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 6, minWidth: 180, shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 6, borderWidth: 1, borderColor: '#e6eef6', zIndex: 50 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 12 },
  menuItemPressed: { backgroundColor: '#f4f7fb' },
  menuText: { color: '#0f172a', fontWeight: '600' },
});

// Custom bottom tab bar to attach the Perfil dropdown menu and brand styling
function CustomTabBar({ state, descriptors, navigation }: any) {
  const { logout, user } = useAuth();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [state.index]);

  return (
    <View style={{ position: 'relative' }}>
      {/* Overlay to close the menu when tapped outside */}
      {open && (
        <Pressable onPress={() => setOpen(false)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 56 }} />
      )}

      <View style={{ flexDirection: 'row', backgroundColor: '#198754', borderTopColor: '#198754', borderTopWidth: 1, height: 56 }}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const color = isFocused ? '#ffffff' : 'rgba(255,255,255,0.85)';
          const onPress = () => {
            if (route.name === 'perfil') {
              setOpen((v) => !v);
              return;
            }
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });
          return (
            <Pressable key={route.key} accessibilityRole="button" onPress={onPress} onLongPress={onLongPress} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              {options.tabBarIcon ? options.tabBarIcon({ color, size: 20, focused: isFocused }) : null}
              {options.title ? <Text style={{ color, fontSize: 12, fontWeight: isFocused ? '700' : '600' }}>{options.title}</Text> : null}
            </Pressable>
          );
        })}
      </View>

      {open && (
        <View style={[stylesTop.menu, { right: 12, bottom: 56 + 8 }] }>
          <Link href={'/(tabs)/perfil'} asChild>
            <Pressable style={({ pressed }) => [stylesTop.menuItem, pressed && stylesTop.menuItemPressed]} onPress={() => setOpen(false)}>
              <Ionicons name="person-outline" size={16} color="#0f172a" />
              <Text style={stylesTop.menuText}>Perfil</Text>
            </Pressable>
          </Link>
          <Pressable
            style={({ pressed }) => [stylesTop.menuItem, pressed && stylesTop.menuItemPressed]}
            onPress={() => { setOpen(false); logout(); }}>
            <Ionicons name="log-out-outline" size={16} color="#c0353a" />
            <Text style={[stylesTop.menuText, { color: '#c0353a' }]}>Cerrar sesión</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

