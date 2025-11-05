// src/screens/CategoriesScreen.js

import { Alert, FlatList, ScrollView, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { deleteCategoryFromSupabase, pushUnsyncedCategories, syncCategories } from "../database/categories/categorySync";

import AppBar from '../components/app/AppBar';
import CategoryFormModal from "../components/app/CategoryFormModal";
import { CategoryModel } from "../database/categories/categoryModel";
import FABButton from "../components/app/FABButton";
import IconButton from "../components/core/IconButton";
import NetInfo from "@react-native-community/netinfo";
import NoDataCard from '../components/app/NoDataCard';
import PageHeader from '../components/app/PageHeader';
import ReportListCard from '../components/app/ReportListCard';
import SearchBar from '../components/app/SearchBar';
import SwipeableListItem from '../components/core/SwipeableListItem';
import ViewModeToggle from '../components/app/ViewModeToggle';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const CategoriesScreen = () => {
   const { user } = useAuth();
   const { theme } = useTheme()
   const [loading, setLoading] = useState(true);
   const [categories, setCategories] = useState([]);
   const [searchQuery, setSearchQuery] = useState("");
   const [viewMode, setViewMode] = useState("list");

   const [modalVisible, setModalVisible] = useState(false);
   const [editCategory, setEditCategory] = useState(null);

   const [loaded, setLoaded] = useState(false);

   const reSyncCategories = async () => {
      setLoading(true);
      await pushUnsyncedCategories(user.id);
      await syncCategories(user.id);
      await loadCategories();
      setLoading(false);
   };

   const loadCategories = async () => {
      const data = await CategoryModel.getAll(user.id);
      setCategories(data);
      setLoading(false);
   };

   useEffect(() => {
      (async () => {
         await loadCategories();
         setLoaded(true);
      })();
   }, [user]);


   const handleDelete = async (id) => {
      Alert.alert("Confirm Delete", "Are you sure you want to delete this category?", [
         { text: "Cancel", style: "cancel" },
         {
            text: "Yes",
            onPress: async () => {
               try {
                  const isOnline = (await NetInfo.fetch()).isConnected;

                  // Delete remotely if online
                  if (isOnline) {
                     const success = await deleteCategoryFromSupabase(id, user.id);
                     if (!success) {
                        console.warn("⚠️ Category deleted locally but not from Supabase");
                     }
                  } else {
                     console.log("📴 Offline — skipped Supabase delete");
                  }

                  // Always delete locally first
                  CategoryModel.delete(id);
                  await loadCategories();
               } catch (error) {
                  console.error("❌ Delete error:", error);
               }
            },
         },
      ]);
   };

   const handleAddEdit = async ({ name, type }) => {
      setModalVisible(false);
      const isOnline = (await NetInfo.fetch()).isConnected;

      if (editCategory) {
         CategoryModel.update(
            editCategory.id,
            name,
            type,
            editCategory.icon,
            editCategory.app_icon,
            false
         );
         if (isOnline) {
            await pushUnsyncedCategories(user.id);
         }
      } else {
         CategoryModel.insert(user.id, name, type, null, null, false);
         if (isOnline) {
            await pushUnsyncedCategories(user.id);
         }
      }


      await loadCategories();
      setEditCategory(null);
   };

   const filteredCategories = categories.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
   });


   return (
      <>
         <AppBar
            centerContent={
               <SearchBar
                  placeholder="Search categories"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onClear={() => setSearchQuery("")}
                  disabled={!loaded || loading}
               />
            }
            rightContent={
               <IconButton
                  iconName="sync"
                  mode="filled" size={25}
                  type="primary"
                  onPress={reSyncCategories}
                  disabled={!loaded || loading}
               />
            }
            loading={loading}
         />
         <PageHeader title="Categories">
            <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
         </PageHeader>
         {loaded && filteredCategories.length === 0 ? (
            <NoDataCard
               title="No category found"
               icon="text-search"
               actionLabel="Clear Search"
               onActionPress={() => setSearchQuery("")}
            />
         ) : viewMode === "list" ? (<ScrollView
            contentContainerStyle={{ paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
         >
            {filteredCategories.map((item, index) => (
               <SwipeableListItem
                  key={index}
                  rightActions={[
                     {
                        label: "Edit",
                        color: theme.colors.income,
                        onPress: () => {
                           setEditCategory(item);
                           setModalVisible(true);
                        },
                     },
                     {
                        label: "Delete",
                        color: theme.colors.error,
                        onPress: () => handleDelete(item.id),
                     },
                  ]}
                  style={{
                     width: 80,
                     height: 70
                  }}
               >
                  <ReportListCard
                     key={index}
                     title={item.name}
                     description={item.type}
                     icon={item.app_icon}
                     disabled={true}
                  />
               </SwipeableListItem>

            ))}
         </ScrollView>) : (
            <FlatList
               data={filteredCategories}
               keyExtractor={(item, index) => index.toString()}
               numColumns={2}
               showsVerticalScrollIndicator={false}
               columnWrapperStyle={{
                  justifyContent: "space-between",
                  paddingHorizontal: 8,
               }}
               contentContainerStyle={{ paddingBottom: 80, paddingTop: 4 }}
               renderItem={({ item }) => (
                  <View style={{ flex: 0.5, padding: 4 }}>
                     <ReportListCard
                        title={item.name}
                        description={item.type}
                        icon={item.app_icon}
                        disabled={true}
                        compact
                     />
                  </View>
               )}
            />
         )

         }
         <FABButton onPress={() => setModalVisible(true)} hidden={loading} />

         <CategoryFormModal
            visible={modalVisible}
            onClose={() => {
               setModalVisible(false);
               setEditCategory(null);
            }}
            onSubmit={handleAddEdit}
            initialData={editCategory}
         />


      </>
   );
};

export default CategoriesScreen;