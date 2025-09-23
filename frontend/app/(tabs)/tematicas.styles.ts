import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const cardWidth = (width - 50) / 2; // Reducir márgenes
const availableHeight = height - 150; // Altura disponible después del header
const cardHeight = Math.min(95, (availableHeight - 60) / 5); // 5 filas, altura máxima 95 

export const tematicasStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  moduleTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    letterSpacing: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    lineHeight: 18,
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  card: {
    width: cardWidth,
    height: cardHeight,
    borderRadius: 10,
    marginBottom: 6,
    padding: 12,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    alignSelf: 'flex-start',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    lineHeight: 16,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    lineHeight: 16,
    marginTop: 1,
  },
});