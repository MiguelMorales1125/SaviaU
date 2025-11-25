import { StyleSheet } from 'react-native';

export const resetStyles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: '#0b0b0b',
    textAlign: 'center'
  },
  subtitle: {
    marginBottom: 8,
    fontWeight: '600',
    color: '#ddd'
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#198754',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#f8fffe',
    minHeight: 50,
  },
  errorText: {
    color: '#ff6b6b',
    marginBottom: 8,
  },
  successText: {
    color: '#bff0d6',
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#198754',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    minHeight: 50,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  linkButton: {
    padding: 10,
    justifyContent: 'center',
  },
  linkText: {
    color: '#198754',
  },
  logo: {
    width: 225,
    height: 225,
    marginBottom: -40,
    alignSelf: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: '#198754',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    minHeight: 50,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
