import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../../constants/theme';

export interface DriverInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
}

const DriverInput: React.FC<DriverInputProps> = ({
  label,
  error,
  required = false,
  containerStyle,
  inputStyle,
  labelStyle,
  onFocus,
  onBlur,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const inputContainerStyle = [
    styles.inputContainer,
    isFocused && styles.inputContainerFocused,
    error && styles.inputContainerError,
  ];

  const inputTextStyle = [
    styles.input,
    inputStyle,
  ];

  const labelTextStyle = [
    styles.label,
    labelStyle,
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={labelTextStyle}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      
      <View style={inputContainerStyle}>
        <TextInput
          {...textInputProps}
          style={inputTextStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={theme.colors.text.tertiary}
          selectionColor={theme.colors.primary[500]}
          accessibilityLabel={label}
          accessibilityRequired={required}
          accessibilityInvalid={!!error}
          accessibilityHint={error || `Enter your ${label.toLowerCase()}`}
        />
      </View>
      
      {error && (
        <Text 
          style={styles.errorText}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing[4],
  } as ViewStyle,

  label: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  } as TextStyle,

  required: {
    color: theme.colors.danger[500],
  } as TextStyle,

  inputContainer: {
    borderWidth: 2,
    borderColor: theme.colors.border.primary,
    borderRadius: theme.components.input.borderRadius,
    backgroundColor: theme.colors.background.secondary,
    minHeight: theme.components.input.height,
  } as ViewStyle,

  inputContainerFocused: {
    borderColor: theme.colors.border.focus,
    shadowColor: theme.colors.primary[500],
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  } as ViewStyle,

  inputContainerError: {
    borderColor: theme.colors.danger[500],
  } as ViewStyle,

  input: {
    flex: 1,
    fontSize: theme.components.input.fontSize,
    color: theme.colors.text.primary,
    padding: theme.components.input.padding,
    textAlignVertical: 'center',
    includeFontPadding: false,
  } as TextStyle,

  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.danger[500],
    marginTop: theme.spacing[1],
    marginLeft: theme.spacing[1],
  } as TextStyle,
});

export default DriverInput;