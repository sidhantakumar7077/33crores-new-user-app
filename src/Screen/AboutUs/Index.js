import { SafeAreaView, StyleSheet, Text, View, TextInput, TouchableOpacity, TouchableHighlight, Dimensions, Image, Modal, Alert, ScrollView, FlatList, RefreshControl } from 'react-native'
import React, { useEffect, useState } from 'react'
import { WebView } from 'react-native-webview';
// import Feather from 'react-native-vector-icons/Feather';

const Index = (props) => {
  return (
    <SafeAreaView style={{ flex: 1, flexDirection: 'column' }}>
      {/* <View style={styles.headerPart}>
        <TouchableOpacity onPress={() => props.navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Feather name="chevron-left" color={'#555454'} size={30} />
          <Text style={{ color: '#000', fontSize: 16, fontWeight: '500', marginBottom: 3, marginLeft: 5 }}>Profile</Text>
        </TouchableOpacity>
      </View> */}
      <View style={{ flex: 1 }}>
        <WebView source={{ uri: 'https://pandit.33crores.com/about-us' }} style={{ flex: 1 }} />
      </View>
    </SafeAreaView>
  )
}

export default Index

const styles = StyleSheet.create({
  headerPart: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 13,
    paddingHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 13,
    elevation: 5
  },
})