import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  StatusBar,
  FlatList
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Fontisto from 'react-native-vector-icons/Fontisto';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { base_url } from '../../../App';

const Index = () => {

  const navigation = useNavigation();
  const [spinner, setSpinner] = useState(false);
  const [addAddressModal, setAddAddressModal] = useState(false);
  const [allAddresses, setAllAddresses] = useState([]);
  const [isFocused, setIsFocused] = useState(false);

  const getAllAddress = async () => {
    var access_token = await AsyncStorage.getItem('storeAccesstoken');
    try {
      setSpinner(true);
      const response = await fetch(base_url + 'api/mngaddress', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },
      });
      const responseData = await response.json();
      if (responseData.success === 200) {
        // console.log("getAllAddress-------", responseData);
        setSpinner(false);
        setAllAddresses(responseData.addressData);
        if (responseData.addressData.length === 1 && responseData.addressData[0].default === 0) {
          handleDefaultAddress(responseData.addressData[0].id);
          // console.log("0 Index Address Id", responseData.addressData[0].id);
        }
      }
    } catch (error) {
      console.log(error);
      setSpinner(false);
    }
  }

  const handleDefaultAddress = async (addressId) => {
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    try {
      const response = await fetch(`${base_url}api/addresses/${addressId}/set-default`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },
      });

      const responseData = await response.json();
      console.log("responseData", responseData);

      if (response.ok) {
        console.log("Default Address save successfully");
        getAllAddress();
      } else {
        console.error('Failed to save Default Address:', responseData.message);
      }

    } catch (error) {
      console.log("Error when save Default Address:", error);
    }
  }

  useEffect(() => {
    if (isFocused) {
      getAllAddress();
      getAllLocality();
    }
  }, [isFocused])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.scrollView}>
        <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.header}>
          <View style={styles.heroContent}>
            <TouchableOpacity style={styles.headerRow} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color="#FFFFFF" style={styles.backIcon} />
              <Text style={styles.heroTitle}>Address</Text>
            </TouchableOpacity>
            <Text style={styles.heroSubtitle}>
              Manage your addresses for faster checkout
            </Text>
          </View>
        </LinearGradient>

        {spinner === true ?
          <View style={{ flex: 1, alignSelf: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#ffcb44', fontSize: 17 }}>Loading...</Text>
          </View>
          :
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginBottom: 10 }}>
            <View style={styles.currentLocation}>
              <TouchableOpacity onPress={() => setAddAddressModal(true)} style={{ width: '95%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', paddingVertical: 3 }}>
                <View style={{ width: '70%', flexDirection: 'row', alignItems: 'center' }}>
                  <FontAwesome6 name="plus" color={'#ffcb44'} size={22} />
                  <Text style={{ color: '#ffcb44', fontSize: 16, fontWeight: '500', marginLeft: 10 }}> Add a new address</Text>
                </View>
              </TouchableOpacity>
            </View>
            <View style={{ width: '95%', alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', marginTop: 20 }}>
              <View style={{ backgroundColor: '#7a7979', height: 0.4, width: 80, alignSelf: 'center', marginVertical: 10 }}></View>
              <Text style={{ color: '#7a7979', fontSize: 14, fontWeight: '500', letterSpacing: 2 }}>SAVED ADDRESS</Text>
              <View style={{ backgroundColor: '#7a7979', height: 0.4, width: 80, alignSelf: 'center', marginVertical: 10 }}></View>
            </View>
            {allAddresses.length > 0 ?
              <View style={{ flex: 1 }}>
                <FlatList
                  showsHorizontalScrollIndicator={false}
                  data={allAddresses}
                  inverted
                  scrollEnabled={false}
                  keyExtractor={(key) => {
                    return key.id
                  }}
                  renderItem={(address) => {
                    return (
                      <View style={styles.addressBox}>
                        <View style={{ width: '15%', alignItems: 'center', justifyContent: 'center' }}>
                          {address?.item?.address_type === "Home" && <AntDesign name="home" color={'#555454'} size={22} />}
                          {address?.item?.address_type === "Work" && <MaterialIcons name="work-outline" color={'#555454'} size={22} />}
                          {address?.item?.address_type === "Other" && <Fontisto name="world-o" color={'#555454'} size={22} />}

                          {address?.item?.address_type === "Home" && <Text style={{ fontSize: 13, fontWeight: '400', color: '#616161' }}>Home</Text>}
                          {address?.item?.address_type === "Work" && <Text style={{ fontSize: 13, fontWeight: '400', color: '#616161' }}>Work</Text>}
                          {address?.item?.address_type === "Other" && <Text style={{ fontSize: 13, fontWeight: '400', color: '#616161' }}>Other</Text>}
                        </View>
                        <View style={{ width: '3%' }}></View>
                        <View style={{ width: '72%', alignItems: 'flex-start', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 14, fontWeight: '500', color: '#545353', letterSpacing: 0.6 }}>{address?.item?.apartment_name},  {address?.item?.apartment_flat_plot},  {address?.item?.locality_details?.locality_name}</Text>
                          <Text style={{ fontSize: 14, fontWeight: '500', color: '#545353', letterSpacing: 0.6 }}>{address?.item?.landmark},  {address?.item?.city}</Text>
                          <Text style={{ fontSize: 14, fontWeight: '500', color: '#545353', letterSpacing: 0.6 }}>{address?.item?.state},  {address?.item?.pincode},  {address?.item?.place_category}</Text>
                          {address?.item?.default === 1 ?
                            <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center' }}>
                              <FontAwesome name='check-circle' color='#5286f7' size={18} />
                              <Text style={{ fontSize: 15, fontWeight: '500', color: '#5286f7', letterSpacing: 0.6, marginLeft: 5 }}>Default Address</Text>
                            </View>
                            :
                            <TouchableOpacity onPress={() => handleDefaultAddress(address.item.id)} style={{ marginTop: 4 }}>
                              <Text style={{ fontSize: 15, fontWeight: '500', color: '#5286f7', letterSpacing: 0.6 }}>Set as default</Text>
                            </TouchableOpacity>
                          }
                        </View>
                        <View style={{ width: '10%', alignItems: 'flex-end', paddingRight: 5, flexDirection: 'column', justifyContent: 'space-evenly' }}>
                          <TouchableOpacity onPress={() => getAddressById(address.item)} style={{ backgroundColor: '#fff' }}>
                            <MaterialCommunityIcons name="circle-edit-outline" color={'#ffcb44'} size={25} />
                          </TouchableOpacity>
                          {address?.item.default === 0 &&
                            <TouchableOpacity onPress={() => confirmDelete(address.item.id)} style={{ backgroundColor: '#fff' }}>
                              <MaterialCommunityIcons name="delete-circle-outline" color={'#ffcb44'} size={26} />
                            </TouchableOpacity>
                          }
                        </View>
                      </View>
                    )
                  }}
                />
              </View>
              :
              <View style={{ flex: 1, alignItems: 'center', paddingTop: 200 }}>
                <Text style={{ color: '#000', fontSize: 20, fontWeight: 'bold' }}>No Address Saved</Text>
              </View>
            }
          </ScrollView>
        }
      </View>
    </SafeAreaView>
  )
}

export default Index

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  scrollView: {
    flex: 1
  },
  header: {
    paddingTop: 40,
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 10,
  },
  backIcon: {
    position: 'absolute',
    left: 0,
  },
  heroContent: {
    // marginTop: 10
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  currentLocation: {
    backgroundColor: '#fff',
    marginTop: 15,
    width: '95%',
    alignSelf: 'center',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addressBox: {
    width: '95%',
    alignSelf: 'center',
    padding: 12,
    backgroundColor: '#fff',
    marginTop: 10,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
})