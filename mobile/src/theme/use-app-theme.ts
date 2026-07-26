import { useColorScheme } from 'react-native';
import { darkColors, lightColors } from './colors';

export function useAppTheme() {
  const scheme = useColorScheme();
  return {
    dark: scheme === 'dark',
    colors: scheme === 'dark' ? darkColors : lightColors,
  };
}
