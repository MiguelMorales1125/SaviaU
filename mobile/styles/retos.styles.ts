import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');
// Tamaño del logo de resultados: aumenta en pantallas grandes y se restringe en móviles
const logoSize = Math.min(Math.max(width * 0.12, 100), 150);

export const retosStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f0fdf4'
  },
  container: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 12,
    alignItems: 'center',
    minHeight: '100%'
  },
  header: {
    alignSelf: 'flex-start',
    fontSize: 13,
    color: '#198754',
    fontWeight: '700',
    marginBottom: 12,
  },
  cardRow: {
    width: '100%',
    maxWidth: 600,
    flexDirection: 'column',
    gap: 16,
    alignItems: 'stretch',
    justifyContent: 'flex-start'
  },
  cardLeft: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1fae5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  // Variación para la vista de listado (retos disponibles)
  cardList: {
    backgroundColor: '#ffffff',
    borderColor: '#d1fae5',
  },
  cardRight: {
    display: 'none',
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderColor: 'transparent'
  },
  sideImage: {
    width: '100%',
    height: '100%'
  },
  cardTitle: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '800',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  question: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1f2937',
    lineHeight: 28
  },
  band: {
    height: 4,
    width: 60,
    backgroundColor: '#10b981',
    marginBottom: 12,
    borderRadius: 2
  },
  optionBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e5e7eb'
  },
  option: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
  },
  // Botón de opción para listado de sets (ligeramente verdoso para combinar paleta)
  optionList: {
    backgroundColor: '#ffffff',
    borderColor: '#d1fae5',
  },
  optionDisabled: {
    backgroundColor: '#f9fafb',
    opacity: 0.6,
    borderColor: '#e5e7eb'
  },
  optionCorrect: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981'
  },
  optionWrong: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444'
  },
  optionText: {
    color: '#212529',
    fontWeight: '700'
  },
  feedbackBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef'
    ,
    minHeight: 24,
    justifyContent: 'center'
  },
  feedbackSuccess: {
    backgroundColor: '#d1e7dd',
    borderColor: '#badbcc'
  },
  feedbackDanger: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c2c7'
  },
  feedbackCorrect: {
    color: '#0f5132',
    fontWeight: '700'
  },
  feedbackWrong: {
    color: '#842029',
    fontWeight: '700'
  },
  // texto descriptivo agradable para la retroalimentación
  feedbackBody: {
    marginTop: 6,
    fontFamily: 'serif',
    fontSize: 15,
    lineHeight: 22,
  },
  badgeBtn: {
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#e9ecef',
    alignItems: 'center'
  },
  badgeUnlocked: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeeba'
  },
  badgeText: {
    color: '#6f5846',
    fontWeight: '700'
  },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#198754'
  },
  primaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#198754'
  },
  badgeBanner: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#14532d',
    alignItems: 'center'
  },
  badgeBannerText: {
    color: '#fff',
    fontWeight: '800'
  },
  resultScreen: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  resultWrapper: {
    padding: 24,
    alignItems: 'center',
    minHeight: '100%',
    justifyContent: 'center'
  },
  resultCard: {
    marginTop: 18,
    backgroundColor: 'transparent',
    padding: 0,
    borderRadius: 0,
    alignItems: 'center',
    width: 420
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827'
  },
  resultIcon: {
    width: logoSize,
    height: logoSize,
    marginBottom: 10
  },
  trophyText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#198754'
  },
  pointsBox: {
    alignItems: 'center',
    marginVertical: 10,
  },
  pointsNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
    lineHeight: 36,
  },
  pointsPercent: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: '800',
    color: '#6b7280',
  },
  continueBtn: {
    marginTop: 8,
    backgroundColor: '#198754',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12
  },
  // Sección de retroalimentación inferior (bajo el bloque principal)
  bottomSection: {
    width: '100%',
    paddingHorizontal: 12,
    paddingBottom: 16,
    paddingTop: 8,
  },
  bottomCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    // en pantallas grandes, centra el contenido y limita el ancho para que quede en el medio
    maxWidth: 1100,
    alignSelf: 'center'
  },
  bottomTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  bottomText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  }
});

export default retosStyles;
