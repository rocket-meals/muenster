import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  dayContainer: {
    padding: 10,
  },
  dateHeader: {
    fontSize: 18,
    marginBottom: 8,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    paddingBottom: 10,
    paddingVertical: 10,
    gap: 10,
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  col1: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  col2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heading: {
    fontSize: 18,
    fontFamily: 'Poppins_400Regular',
  },
  foodContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    flexWrap: 'wrap',
    marginTop: 20,
  },
  feebackContainer: {
    width: '100%',
    marginTop: 20,
  },
});
