import { Button, Text, View } from 'react-native';

import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
   const { login } = useAuth();

   const handleLogin = () => {
      // Simulate login success
      login({ id: 1, name: 'Jayanth Bharadwaj' });
   };

   return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
         <Text style={{ fontSize: 24, marginBottom: 20 }}>Welcome to JayLedger</Text>
         <Button title="Login" onPress={handleLogin} />
      </View>
   );
}
