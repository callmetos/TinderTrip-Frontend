import { useColorScheme } from 'react-native';
import { COLORS as LIGHT } from '../../color/colors.js';

// Provide a dark palette derived from current theme tones
const DARK = {
  ...LIGHT,
  background: '#0B0B0F',
  card: '#0F1115',
  text: '#F3F4F6',
  textLight: '#A4A7AE',
  border: '#20262D',
  shadow: '#000000',
};

export function useColors() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DARK : LIGHT;
}

export function useIsDark() {
  const scheme = useColorScheme();
  return scheme === 'dark';
}
