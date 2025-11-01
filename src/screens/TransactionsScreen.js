// src/screens/Transactions/TransactionsScreen.js

import { Pressable, TouchableHighlight, View } from 'react-native';

import AppBar from '../components/app/AppBar';
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons";
import PageHeader from '../components/app/PageHeader';
import React from 'react';
import RowText from '../components/core/RowText';
import SearchBar from '../components/app/SearchBar';
import SwipeableListItem from '../components/core/SwipeableListItem';
import { useTheme } from '../context/ThemeContext';

const TransactionsScreen = () => {
   const { theme, toggleTheme } = useTheme();
   const [searchQuery, setSearchQuery] = React.useState('');

   return (
      <>
         <AppBar
            centerContent={
            <SearchBar
               placeholder="Search transactions"
               value={searchQuery}
               onChangeText={setSearchQuery}
               onClear={() => setSearchQuery("")}
            />
         }
            rightContent={
               <Pressable onPress={toggleTheme}>
                  <MaterialDesignIcons
                     name="theme-light-dark"
                     size={22}
                     color={theme.colors.onSurface}
                  />
               </Pressable>
            }
         >

         </AppBar>
         <PageHeader title='Transactions' />
         <View>
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