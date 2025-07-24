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
  qrRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
  },
  qrCol: {
    alignItems: 'center',
    gap: 5,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  qrImageContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qr: {
    width: 150,
    height: 150,
  },
  urlText: {
    fontSize: 12,
    color: 'gray',
    textAlign: 'center',
  },
  qrButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 18,
    height: 43,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  qrButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
  },
});
