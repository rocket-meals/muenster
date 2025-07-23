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
    justifyContent: 'space-around',
    marginTop: 20,
  },
  qrCol: {
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
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
});
