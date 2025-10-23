// src/screens/OverView/OverviewScreen.js

import { Text, View } from 'react-native';

import Button from '../../components/core/Button';
import Loader from '../../components/core/Loader';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

const OverviewScreen = () => {
   const { logout } = useAuth();
   return (
      <SafeAreaView>
         <View>
            <Button title={"Logout"} onPress={logout} />
            <Loader inline position='center' />
         </View>
      </SafeAreaView>
   );
};

export default OverviewScreen;