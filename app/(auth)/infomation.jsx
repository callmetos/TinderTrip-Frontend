import { Text, View } from 'react-native';
import { styles } from '../../assets/styles/info-styles.js';
import { COLORS } from '../../color/colors.js';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import { useAuth } from '../../src/contexts/AuthContext';

export default function InformationScreen() {
  const { user } = useAuth();

  return (
    <ProtectedRoute requireAuth={true}>
      <View style={styles.container}>

          {/* Header */}
          <View style ={{
            backgroundColor: COLORS.redwine,
            height: 100,
            borderRadius: 45,
            


          }}>
            <View style = {styles.headerLeft}>
              
              <View style = {styles.welcomeContainer}>
                <Text style = {styles.welcomeText}>Welcome,</Text>
                <Text style = {styles.usernameText}>
                  {user?.display_name || user?.email?.split("@")[0] || 'User'}
                </Text>
              </View>
            </View>
          </View>
    

        <Text style={styles.title}>Information</Text>
        <Text style={styles.subtitle}>This is the information page</Text>
      </View>
    </ProtectedRoute>
  );
}