import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
// Tamaño del logo de resultados: aumenta en pantallas grandes y se restringe en móviles
const logoSize = Math.min(Math.max(width * 0.12, 100), 150);

export const retosStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 12,
    paddingBottom: 24,
    paddingLeft: 0,
    paddingRight: 0,
    alignItems: 'stretch',
    backgroundColor: '#ecf8f0',
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
    flexDirection: 'column',
    gap: 16,
    alignItems: 'stretch',
    justifyContent: 'flex-start'
  },
  cardLeft: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e9ecef'
  },
  cardRight: {
    display: 'none'
  },
  sideImage: {
    width: '100%',
    height: '100%'
  },
  cardTitle: {
    fontSize: 13,
    color: '#198754',
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  question: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
    color: '#212529'
  },
  band: {
    height: 6,
    width: '100%',
    backgroundColor: '#e6f4ec',
    marginBottom: 10
  },
  optionBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  option: {
    backgroundColor: '#f8f9fa',
  },
  optionDisabled: {
    backgroundColor: '#f8f9fa',
    opacity: 0.7,
    borderColor: '#f1f3f5'
  },
  optionCorrect: {
    backgroundColor: '#d1e7dd',
    borderColor: '#badbcc'
  },
  optionWrong: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c2c7'
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
  feedbackCorrect: {
    color: '#0f5132',
    fontWeight: '700'
  },
  feedbackWrong: {
    color: '#842029',
    fontWeight: '700'
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
  }
});

export default retosStyles;
