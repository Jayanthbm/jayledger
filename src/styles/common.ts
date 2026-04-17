import { StyleSheet } from 'react-native';

/**
 * Common reusable styles shared across screens and components.
 * Import and spread these instead of writing inline style objects.
 *
 * Usage:
 *   import { common } from '../styles/common';
 *   <View style={common.flex1} />
 *   <View style={[common.flexRowCenter, common.mb16]} />
 */
export const common = StyleSheet.create({
  // ─── Flex ────────────────────────────────────────────────────────
  flex1: { flex: 1 },
  flex0_5: { flex: 0.5 },
  flexCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  flexRow: { flexDirection: 'row' },
  flexRowCenter: { flexDirection: 'row', alignItems: 'center' },
  flexRowCenterGap4: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flexRowCenterGap8: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flexRowCenterGap12: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flexRowFlex1: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  flexRowSpaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flexRowStart: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },

  // ─── Alignment ───────────────────────────────────────────────────
  alignCenter: { alignItems: 'center' },
  alignEnd: { alignItems: 'flex-end' },
  alignStart: { alignItems: 'flex-start' },
  justifyCenter: { justifyContent: 'center' },
  justifyStart: { justifyContent: 'flex-start' },
  selfCenter: { alignSelf: 'center' },

  // ─── Margin Top ──────────────────────────────────────────────────
  mt4: { marginTop: 4 },
  mt8: { marginTop: 8 },
  mt10: { marginTop: 10 },
  mt12: { marginTop: 12 },
  mt16: { marginTop: 16 },
  mt24: { marginTop: 24 },
  mt40: { marginTop: 40 },
  mt60: { marginTop: 60 },

  // ─── Margin Bottom ───────────────────────────────────────────────
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },
  mb16: { marginBottom: 16 },
  mb20: { marginBottom: 20 },
  mb24: { marginBottom: 24 },
  mb32: { marginBottom: 32 },
  mb40: { marginBottom: 40 },

  // ─── Margin Right ────────────────────────────────────────────────
  mr4: { marginRight: 4 },
  mr6: { marginRight: 6 },
  mr8: { marginRight: 8 },
  mr12: { marginRight: 12 },

  // ─── Margin Left ─────────────────────────────────────────────────
  ml4: { marginLeft: 4 },
  ml8: { marginLeft: 8 },
  ml12: { marginLeft: 12 },

  // ─── Padding Bottom ──────────────────────────────────────────────
  pb10: { paddingBottom: 10 },
  pb16: { paddingBottom: 16 },
  pb20: { paddingBottom: 20 },
  pb40: { paddingBottom: 40 },

  // ─── Height spacers ──────────────────────────────────────────────
  h40: { height: 40 },

  // ─── Align + Margin combos ───────────────────────────────────────
  alignCenterMt40: { alignItems: 'center', marginTop: 40 },
  alignCenterMt60: { alignItems: 'center', marginTop: 60 },

  // ─── Text ────────────────────────────────────────────────────────
  textCenter: { textAlign: 'center' },
  textWhiteBold: { color: '#fff', fontWeight: 'bold' },
  textWhiteBold16: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
