import { StyleSheet, Dimensions } from 'react-native';

const windowHeight = Dimensions.get('window').height || 800;

export const onboardStyles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
  // ensure on web the background covers full viewport
  minHeight: Math.max(windowHeight, 800),
  // for web environments allow full viewport height
  height: ('100vh' as unknown) as number,
    padding: 24,
    backgroundColor: '#f5f7f9',
    alignSelf: 'stretch',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    // ensure children that overflow (modals) are visible and card is centered
    overflow: 'visible',
  },
  title: {
    color: '#0b2f1b',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  label: {
    color: '#333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#e9ecef',
    borderWidth: 1,
    color: '#111',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    // allow text to wrap if long option labels exist
    flexShrink: 1,
  },
  button: {
    backgroundColor: '#198754',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
