import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { DriverButtonProps } from '../../types';
import { theme } from '../../constants/theme';

const DriverButton: React.FC<DriverButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  disabled = false,
  loading = false,
  icon,
}) => {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
  ];

  const textStyle = [
    styles.baseText,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
  ];

  const handlePress = () => {
    if (!disabled && !loading) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{
        disabled: disabled || loading,
      }}
      accessibilityHint={`${variant} button. ${disabled ? 'Currently disabled.' : 'Double tap to activate.'}`}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'secondary' ? theme.colors.text.primary : theme.colors.text.inverse}
            style={styles.loader}
          />
        ) : null}
        {icon && !loading ? (
          <Text style={[textStyle, styles.icon]} accessibilityLabel={`${icon} icon`}>
            {icon}
          </Text>
        ) : null}
        <Text style={textStyle} numberOfLines={1} adjustsFontSizeToFit>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.components.button.borderRadius,
    paddingHorizontal: theme.components.button.padding.horizontal,
    paddingVertical: theme.components.button.padding.vertical,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: theme.accessibility.minTouchTarget.width,
    // Elevation for Android
    elevation: 2,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  } as ViewStyle,

  // Size variants
  medium: {
    height: theme.components.button.height.medium,
    paddingHorizontal: theme.spacing[4],
  } as ViewStyle,

  large: {
    height: theme.components.button.height.large,
    paddingHorizontal: theme.spacing[6],
  } as ViewStyle,

  // Color variants
  primary: {
    backgroundColor: theme.colors.primary[500],
    borderWidth: 2,
    borderColor: theme.colors.primary[600],
  } as ViewStyle,

  secondary: {
    backgroundColor: theme.colors.gray[500],
    borderWidth: 2,
    borderColor: theme.colors.gray[600],
  } as ViewStyle,

  danger: {
    backgroundColor: theme.colors.danger[500],
    borderWidth: 2,
    borderColor: theme.colors.danger[600],
  } as ViewStyle,

  warning: {
    backgroundColor: theme.colors.warning[500],
    borderWidth: 2,
    borderColor: theme.colors.warning[600],
  } as ViewStyle,

  disabled: {
    backgroundColor: theme.colors.gray[600],
    borderColor: theme.colors.gray[700],
    opacity: 0.6,
  } as ViewStyle,

  // Text styles
  baseText: {
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
    includeFontPadding: false,
  } as TextStyle,

  mediumText: {
    fontSize: theme.components.button.typography.medium.fontSize,
  } as TextStyle,

  largeText: {
    fontSize: theme.components.button.typography.large.fontSize,
  } as TextStyle,

  // Text color variants
  primaryText: {
    color: theme.colors.text.inverse,
  } as TextStyle,

  secondaryText: {
    color: theme.colors.text.primary,
  } as TextStyle,

  dangerText: {
    color: theme.colors.text.inverse,
  } as TextStyle,

  warningText: {
    color: theme.colors.text.inverse,
  } as TextStyle,

  disabledText: {
    color: theme.colors.text.tertiary,
  } as TextStyle,

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  loader: {
    marginRight: theme.spacing[2],
  } as ViewStyle,

  icon: {
    marginRight: theme.spacing[2],
  } as TextStyle,
});

export default DriverButton;