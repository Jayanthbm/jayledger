import { StyleSheet } from 'react-native';

/**
 * Common reusable styles shared across screens and components.
 * Import and spread these instead of writing inline style objects.
 *
 * Usage:
 *   import { commonStyles } from '../styles/common';
 *   <View style={commonStyles.flex1} />
 *   <View style={[commonStyles.flexRowCenter, commonStyles.mb16]} />
 */
export const commonStyles = StyleSheet.create({
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
  justifyBetween: { justifyContent: 'space-between' },
  selfCenter: { alignSelf: 'center' },

  // ─── Containers ──────────────────────────────────────────────────
  screenPadding16: { flex: 1, padding: 16 },
  emptyCenterPadded: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyCenterPaddedMt60: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    marginTop: 60,
  },

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
  mr16: { marginRight: 16 },

  // ─── Margin Left ─────────────────────────────────────────────────
  ml4: { marginLeft: 4 },
  ml8: { marginLeft: 8 },
  ml12: { marginLeft: 12 },

  // ─── Padding Bottom ──────────────────────────────────────────────
  pb10: { paddingBottom: 10 },
  pb16: { paddingBottom: 16 },
  pb20: { paddingBottom: 20 },
  pb24: { paddingBottom: 24 },
  pb40: { paddingBottom: 40 },

  // ─── List Content ────────────────────────────────────────────────
  listContent16: { padding: 16 },
  listContent16T4B40: { padding: 16, paddingTop: 4, paddingBottom: 40 },
  listContent16T4B120: { padding: 16, paddingTop: 4, paddingBottom: 120 },
  modalListContent: { paddingBottom: 40, paddingHorizontal: 10 },

  // ─── Height spacers ──────────────────────────────────────────────
  h40: { height: 40 },

  // ─── Align + Margin combos ───────────────────────────────────────
  alignCenterMt40: { alignItems: 'center', marginTop: 40 },
  alignCenterMt60: { alignItems: 'center', marginTop: 60 },

  // ─── Text ────────────────────────────────────────────────────────
  textCenter: { textAlign: 'center' },
  bold: { fontWeight: 'bold' },
  textBold600: { fontWeight: '600' },
  textWhiteBold: { color: '#fff', fontWeight: 'bold' },
  textWhiteBold16: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  navHeaderTitle: { fontSize: 17, fontWeight: '700' },
  navHeaderSubtitle: { fontSize: 10 },
  title16Bold: { fontSize: 16, fontWeight: 'bold' },
  label13Semi: { fontSize: 13, fontWeight: '600' },
  label14Semi: { fontSize: 14, fontWeight: '600' },
  label14SemiCentered: { fontSize: 14, textAlign: 'center', fontWeight: '600' },
  emptyTitle20Bold: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptySub14Centered: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  emptyText16Centered: { textAlign: 'center', marginTop: 12, fontSize: 16 },
  sortCaption: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowLabelTiny: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  rowValue20Heavy: { fontSize: 20, fontWeight: '800' },
  progressSubTiny: { fontSize: 8, fontWeight: '800', letterSpacing: 1 },

  // ─── Headers ─────────────────────────────────────────────────────
  headerTitleContainer: { alignItems: 'flex-start' },
  headerRightBtn: {
    paddingRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTools: { padding: 16, paddingTop: 8, zIndex: 10 },
  headerControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  captionRow: { marginTop: 4, alignItems: 'flex-end' },
  captionRowT2: { marginTop: 2, alignItems: 'flex-end' },

  // ─── Form Controls ───────────────────────────────────────────────
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  inputLabelCompact: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginLeft: 4 },
  inputField50: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputField50Round16: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },

  // ─── Components ──────────────────────────────────────────────────
  sortButton: {
    width: 64,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton44: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearOutlineButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 20,
    marginTop: 12,
  },
  saveButton: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  saveButton54R12Mt16: {
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  saveButton54R12Mt32: {
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  disabledButton: { opacity: 0.5 },
  pickerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  pickerItemRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerItemRowBetweenCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerText: { fontSize: 16, fontWeight: '500' },
  pickerTextSemi: { fontSize: 16, fontWeight: '600' },
  circularContainer: {
    marginLeft: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const common = commonStyles;
