import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  list: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
  },
  iconContainer: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: 'Poppins_700Bold',
  },
  value: {
    fontFamily: 'Poppins_400Regular',
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
