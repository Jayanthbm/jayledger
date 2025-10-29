// src/screens/Transactions/TransactionsScreen.js

import { TouchableHighlight, View } from 'react-native';

import AppBar from '../components/app/AppBar';
import { MAINSTYLE } from '../styles/style';
import MainTabs from '../navigation/MainTabs';
import React from 'react';
import RowText from '../components/core/RowText';
import SwipeableListItem from '../components/core/SwipeableListItem';

const TransactionsScreen = () => {
   return (
      <>
         <AppBar title='Transactions' />
         <View style={MAINSTYLE}>
            <TouchableHighlight>
               <SwipeableListItem
                  rightActions={[
                     { label: 'Delete', color: '#F44336', onPress: () => console.log('Delete pressed') },
                     { label: 'Edit', color: '#FFC107', onPress: () => console.log('Edit pressed') },
                  ]}
               >
                  <RowText
                     left="Bills"
                     leftSecondary="Tata Play"
                     right="200"
                     rightSecondary="26 oct 2025 10:18 PM"

                  />
               </SwipeableListItem>
            </TouchableHighlight>

         </View>

      </>
   );
};

export default TransactionsScreen;