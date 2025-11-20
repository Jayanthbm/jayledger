// src/screens/Transactions/TransactionsScreen.js

import { TouchableHighlight, View } from 'react-native';

import AppBar from '../components/app/AppBar';
import PageHeader from '../components/app/PageHeader';
import React from 'react';
import RowText from '../components/core/RowText';
import SearchBar from '../components/app/SearchBar';
import SwipeableListItem from '../components/core/SwipeableListItem';

const TransactionsScreen = ({ route }) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  return (
    <>
      <AppBar
        title={null}
        showSearch={true}
        onSearch={setSearchQuery}
        searchValue={searchQuery}
        onSearchClear={() => setSearchQuery('')}
      />
      <PageHeader title="Transactions" />
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
