import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { FinancialListItem } from '../../src/components/common/FinancialListItem';
import { ThemeContext } from '../../src/store/ThemeContext';

// Mock the theme context values
const mockColors = {
  card: '#ffffff',
  border: '#dddddd',
  primary: '#007AFF',
  text: '#333333',
  textSecondary: '#666666',
  background: '#f9f9f9',
  danger: '#ff4444',
  success: '#00cc88',
};

const ThemeProviderMock = ({ children }: { children: React.ReactNode }) => (
  <ThemeContext.Provider value={{ colors: mockColors, isDark: false, toggleTheme: jest.fn() }}>
    {children}
  </ThemeContext.Provider>
);

describe('FinancialListItem', () => {
  it('renders correctly with required props', () => {
    const { getByText } = render(
      <ThemeProviderMock>
        <FinancialListItem title="Test Item" amountText="₹1,000" />
      </ThemeProviderMock>,
    );

    expect(getByText('Test Item')).toBeTruthy();
    expect(getByText('₹1,000')).toBeTruthy();
  });

  it('renders correctly with icon and subtitle', () => {
    const { getByText } = render(
      <ThemeProviderMock>
        <FinancialListItem
          title="Dinner"
          subtitle="Food & Drinks"
          amountText="₹500"
          icon="restaurant"
        />
      </ThemeProviderMock>,
    );

    expect(getByText('Dinner')).toBeTruthy();
    expect(getByText('Food & Drinks')).toBeTruthy();
  });

  it('calls onPress when clicked', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <ThemeProviderMock>
        <FinancialListItem title="Clickable" amountText="₹0" onPress={onPressMock} />
      </ThemeProviderMock>,
    );

    fireEvent.press(getByText('Clickable'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('renders children if provided', () => {
    const { getByText } = render(
      <ThemeProviderMock>
        <FinancialListItem title="With Progress" amountText="₹100">
          <Text>Progress Bar Mock</Text>
        </FinancialListItem>
      </ThemeProviderMock>,
    );

    expect(getByText('Progress Bar Mock')).toBeTruthy();
  });
});
