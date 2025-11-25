import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Linking,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '../context/AccessibilityContext';

export default function AccessibilityButton() {
  const [visible, setVisible] = useState(false);
  const {
    grayscaleMode,
    toggleGrayscale,
    textScale,
    increaseTextSize,
    decreaseTextSize,
    resetTextSize,
  } = useAccessibility();

  const openScreenReader = () => {
    const url = 'https://www.convertic.gov.co/641/w3-propertyvalue-15339.html';
    Linking.openURL(url).catch(err => console.error('Error opening URL:', err));
  };

  return (
    <>
      {/* Botón flotante de accesibilidad */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setVisible(true)}
        accessibilityLabel="Opciones de accesibilidad"
        accessibilityRole="button"
      >
        <Ionicons name="accessibility" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal de opciones */}
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Accesibilidad</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={28} color="#0f172a" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsContainer}>
              {/* Modo Escala de Grises */}
              <View style={styles.optionCard}>
                <View style={styles.optionHeader}>
                  <Ionicons name="color-filter" size={24} color="#198754" />
                  <Text style={styles.optionTitle}>Modo Escala de Grises</Text>
                </View>
                <Text style={styles.optionDescription}>
                  Reduce la saturación de colores para facilitar la lectura
                </Text>
                <TouchableOpacity
                  style={[styles.toggleButton, grayscaleMode && styles.toggleButtonActive]}
                  onPress={toggleGrayscale}
                >
                  <Text style={[styles.toggleText, grayscaleMode && styles.toggleTextActive]}>
                    {grayscaleMode ? 'Activado' : 'Desactivado'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Control de Tamaño de Texto */}
              <View style={styles.optionCard}>
                <View style={styles.optionHeader}>
                  <Ionicons name="text" size={24} color="#198754" />
                  <Text style={styles.optionTitle}>Tamaño de Texto</Text>
                </View>
                <Text style={styles.optionDescription}>
                  Actual: {Math.round(textScale * 100)}%
                </Text>
                <View style={styles.textSizeControls}>
                  <TouchableOpacity
                    style={styles.sizeButton}
                    onPress={decreaseTextSize}
                    disabled={textScale <= 0.8}
                  >
                    <Ionicons name="remove-circle" size={32} color={textScale <= 0.8 ? '#cbd5e1' : '#198754'} />
                    <Text style={styles.sizeButtonLabel}>Reducir</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.resetButton}
                    onPress={resetTextSize}
                  >
                    <Text style={styles.resetButtonText}>Restablecer</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sizeButton}
                    onPress={increaseTextSize}
                    disabled={textScale >= 1.5}
                  >
                    <Ionicons name="add-circle" size={32} color={textScale >= 1.5 ? '#cbd5e1' : '#198754'} />
                    <Text style={styles.sizeButtonLabel}>Aumentar</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Lector de Pantalla */}
              <View style={styles.optionCard}>
                <View style={styles.optionHeader}>
                  <Ionicons name="volume-high" size={24} color="#198754" />
                  <Text style={styles.optionTitle}>Lector de Pantalla</Text>
                </View>
                <Text style={styles.optionDescription}>
                  Descargar lector de texto del Gobierno de Colombia
                </Text>
                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={openScreenReader}
                >
                  <Ionicons name="download" size={20} color="#fff" />
                  <Text style={styles.downloadButtonText}>Descargar Lector</Text>
                </TouchableOpacity>
              </View>

              {/* Información adicional */}
              <View style={styles.infoCard}>
                <Ionicons name="information-circle" size={20} color="#64748b" />
                <Text style={styles.infoText}>
                  {Platform.OS === 'ios' 
                    ? 'En iOS, también puedes usar VoiceOver desde Ajustes > Accesibilidad'
                    : 'En Android, también puedes usar TalkBack desde Ajustes > Accesibilidad'}
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#198754',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  optionsContainer: {
    paddingHorizontal: 24,
  },
  optionCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginLeft: 12,
  },
  optionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  toggleButton: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#198754',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  toggleTextActive: {
    color: '#fff',
  },
  textSizeControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sizeButton: {
    alignItems: 'center',
  },
  sizeButtonLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  resetButton: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  downloadButton: {
    flexDirection: 'row',
    backgroundColor: '#198754',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
  closeButton: {
    backgroundColor: '#198754',
    marginHorizontal: 24,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
