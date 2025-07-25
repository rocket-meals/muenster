import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  list: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
  },
  col: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    gap: 10,
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
