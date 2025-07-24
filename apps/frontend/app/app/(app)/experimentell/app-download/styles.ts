import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {},
  content: {
    width: '100%',
    height: '100%',
    padding: 20,
    alignItems: 'center',
  },
  heading: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    marginVertical: 10,
    textAlign: 'center',
  },
  icon: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  cardsContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: 10,
    marginTop: 20,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
});
