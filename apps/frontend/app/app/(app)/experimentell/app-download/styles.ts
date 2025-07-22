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
  },
  qr: {
    width: 150,
    height: 150,
  },
  qrDebugWrapper: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    padding: 5,
  },
  uriText: {
    fontSize: 10,
    color: 'gray',
  },
  urlText: {
    fontSize: 12,
    color: 'gray',
    textAlign: 'center',
  },
  debugLogContainer: {
    maxHeight: 100,
    marginTop: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'lightgray',
    padding: 5,
  },
  debugLogText: {
    fontSize: 10,
    color: 'gray',
  },
});
