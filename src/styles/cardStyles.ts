import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

/**
 * Standardized card style tokens for a premium, consistent look across the app.
 */
export const cardStyles = StyleSheet.create({
  /**
   * Base card container with standard radius, border, and spacing.
   */
  container: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 12,
  } as ViewStyle,

  /**
   * Main featured card with shadow/elevation.
   */
  main: {
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  } as ViewStyle,

  /**
   * Standardized header for cards with icon and titles.
   */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  } as ViewStyle,

  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  } as ViewStyle,

  /**
   * Card Typography
   */
  title: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  } as TextStyle,

  subtitle: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  } as TextStyle,

  /**
   * Budget/Goal specific additions
   */
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  } as ViewStyle,

  amountLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,

  amountValue: {
    fontSize: 18,
    fontWeight: '800',
  } as TextStyle,
});
