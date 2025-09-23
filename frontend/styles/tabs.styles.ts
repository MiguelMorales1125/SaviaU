import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const cardWidth = (width - 40) / 2;
const availableHeight = height - 150;
const cardHeight = Math.min(110, (availableHeight - 50) / 5);

export const tabsStyles = StyleSheet.create({
  
  homeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#e8fce8',
  },
  homeLogo: {
    width: 180,
    height: 180,
    marginBottom: 24,
  },
  homeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#198754',
    marginBottom: 12,
    textAlign: 'center',
  },
  homeSubtitle: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },


  perfilContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: '#f8f9fa',
  },
  perfilTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#198754',
    marginBottom: 16,
    textAlign: 'center',
  },
  perfilWelcomeText: {
    fontSize: 16,
    color: '#333',
    marginVertical: 16,
    textAlign: 'center',
  },
  perfilLogoutButton: {
    backgroundColor: '#198754',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  perfilLogoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

 
  retosContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: '#f0f8f0',
  },
  retosTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#198754',
    textAlign: 'center',
  },
  retosSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },

  
  tematicasContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  tematicasHeader: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  tematicasModuleTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    letterSpacing: 1,
  },
  tematicasTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    lineHeight: 18,
  },
  tematicasGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  tematicasCard: {
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
  tematicasIconContainer: {
    alignSelf: 'flex-start',
  },
  tematicasTextContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  tematicasCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    lineHeight: 18,
  },
  tematicasCardSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    lineHeight: 18,
    marginTop: 2,
  },
});