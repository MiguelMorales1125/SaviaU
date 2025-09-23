import { View, Text, Button } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { tabsStyles } from '../../styles/tabs.styles';

export default function Perfil() {
  const { logout, user } = useAuth();

  return (
    <View style={tabsStyles.perfilContainer}>
      <Text style={tabsStyles.perfilTitle}>Módulo 3: Perfil de Usuario</Text>
      <Text style={tabsStyles.perfilWelcomeText}>
        Bienvenido, {user?.email || "usuario"}
      </Text>
      <Button title="Cerrar sesión" onPress={logout} color="#198754" />
    </View>
  );
}
