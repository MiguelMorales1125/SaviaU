import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const retosStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#081012',
    minHeight: '100%'
  },
  header: {
    alignSelf: 'flex-start',
    fontSize: 13,
    color: '#0d6efd',
    fontWeight: '700',
    marginBottom: 12,
  },
  cardRow: {
    width: '100%',
    maxWidth: 1200,
    flexDirection: 'column',
    gap: 16,
    alignItems: 'stretch',
    justifyContent: 'flex-start'
  },
  cardLeft: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
    backgroundColor: '#0f1314',
    padding: 18,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardRight: {
    display: 'none'
  },
  sideImage: {
    width: '100%',
    height: '100%'
  },
  cardTitle: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '700',
    marginBottom: 6
  },
  question: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#212529'
  },
  optionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  option: {
    backgroundColor: '#f1f3f5',
  },
  optionDisabled: {
    backgroundColor: '#f8f9fa',
    opacity: 0.7
  },
  optionCorrect: {
    backgroundColor: '#d1e7dd'
  },
  optionWrong: {
    backgroundColor: '#f8d7da'
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
  resultWrapper: {
    padding: 24,
    alignItems: 'center',
    minHeight: '100%'
  },
  resultCard: {
    marginTop: 18,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: 420
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827'
  },
  resultIcon: {
    width: 84,
    height: 84,
    marginBottom: 8
  },
  trophyText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#198754'
  },
  pointsText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0d6efd',
    marginVertical: 10
  },
  continueBtn: {
    marginTop: 8,
    backgroundColor: '#0d6efd',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12
  }
});

export default retosStyles;
