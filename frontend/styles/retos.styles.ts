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
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 16,
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
    maxWidth: 1200,
    flexDirection: 'column',
    gap: 20,
    alignItems: 'stretch',
    justifyContent: 'flex-start'
  },
  cardLeft: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: '#ffffff',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1fae5',
    ...(Platform.select({
      web: {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }
    }) as any)
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
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: '#1f2937',
    lineHeight: 32
  },
  band: {
    height: 4,
    width: 80,
    backgroundColor: '#10b981',
    marginBottom: 16,
    borderRadius: 2
  },
  optionBtn: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
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
    color: '#1f2937',
    fontWeight: '600',
    fontSize: 16
  },
  feedbackBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 60,
    justifyContent: 'center'
  },
  feedbackSuccess: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981'
  },
  feedbackDanger: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444'
  },
  feedbackCorrect: {
    color: '#047857',
    fontWeight: '700',
    fontSize: 16
  },
  feedbackWrong: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 16
  },
  // texto descriptivo agradable para la retroalimentación
  feedbackBody: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 24,
    color: '#374151'
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
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  primaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#10b981',
    ...(Platform.select({
      web: {
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      }
    }) as any)
  },
  badgeBanner: {
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#065f46',
    alignItems: 'center'
  },
  badgeBannerText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15
  },
  resultScreen: {
    flex: 1,
    backgroundColor: '#f0fdf4'
  },
  resultWrapper: {
    padding: 32,
    alignItems: 'center',
    minHeight: '100%',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  resultCard: {
    marginTop: 24,
    backgroundColor: '#ffffff',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    maxWidth: 500,
    width: '100%',
    borderWidth: 1,
    borderColor: '#d1fae5',
    ...(Platform.select({
      web: {
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
      }
    }) as any)
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827'
  },
  resultIcon: {
    width: logoSize,
    height: logoSize,
    marginBottom: 16
  },
  trophyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
    marginTop: 8
  },
  pointsBox: {
    alignItems: 'center',
    marginVertical: 16,
  },
  pointsNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#111827',
    lineHeight: 56,
  },
  pointsPercent: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '700',
    color: '#6b7280',
  },
  continueBtn: {
    marginTop: 16,
    backgroundColor: '#10b981',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  // Sección de retroalimentación inferior (bajo el bloque principal)
  bottomSection: {
    width: '100%',
    maxWidth: 1200,
    paddingHorizontal: 0,
    paddingBottom: 0,
    paddingTop: 0,
  },
  bottomCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    ...(Platform.select({
      web: {
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      }
    }) as any)
  },
  bottomTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  bottomText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  statsCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1fae5',
    ...(Platform.select({
      web: {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }
    }) as any)
  }
});

export default retosStyles;
