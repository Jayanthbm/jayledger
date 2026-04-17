import { StyleSheet, ViewStyle } from 'react-native';
import { typography } from './typography';
import { spacing } from './spacing';
import { layout } from './layout';

/**
 * Common reusable styles shared across screens and components.
 * This file now acts as a hub for modularized design tokens.
 */
export const commonStyles = StyleSheet.create({
  // Re-exporting Layout tokens
  ...layout,

  // Re-exporting Spacing tokens
  ...spacing,

  // Re-exporting Typography tokens
  ...typography,

  // ─── Specialized Component Styles ──────────────────────────────
  // These are often combinations of layout, spacing, and typography
  // or specific to certain UI patterns.

  listContent16T4B40: {
    ...spacing.p16,
    paddingTop: 4,
    paddingBottom: 40,
  } as ViewStyle,
  listContent16T4B120: {
    ...spacing.p16,
    paddingTop: 4,
    paddingBottom: 120,
  } as ViewStyle,
  modalListContent: {
    paddingBottom: 40,
    paddingHorizontal: 10,
  } as ViewStyle,

  // Forms
  inputField50: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  } as ViewStyle,
  inputField50Round16: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  } as ViewStyle,

  // Buttons
  sortButton: {
    width: 64,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  iconButton44: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  clearOutlineButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 20,
    marginTop: 12,
  } as ViewStyle,
  saveButton: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  } as ViewStyle,
  saveButton54R12Mt16: {
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  } as ViewStyle,
  saveButton54R12Mt32: {
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  } as ViewStyle,
  disabledButton: { opacity: 0.5 } as ViewStyle,

  // Headers
  headerTitleContainer: { alignItems: 'flex-start' } as ViewStyle,
  headerRightBtn: {
    paddingRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  headerTools: { padding: 16, paddingTop: 8, zIndex: 10 } as ViewStyle,
  headerControls: { flexDirection: 'row', alignItems: 'center', gap: 12 } as ViewStyle,
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 } as ViewStyle,
  captionRow: { marginTop: 4, alignItems: 'flex-end' } as ViewStyle,
  captionRowT2: { marginTop: 2, alignItems: 'flex-end' } as ViewStyle,

  // Specialized Rows
  pickerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  } as ViewStyle,
  pickerItemRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  } as ViewStyle,
  pickerItemRowBetweenCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  } as ViewStyle,
});

export const common = commonStyles;
export { typography } from './typography';
export { spacing } from './spacing';
export { layout } from './layout';
