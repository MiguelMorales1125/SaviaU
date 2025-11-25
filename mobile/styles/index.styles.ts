import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isSmall = width < 640;

export const indexStyles = StyleSheet.create({
 
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
  },

 
  loadingContent: {
    alignItems: 'center',
  },
  loadingLogo: {
    width: 500,
    height: 500,
    marginBottom: 30,
  },
  loadingSpinner: {
    marginVertical: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#6c757d',
    fontWeight: '500',
  },

 
  welcomeContent: {
    alignItems: 'center',
  },
  welcomeLogo: {
    width: 150,
    height: 150,
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 10,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 30,
  },
  welcomeSpinner: {
    marginTop: 20,
  },

  
  header: {
    backgroundColor: '#198754',
    // increase top padding on small devices so header content clears the status bar
    paddingTop: isSmall ? 36 : 50,
    paddingBottom: isSmall ? 12 : 20,
    paddingHorizontal: isSmall ? 8: 12,
    height: isSmall ? 88 : 120,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navLogo: {
    // Mobile: larger so it doesn't overlap status icons; Desktop: revert to original smaller size
    width: isSmall ? 220 : 160,
    height: isSmall ? 100 : 60,
    // enforce minimum sizes for mobile; desktop keeps original minimums
    minWidth: isSmall ? 200 : 160,
    minHeight: isSmall ? 90 : 60,
    // cap maximum so it doesn't grow unreasonably on very wide screens
    maxWidth: 320,
    // small left offset so the logo isn't too close to the screen edge
    marginLeft: -50,
    resizeMode: 'contain',
  },
  navTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  navButtons: {
    flexDirection: 'row',
  },
  navButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  navButtonText: {
    color: '#198754',
    fontWeight: '600',
    fontSize: 16,
  },

  heroSection: {
    backgroundColor: '#ffffff',
    paddingVertical: isSmall ? 36 : 60,
    paddingHorizontal: isSmall ? 18 : 24,
  },
  heroContent: {
    flexDirection: isSmall ? 'column' : 'row',
    alignItems: isSmall ? 'flex-start' : 'center',
    justifyContent: 'space-between',
  },
  heroText: {
    flex: 1,
    paddingRight: isSmall ? 0 : 20,
    marginBottom: isSmall ? 18 : 0,
  },
  heroTitle: {
    fontSize: isSmall ? 28 : 42,
    fontWeight: 'bold',
    color: '#212529',
    lineHeight: isSmall ? 36 : 50,
    marginBottom: 14,
  },
  heroTitleAccent: {
    color: '#198754',
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#6c757d',
    lineHeight: 28,
    marginBottom: 30,
  },
  heroCTA: {
    backgroundColor: '#198754',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  heroCTAText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  heroImage: {
    flex: isSmall ? 0 : 0.5,
    alignItems: 'center',
  },
  heroLogo: {
    width: isSmall ? 140 : 200,
    height: isSmall ? 140 : 200,
    alignSelf: isSmall ? 'center' : 'flex-end',
  },

  
  servicesSection: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 50,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    // gap is not fully supported on all RN versions; use margins on cards instead
  },
  servicesRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    // width is set dynamically via inline style to support responsive columns
    minHeight: 160,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 16,
  },
  serviceCardHover: {
    borderColor: '#198754',
    shadowOpacity: 0.15,
    transform: [{ translateY: -2 }],
  },
  serviceIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceIconText: {
    fontSize: 32,
  },
  serviceContent: {
    alignItems: 'center',
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
    textAlign: 'center',
  },
  serviceDescription: {
    fontSize: 13,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 15,
    opacity: 0,
    maxHeight: 0,
    overflow: 'hidden',
  },
  serviceDescriptionVisible: {
    opacity: 1,
    maxHeight: 60,
  },
  serviceButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'center',
    opacity: 0,
    maxHeight: 0,
    overflow: 'hidden',
    
  },
  serviceButtonVisible: {
    opacity: 1,
    maxHeight: 40,
  },
  serviceButtonText: {
    color: '#ffffff9a',
    fontSize: 12,
    fontWeight: '600',
  },

  
  ctaSection: {
    backgroundColor: '#198754',
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 40,
  },
  ctaDescription: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  ctaButtons: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  ctaPrimaryButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  ctaPrimaryButtonText: {
    color: '#198754',
    fontSize: 16,
    fontWeight: '600',
  },
  ctaSecondaryButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  ctaSecondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  
  footer: {
    backgroundColor: '#212529',
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  footerLogo: {
    width: 200,
    height: 200,
    margin:0
  
  },
  footerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  footerDescription: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 400,
  },
});