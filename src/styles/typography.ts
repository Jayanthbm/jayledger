import { TextStyle } from 'react-native';

/**
 * Typography design tokens.
 */
export const typography = {
  textCenter: { textAlign: 'center' } as TextStyle,
  bold: { fontWeight: 'bold' } as TextStyle,
  textBold600: { fontWeight: '600' } as TextStyle,
  textWhiteBold: { color: '#fff', fontWeight: 'bold' } as TextStyle,
  textWhiteBold16: { color: '#fff', fontWeight: 'bold', fontSize: 16 } as TextStyle,
  navHeaderTitle: { fontSize: 17, fontWeight: '700' } as TextStyle,
  navHeaderSubtitle: { fontSize: 10 } as TextStyle,
  title16Bold: { fontSize: 16, fontWeight: 'bold' } as TextStyle,
  label13Semi: { fontSize: 13, fontWeight: '600' } as TextStyle,
  label14Semi: { fontSize: 14, fontWeight: '600' } as TextStyle,
  label14SemiCentered: { fontSize: 14, textAlign: 'center', fontWeight: '600' } as TextStyle,
  emptyTitle20Bold: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  } as TextStyle,
  emptySub14Centered: { fontSize: 14, textAlign: 'center', marginBottom: 16 } as TextStyle,
  emptyText16Centered: { textAlign: 'center', marginTop: 12, fontSize: 16 } as TextStyle,
  sortCaption: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  rowLabelTiny: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  } as TextStyle,
  rowValue20Heavy: { fontSize: 20, fontWeight: '800' } as TextStyle,
  progressSubTiny: { fontSize: 8, fontWeight: '800', letterSpacing: 1 } as TextStyle,
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' } as TextStyle,
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 } as TextStyle,
  inputLabelCompact: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 4,
  } as TextStyle,
  pickerText: { fontSize: 16, fontWeight: '500' } as TextStyle,
  pickerTextSemi: { fontSize: 16, fontWeight: '600' } as TextStyle,
};
