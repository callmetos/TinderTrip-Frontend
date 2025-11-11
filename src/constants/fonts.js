// Font constants for Thai language support
// Using Prompt font family from Google Fonts (@expo-google-fonts/prompt)

export const FONTS = {
  // Font families
  light: 'Prompt_300Light',
  regular: 'Prompt_400Regular',
  medium: 'Prompt_500Medium',
  semiBold: 'Prompt_600SemiBold',
  bold: 'Prompt_700Bold',

  // Text style helpers
  styles: {
    // Headers
    h1: {
      fontFamily: 'Prompt_700Bold',
      fontSize: 32,
      lineHeight: 40,
    },
    h2: {
      fontFamily: 'Prompt_700Bold',
      fontSize: 28,
      lineHeight: 36,
    },
    h3: {
      fontFamily: 'Prompt_600SemiBold',
      fontSize: 24,
      lineHeight: 32,
    },
    h4: {
      fontFamily: 'Prompt_600SemiBold',
      fontSize: 20,
      lineHeight: 28,
    },
    h5: {
      fontFamily: 'Prompt_600SemiBold',
      fontSize: 18,
      lineHeight: 24,
    },
    
    // Body text
    bodyLarge: {
      fontFamily: 'Prompt_400Regular',
      fontSize: 17,
      lineHeight: 24,
    },
    bodyMedium: {
      fontFamily: 'Prompt_400Regular',
      fontSize: 15,
      lineHeight: 22,
    },
    bodySmall: {
      fontFamily: 'Prompt_400Regular',
      fontSize: 13,
      lineHeight: 18,
    },
    
    // Labels
    labelLarge: {
      fontFamily: 'Prompt_600SemiBold',
      fontSize: 16,
      lineHeight: 22,
    },
    labelMedium: {
      fontFamily: 'Prompt_500Medium',
      fontSize: 14,
      lineHeight: 20,
    },
    labelSmall: {
      fontFamily: 'Prompt_500Medium',
      fontSize: 12,
      lineHeight: 16,
    },
    
    // Special
    caption: {
      fontFamily: 'Prompt_400Regular',
      fontSize: 11,
      lineHeight: 14,
    },
    button: {
      fontFamily: 'Prompt_600SemiBold',
      fontSize: 16,
      lineHeight: 22,
      letterSpacing: 0.5,
    },
  }
};

export default FONTS;
