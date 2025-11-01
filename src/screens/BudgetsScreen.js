import { Pressable, View } from 'react-native';
import React, { useState } from 'react';

import AppBar from '../components/app/AppBar';
import Button from '../components/core/Button';
import Card from '../components/core/Card';
import PageHeader from '../components/app/PageHeader';
import RowText from '../components/core/RowText';
import SwipeableListItem from '../components/core/SwipeableListItem';
import { useNavigation } from '@react-navigation/native';

const BudgetsScreen = ({ route }) => {
   const [view, setView] = useState('list')
   const navigation = useNavigation();
   const [title, setTitle] = useState('Budgets');

   const onBudgetClick = () => {
      setTitle('Shopping');
      setView('single');
   }

   const onBackBudget = () => {
      setTitle('Budgets');
      setView('list');
   }

   return (
      <>
         <AppBar title={title} />
         <PageHeader title={title} />
         <View>
            {view === 'list' ? (
               <>
                  <Pressable onPress={onBudgetClick}>
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
                  </Pressable>
                  <Pressable onPress={onBudgetClick}>
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
                  </Pressable>
               </>
            ) : (<>
               <Pressable onPress={onBackBudget}>
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
               </Pressable>
               <Button title={"View Transactions"}
                  onPress={() => navigation.navigate('Transactions')}
               />
            </>)}
         </View>
      </>
   );
};

export default BudgetsScreen;