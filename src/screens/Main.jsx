import { ScrollView, StyleSheet, View } from 'react-native';

import AnimatedCircularProgress from '../components/core/AnimatedCircularProgress';
import Button from '../components/core/Button';
import Card from '../components/core/Card';
import Divider from '../components/core/Divider';
import FontAwesome from '@react-native-vector-icons/fontawesome';
import Loader from '../components/core/Loader';
import Penatagon from '../assets/shapes/Pentagon';
import ProgressBar from '../components/core/ProgressBar';
import React from 'react';
import RowText from '../components/core/RowText'
import { SafeAreaView } from 'react-native-safe-area-context';
import Skeleton from '../components/core/Skeleton';
import Spinner from '../assets/shapes/Spinner';
import SwipeableListItem from '../components/core/SwipeableListItem';
import Text from '../components/core/Text';
import Triangle from '../assets/shapes/Triangle';
import { useTheme } from '../theme/ThemeContext';

export default function Main() {
   const { theme, toggleTheme } = useTheme();

   return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
         <ScrollView>
            <View style={{ marginLeft: 10, marginRight: 10 }}>
               <Text variant="headingLarge">JayLedger 💰</Text>
               <Text variant="subtitle">Track your expenses easily</Text>

               <Penatagon width={40} height={40} color={theme.colors.spinnerColor} />
               <Spinner width={40} height={40} color={theme.colors.spinnerColor} />
               <Triangle width={40} height={40} color={theme.colors.spinnerColor} />

               <Text variant="bodyLarge">Current Theme: {theme.mode}</Text>

               <Button title="Toggle Theme" onPress={toggleTheme} />

               <Loader inline size="medium" position="center" text="Please wait..." />
               <Loader size='large' text="Loading..." />
               <Loader inline size="small" text="Loading..." />
               <View style={{ marginTop: 10 }}>
                  <Card title="Groceries" subtitle="Today">
                     <Text style={{ color: theme.colors.onSurface }}>Expense: $50</Text>
                     <Divider />
                     <Text style={{ color: theme.colors.onSurface }}>Category: Food</Text>
                  </Card>
               </View>

               <View style={{ width: '80%', marginVertical: 16 }}>
                  <ProgressBar progress={0.8} height={12} />
               </View>
               <Loader size="large" text="Fetching data..." inline />
               <View style={{ width: '80%', marginVertical: 16 }}>
                  <ProgressBar indeterminate height={10} />
               </View>

               <AnimatedCircularProgress
                  radius={70}
                  strokeWidth={12}
                  currentValue={45}
                  totalValue={100}
                  valuePrefix="%"
                  text="Completed"
               />

               <AnimatedCircularProgress
                  radius={50}
                  strokeWidth={10}
                  currentValue={30}
                  totalValue={50}
                  color="#FF5722"  // custom color
                  showText={true}
               />

               <Skeleton height={25} borderRadius={4} />
               <RowText
                  left="Income"
                  leftSecondary="Last 7 days"
                  leftSecondaryIcon={<FontAwesome name="calendar" size={14} color="#485C91" />}
                  right="$500"
                  rightSecondary="Updated today"
                  rightSecondaryIcon={<FontAwesome name="clock-o" size={14} color="#485C91" />}
               />


               <SwipeableListItem
                  leftActions={[
                     { label: 'Archive', color: '#4CAF50', onPress: () => console.log('Archive pressed') },
                     { label: 'Pin', color: '#FFC107', onPress: () => console.log('Pin pressed') },
                  ]}
                  rightActions={[
                     { label: 'Delete', color: '#F44336', onPress: () => console.log('Delete pressed') },
                  ]}
               >
                  <RowText
                     left="Income"
                     leftSecondary="Last 7 days"
                     leftIcon={<FontAwesome name="rocket" size={20} color="#4CAF50" />}
                     right="$500"
                     rightSecondary="Updated today"
                     rightIcon={<FontAwesome name="arrow-up" size={20} color="#4CAF50" />}
                  />
               </SwipeableListItem>

               <Loader inline text="Saving..." />

            </View>
         </ScrollView>

      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   container: { flex: 1, }
});
