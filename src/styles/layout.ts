import { ViewStyle } from 'react-native';

/**
 * Layout and Flexbox design tokens.
 */
export const layout = {
  flex1: { flex: 1 } as ViewStyle,
  flex0_5: { flex: 0.5 } as ViewStyle,
  flexCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' } as ViewStyle,
  flexRow: { flexDirection: 'row' } as ViewStyle,
  flexRowCenter: { flexDirection: 'row', alignItems: 'center' } as ViewStyle,
  flexRowCenterGap4: { flexDirection: 'row', alignItems: 'center', gap: 4 } as ViewStyle,
  flexRowCenterGap8: { flexDirection: 'row', alignItems: 'center', gap: 8 } as ViewStyle,
  flexRowCenterGap12: { flexDirection: 'row', alignItems: 'center', gap: 12 } as ViewStyle,
  flexRowFlex1: { flexDirection: 'row', alignItems: 'center', flex: 1 } as ViewStyle,
  flexRowSpaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  flexRowStart: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  } as ViewStyle,
  alignCenter: { alignItems: 'center' } as ViewStyle,
  alignEnd: { alignItems: 'flex-end' } as ViewStyle,
  alignStart: { alignItems: 'flex-start' } as ViewStyle,
  justifyCenter: { justifyContent: 'center' } as ViewStyle,
  justifyStart: { justifyContent: 'flex-start' } as ViewStyle,
  justifyBetween: { justifyContent: 'space-between' } as ViewStyle,
  selfCenter: { alignSelf: 'center' } as ViewStyle,

  // Containers
  screenPadding16: { flex: 1, padding: 16 } as ViewStyle,
  emptyCenterPadded: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  } as ViewStyle,

  // Combos
  alignCenterMt40: { alignItems: 'center', marginTop: 40 } as ViewStyle,
  alignCenterMt60: { alignItems: 'center', marginTop: 60 } as ViewStyle,

  // List items
  listContent16: { padding: 16 } as ViewStyle,
};
