import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const cardWidth = (width - 40) / 2; 
const availableHeight = height - 150;
const cardHeight = Math.min(110, (availableHeight - 50) / 5); 

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
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    lineHeight: 18,
  },
  cardSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    lineHeight: 18,
    marginTop: 2,
  },
});