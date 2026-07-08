import { useState, useCallback } from 'react';

export const useTransactionDateTime = (initialDate?: Date) => {
  const [date, setDate] = useState<Date>(initialDate || new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleDateChange = useCallback((event: unknown, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  }, []);

  const handleTimeChange = useCallback((event: unknown, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) setDate(selectedTime);
  }, []);

  return {
    date,
    setDate,
    showDatePicker,
    setShowDatePicker,
    handleDateChange,
    showTimePicker,
    setShowTimePicker,
    handleTimeChange,
  };
};
