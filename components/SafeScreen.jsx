import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from "../color/colors.js";

const SafeScreen = ({children}) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style = {{flex: 1, backgroundColor: COLORS.background}}>
      {/* Background layer - เต็มหน้าจอ */}
      <View style = {{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: COLORS.background
      }} />
      
      {/* Content layer - ป้องกัน safe area */}
      <View style = {{
        flex: 1,
        paddingTop: insets.top,
        
        
      }}>
        {children}
      </View>
      
    </View>
  )
}

export default SafeScreen  