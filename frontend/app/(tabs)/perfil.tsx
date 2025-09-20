import { View, Text, Button } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function Perfil() {
  const { logout, user } = useAuth();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Módulo 3: Perfil de Usuario</Text>
      <Text style={{ marginVertical: 16 }}>
        Bienvenido, {user?.email || "usuario"}
      </Text>
      <Button title="Cerrar sesión" onPress={logout} />
    </View>
  );
}
