import AppBar from '../components/app/AppBar';
import Card from '../components/core/Card';
import React from 'react';
import RowText from '../components/core/RowText';
import SwipeableListItem from '../components/core/SwipeableListItem';
import { View } from 'react-native';

const GoalsScreen = () => {
   return (
      <>
         <AppBar title='Goals' />
         <View >
            <SwipeableListItem
               rightActions={[
                  { label: 'Delete', color: '#F44336', onPress: () => console.log('Delete pressed') },
                  { label: 'Edit', color: '#FFC107', onPress: () => console.log('Edit pressed') },
               ]}
               style={{ marginBottom: 5 }}
            >
               <Card title={"Shopping"}>

               </Card>
               <RowText
                  left="5 days Left"
                  right="-24%"
               />

            </SwipeableListItem>
         </View>

      </>
   );
};

export default GoalsScreen;