import { View, Text, Button } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { perfilStyles as styles } from '../tabs-styles/perfil.styles';

export default function Perfil() {
  const { logout, user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Módulo 3: Perfil de Usuario</Text>
      <Text style={styles.welcomeText}>
        Bienvenido, {user?.email || "usuario"}
      </Text>
      <Button title="Cerrar sesión" onPress={logout} color="#198754" />
    </View>
  );
}
