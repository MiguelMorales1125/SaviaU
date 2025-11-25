import { StyleSheet } from 'react-native';

export const tematicasStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F7F3'
  },
  scrollArea: {
    paddingBottom: 80
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24
  },
  modulePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E3F4E7',
    color: '#1F8A70',
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
    letterSpacing: 1
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    color: '#143642',
    marginTop: 12
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#4A6572',
    marginTop: 8
  },
  areaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 14
  },
  areaCard: {
    width: '48%',
    maxWidth: 320,
    aspectRatio: 0.88,
    borderRadius: 18,
    marginBottom: 14,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    backgroundColor: '#ffffff',
    justifyContent: 'space-between'
  },
  areaCardImage: {
    height: '42%',
    borderRadius: 14,
    marginBottom: 10
  },
  areaCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B3C49'
  },
  areaCardSummary: {
    fontSize: 13,
    color: '#335861',
    marginTop: 4
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6
  },
  badge: {
    fontSize: 11,
    color: '#0B3C49',
    backgroundColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 4
  },
  detailContainer: {
    paddingHorizontal: 20,
    paddingBottom: 60,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%'
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#E8F4EC'
  },
  backButtonText: {
    color: '#1F8A70',
    fontWeight: '700'
  },
  heroCard: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6
  },
  heroImage: {
    width: '100%',
    height: 220
  },
  heroContent: {
    padding: 20
  },
  heroTagline: {
    fontSize: 20,
    color: '#0B3C49',
    fontWeight: '700'
  },
  heroSummary: {
    fontSize: 15,
    color: '#516B76',
    marginTop: 8
  },
  focusLabel: {
    fontSize: 13,
    color: '#1F8A70',
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600'
  },
  focusChip: {
    backgroundColor: '#F1F7F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
    color: '#1F8A70',
    fontSize: 12,
    fontWeight: '600'
  },
  resourceCard: {
    borderRadius: 24,
    backgroundColor: '#ffffff',
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    overflow: 'hidden'
  },
  resourceImage: {
    width: '100%',
    height: 180
  },
  resourceBody: {
    padding: 20
  },
  resourceTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  resourceTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    color: '#143642'
  },
  resourceMeta: {
    fontSize: 12,
    color: '#4A6572',
    marginTop: 4
  },
  resourceShort: {
    fontSize: 14,
    color: '#4A6572',
    marginTop: 12
  },
  expandHint: {
    fontSize: 13,
    color: '#1F8A70',
    marginTop: 12,
    fontWeight: '600'
  },
  detailText: {
    fontSize: 14,
    color: '#2F4858',
    lineHeight: 20,
    marginTop: 16
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorText: {
    textAlign: 'center',
    color: '#B00020',
    marginTop: 12
  },
  articleCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16
  },
  articleCTAText: {
    color: '#1F8A70',
    fontWeight: '700'
  },
  articleBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  articleHeroCard: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6
  },
  articleDetailTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0B3C49',
    marginBottom: 8
  },
  articleFunFactCard: {
    backgroundColor: '#FFF2D5',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20
  },
  articleFunFactLabel: {
    fontSize: 13,
    color: '#BF7000',
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  articleFunFactText: {
    fontSize: 15,
    color: '#8C4A00',
    marginTop: 8,
    lineHeight: 20
  },
  articleSectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F8A70',
    marginTop: 24,
    marginBottom: 12
  },
  articleBodyText: {
    fontSize: 15,
    color: '#2F4858',
    lineHeight: 22,
    marginBottom: 12
  },
  articleSourceItem: {
    fontSize: 13,
    color: '#1F487E',
    marginTop: 6,
    textDecorationLine: 'underline'
  }
});
