import { StyleSheet } from 'react-native';

export const resetStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  wrapper: {
    maxWidth: 700,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#444',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    color: '#000'
  },
  errorText: {
    color: '#c00',
    marginBottom: 8,
  },
  successText: {
    color: '#0a0',
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#198754',
    padding: 10,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  linkButton: {
    padding: 10,
    justifyContent: 'center',
  },
  linkText: {
    color: '#666',
  },
});
