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
  FlatList,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import Feather from 'react-native-vector-icons/Feather';
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
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [spinner, setSpinner] = useState(false);
  const [allAddresses, setAllAddresses] = useState([]);
  const [addAddressModal, setAddAddressModal] = useState(false);
  const [editAddressModal, setEditAddressModal] = useState(false);
  const [isFocus, setIsFocus] = useState(false);
  const [addressId, setAddressId] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const options = [
    { label: 'Individual', value: 'individual' },
    { label: 'Apartment', value: 'apartment' },
    { label: 'Business', value: 'business' },
    { label: 'Temple', value: 'temple' },
  ];
  const [plotFlatNumber, setPlotFlatNumber] = useState("");
  const [localityOpen, setLocalityOpen] = useState(false);
  const [localityValue, setLocalityValue] = useState(null);
  const [localityList, setLocalityList] = useState([]);
  const [apartmentOpen, setApartmentOpen] = useState(false);
  const [apartmentValue, setApartmentValue] = useState(null);
  const [apartmentList, setApartmentList] = useState([]);
  const [newApartment, setNewApartment] = useState('');
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [activeAddressType, setActiveAddressType] = useState(null);
  const [errors, setErrors] = useState({});

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
        console.log("getAllAddress-------", responseData);
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

  const getAllLocality = async () => {
    try {
      const response = await fetch(base_url + 'api/localities', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      const responseData = await response.json();
      if (responseData.success === 200) {
        const localityData = responseData.data.map((item) => ({
          label: item.locality_name,
          value: String(item.unique_code),  // Ensure value is a string for consistency
          pincode: item.pincode, // Include pincode in the object
          apartment: item.apartment || [], // Include apartment list in the object
        }));
        // console.log('Fetched Locality Data:', localityData); // Debug: Check the fetched data
        setLocalityList(localityData);
      }
    } catch (error) {
      console.log('Error fetching localities:', error);
    }
  };

  const handleLocalitySelect = (value) => {
    setLocalityValue(value); // Update selected locality value

    // Find the selected locality from localityList
    const selectedLocality = localityList.find(locality => String(locality.value) === String(value));
    if (selectedLocality) {
      // Update pincode and apartment list
      setPincode(selectedLocality.pincode);

      // Map apartment list to dropdown-compatible format
      const apartments = selectedLocality.apartment.map(apartment => ({
        label: apartment.apartment_name,
        value: apartment.apartment_name,
      }));
      setApartmentList(apartments);

      // Reset apartment selection if locality changes
      setApartmentValue(null);
    } else {
      console.log('Locality not found in list.');
    }
  };

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

  const validateFields = () => {
    let valid = true;
    let errors = {};

    if (selectedOption === null) {
      errors.residential = "Please select residential type";
      valid = false;
    }
    if (plotFlatNumber === "") {
      errors.plotFlatNumber = "Plot/Flat Number is required";
      valid = false;
    }
    if (localityValue === null) {
      errors.locality = "Locality is required";
      valid = false;
    }
    if (apartmentValue === null && newApartment === "") {
      errors.apartment = "Apartment is required";
      valid = false;
    }
    if (landmark === "") {
      errors.landmark = "Landmark is required";
      valid = false;
    }
    if (city === "") {
      errors.city = "City is required";
      valid = false;
    }
    if (state === "") {
      errors.state = "State is required";
      valid = false;
    }
    if (pincode === "") {
      errors.pincode = "Pincode is required";
      valid = false;
    }
    if (pincode.length !== 6) {
      errors.pincode = "Pincode must be 6 digits";
      valid = false;
    }
    if (activeAddressType === null) {
      errors.activeAddressType = "Please select address type";
      valid = false;
    }

    setErrors(errors);
    return valid;
  };

  const saveAddress = async () => {
    if (!validateFields()) return;
    const apartment = apartmentValue && apartmentValue !== 'add_new' ? apartmentValue : newApartment;
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    // let addrssData = JSON.stringify({
    //     country: "India",
    //     state: state,
    //     city: city,
    //     pincode: pincode,
    //     address_type: activeAddressType,
    //     locality: localityValue,
    //     apartment_name: apartment,
    //     place_category: String(selectedOption),
    //     apartment_flat_plot: plotFlatNumber,
    //     landmark: landmark
    // })
    // console.log("Address Data:", addrssData);
    // return;
    try {
      const response = await fetch(base_url + 'api/saveaddress', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },
        body: JSON.stringify({
          country: "India",
          state: state,
          city: city,
          pincode: pincode,
          address_type: activeAddressType,
          locality: localityValue,
          apartment_name: apartment,
          place_category: String(selectedOption),
          apartment_flat_plot: plotFlatNumber,
          landmark: landmark
        }),
      });

      const responseData = await response.json();
      console.log("responseData", responseData);

      if (responseData.success === 200) {
        console.log("Address saved successfully");
        setAddAddressModal(false);
        getAllAddress();
        closeAddAddressModal();
      } else {
        console.error('Failed to save address:', responseData.message);
      }

    } catch (error) {
      console.log("Error saving address:", error);
    }
  };

  const closeAddAddressModal = () => {
    setSelectedOption(null);
    setPlotFlatNumber("");
    setLocalityValue(null);
    setApartmentValue(null);
    setNewApartment("");
    setLandmark("");
    setState("");
    setCity("");
    setPincode("");
    setActiveAddressType(null);
    setAddAddressModal(false);
  }

  const closeEditAddressModal = () => {
    setSelectedOption(null);
    setPlotFlatNumber("");
    setLocalityValue(null);
    setApartmentValue(null);
    setNewApartment("");
    setLandmark("");
    setState("");
    setCity("");
    setPincode("");
    setActiveAddressType(null);
    setEditAddressModal(false);
  }

  const getAddressById = (address) => {
    // console.log("address-=-=-=-=", address);
    handleLocalitySelect(address.locality_details.unique_code);
    setAddressId(address.id);
    setSelectedOption(address.place_category);
    setPlotFlatNumber(address.apartment_flat_plot);
    setLocalityValue(address.locality_details.unique_code);
    setApartmentValue(address.apartment_name);
    setLandmark(address.landmark);
    setCity(address.city);
    setState(address.state);
    setPincode(address.pincode);
    setActiveAddressType(address.address_type);
    setEditAddressModal(true);
  }

  const editAddress = async () => {
    const apartment = apartmentValue && apartmentValue !== 'add_new' ? apartmentValue : newApartment;
    if (!validateFields()) return;
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    try {
      const response = await fetch(base_url + 'api/update-address', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },
        body: JSON.stringify({
          id: addressId,
          country: "India",
          state: state,
          city: city,
          pincode: pincode,
          address_type: activeAddressType,
          locality: localityValue,
          apartment_name: apartment,
          place_category: String(selectedOption),
          apartment_flat_plot: plotFlatNumber,
          landmark: landmark
        }),
      });

      const responseData = await response.json();
      console.log("responseData", responseData);

      if (response.ok) {
        console.log("Address Updated successfully");
        setEditAddressModal(false);
        getAllAddress();
        closeEditAddressModal();
      } else {
        console.error('Failed to Edit Address:', responseData.message);
      }

    } catch (error) {
      console.log("Error when Edit Address:", error);
    }
  }

  const [openDeleteAreaModal, setOpenDeleteAreaModal] = useState(false);
  const closeDeleteAreaModal = () => { setOpenDeleteAreaModal(false); setDeleteAreaId(null); };
  const [deleteAreaId, setDeleteAreaId] = useState(null);

  const confirmDelete = (addressId) => {
    console.log("addressId", addressId);
    setDeleteAreaId(addressId);
    setOpenDeleteAreaModal(true);
  }

  const deleteAddress = async () => {
    try {
      const access_token = await AsyncStorage.getItem('storeAccesstoken');
      const response = await fetch(`${base_url}api/user/address/${deleteAreaId}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        }
      });
      const responseData = await response.json();
      console.log("Delete Address Response: ", responseData);
      if (response.ok) {
        closeDeleteAreaModal();
        console.log("Address deleted successfully");
        getAllAddress();
        // Refresh the address list or update the state as needed
      } else {
        console.log("Failed to delete address: ", responseData.message);
      }
    } catch (error) {
      console.error("Error deleting address: ", error);
    }
  };

  useEffect(() => {
    if (isFocused) {
      getAllAddress();
      getAllLocality();
    }
  }, [isFocused])

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
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

      {/* Add Address */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addAddressModal}
        onRequestClose={() => { setAddAddressModal(false) }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.headerPart}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 7 }}>
              <Text style={styles.topHeaderText}>Add Address</Text>
            </View>
            <TouchableOpacity onPress={closeAddAddressModal} style={{ alignSelf: 'flex-end' }}>
              <Ionicons name="close" color={'#000'} size={32} marginRight={8} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ width: '100%', marginTop: 20 }}>
            <View style={{ width: '90%', alignSelf: 'center', marginBottom: 20 }}>
              <Text style={styles.inputLable}>Residential Type</Text>
              {options.reduce((rows, option, index) => {
                if (index % 2 === 0) rows.push([]);
                rows[rows.length - 1].push(option);
                return rows;
              }, []).map((row, rowIndex) => (
                <View key={rowIndex} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  {row.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 10,
                        paddingHorizontal: 15,
                        borderRadius: 20,
                        backgroundColor: selectedOption === option.value ? '#007AFF' : '#f0f0f0',
                        borderWidth: selectedOption === option.value ? 0 : 1,
                        borderColor: '#ccc',
                        flex: 1,
                        marginHorizontal: 5,
                      }}
                      onPress={() => setSelectedOption(option.value)}
                    >
                      <View
                        style={{
                          height: 16,
                          width: 16,
                          borderRadius: 8,
                          borderWidth: 2,
                          borderColor: selectedOption === option.value ? '#fff' : '#007AFF',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 8,
                        }}
                      >
                        {selectedOption === option.value && (
                          <View
                            style={{
                              height: 8,
                              width: 8,
                              borderRadius: 4,
                              backgroundColor: '#fff',
                            }}
                          />
                        )}
                      </View>
                      <Text style={{ color: selectedOption === option.value ? '#fff' : '#333', fontWeight: 'bold' }}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
              {errors.residential && <Text style={styles.errorText}>{errors.residential}</Text>}
            </View>
            <View style={{ width: '90%', alignSelf: 'center', marginBottom: 20, zIndex: localityOpen ? 10 : 1 }}>
              <Text style={styles.inputLable}>Locality</Text>
              <View style={styles.card}>
                <DropDownPicker
                  style={{ borderColor: 'transparent' }}
                  placeholder={!isFocus ? 'Locality' : '...'}
                  open={localityOpen}
                  value={localityValue}
                  items={localityList}
                  setOpen={setLocalityOpen}
                  setValue={(callback) => {
                    const selectedValue = typeof callback === 'function' ? callback(localityValue) : callback;
                    handleLocalitySelect(selectedValue);
                  }}
                  setItems={setLocalityList}
                  itemSeparator={true}
                  listMode="MODAL"
                  searchable={true}
                  searchPlaceholder="Locality..."
                // autoScroll={true}
                />
              </View>
              {errors.locality && <Text style={styles.errorText}>{errors.locality}</Text>}
            </View>
            {selectedOption === 'apartment' &&
              <View style={{ width: '90%', alignSelf: 'center', marginBottom: 20, zIndex: localityOpen ? 10 : 1 }}>
                <Text style={styles.inputLable}>Apartment</Text>
                {apartmentList.length > 0 ?
                  <View style={styles.card}>
                    <DropDownPicker
                      style={{ borderColor: 'transparent' }}
                      placeholder={!isFocus ? 'Apartment' : '...'}
                      open={apartmentOpen}
                      value={apartmentValue}
                      items={[
                        ...apartmentList,
                        { label: 'Add Your Apartment', value: 'add_new' }, // Special "Other" option
                      ]}
                      setOpen={setApartmentOpen}
                      setValue={(callback) => {
                        const selectedValue = typeof callback === 'function' ? callback(apartmentValue) : callback;
                        setApartmentValue(selectedValue);
                      }}
                      setItems={setApartmentList}
                      itemSeparator={true}
                      listMode="MODAL"
                      searchable={true}
                      searchPlaceholder="Apartment..."
                    // autoScroll={true}
                    />
                  </View>
                  :
                  <View style={styles.card}>
                    <TextInput
                      style={styles.inputs}
                      onChangeText={setNewApartment}
                      value={newApartment}
                      placeholder="Enter Your Apartment Name"
                      placeholderTextColor="#424242"
                      underlineColorAndroid="transparent"
                    />
                  </View>
                }
                {errors.apartment && <Text style={styles.errorText}>{errors.apartment}</Text>}
                {apartmentValue === 'add_new' && (
                  <View style={[styles.card, { marginTop: 15 }]}>
                    <TextInput
                      style={styles.inputs}
                      onChangeText={setNewApartment}
                      value={newApartment}
                      placeholder="Enter Your Apartment Name"
                      placeholderTextColor="#424242"
                      underlineColorAndroid="transparent"
                    />
                  </View>
                )}
                {errors.apartment && <Text style={styles.errorText}>{errors.apartment}</Text>}
              </View>
            }
            <View style={{ width: '90%', alignSelf: 'center', marginBottom: 20 }}>
              <Text style={styles.inputLable}>Plot / Flat  Number</Text>
              <View style={styles.card}>
                <TextInput
                  style={styles.inputs}
                  onChangeText={setPlotFlatNumber}
                  value={plotFlatNumber}
                  placeholder="Enter Your Plot/Flat Number"
                  placeholderTextColor="#424242"
                  underlineColorAndroid='transparent'
                />
              </View>
              {errors.plotFlatNumber && <Text style={styles.errorText}>{errors.plotFlatNumber}</Text>}
            </View>
            <View style={{ width: '90%', alignSelf: 'center', marginBottom: 20 }}>
              <Text style={styles.inputLable}>LandMark</Text>
              <View style={styles.card}>
                <TextInput
                  style={styles.inputs}
                  onChangeText={setLandmark}
                  value={landmark}
                  placeholder="Enter Your LandMark"
                  placeholderTextColor="#424242"
                  underlineColorAndroid='transparent'
                />
              </View>
              {errors.landmark && <Text style={styles.errorText}>{errors.landmark}</Text>}
            </View>
            <View style={{ width: '90%', alignSelf: 'center', marginBottom: 20 }}>
              <Text style={styles.inputLable}>Town/City</Text>
              <View style={styles.card}>
                <TextInput
                  style={styles.inputs}
                  onChangeText={setCity}
                  value={city}
                  placeholder="Enter Your Town/City"
                  placeholderTextColor="#424242"
                  underlineColorAndroid='transparent'
                />
              </View>
              {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
            </View>
            <View style={{ width: '90%', alignSelf: 'center', marginBottom: 20 }}>
              <Text style={styles.inputLable}>State</Text>
              <View style={styles.card}>
                <TextInput
                  style={styles.inputs}
                  onChangeText={setState}
                  value={state}
                  placeholder="Enter Your State"
                  placeholderTextColor="#424242"
                  underlineColorAndroid='transparent'
                />
              </View>
              {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
            </View>
            <View style={{ width: '90%', alignSelf: 'center', marginBottom: 20 }}>
              <Text style={styles.inputLable}>Pincode</Text>
              <View style={[styles.card, { backgroundColor: '#ebe8e8' }]}>
                <TextInput
                  style={styles.inputs}
                  onChangeText={setPincode}
                  value={pincode} // This should reflect the updated pincode
                  maxLength={6}
                  editable={false} // Disable editing of pincode
                  keyboardType="number-pad"
                  placeholder="Enter Your Pincode"
                  placeholderTextColor="#424242"
                  underlineColorAndroid="transparent"
                />
              </View>
              {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}
            </View>
            <View style={{ width: '90%', alignSelf: 'center', marginBottom: 20 }}>
              <Text style={styles.inputLable}>Type of address</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', height: 40, marginTop: 5 }}>
                <TouchableOpacity onPress={() => setActiveAddressType('Home')} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: activeAddressType === 'Home' ? '#c7d4f0' : '#fff', marginRight: 20, borderWidth: 0.8, borderColor: activeAddressType === 'Home' ? '#074feb' : '#000', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 }}>
                  <Entypo name="home" color={activeAddressType === 'Home' ? '#074feb' : '#000'} size={20} />
                  <Text style={{ color: activeAddressType === 'Home' ? '#074feb' : '#000', fontSize: 13, fontWeight: '500', marginLeft: 6 }}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveAddressType('Work')} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: activeAddressType === 'Work' ? '#c7d4f0' : '#fff', marginRight: 20, borderWidth: 0.8, borderColor: activeAddressType === 'Work' ? '#074feb' : '#000', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 }}>
                  <MaterialCommunityIcons name="office-building" color={activeAddressType === 'Work' ? '#074feb' : '#000'} size={20} />
                  <Text style={{ color: activeAddressType === 'Work' ? '#074feb' : '#000', fontSize: 13, fontWeight: '500', marginLeft: 6 }}>Work</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveAddressType('Other')} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: activeAddressType === 'Other' ? '#c7d4f0' : '#fff', borderWidth: 0.8, borderColor: activeAddressType === 'Other' ? '#074feb' : '#000', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 }}>
                  <Feather name="globe" color={activeAddressType === 'Other' ? '#074feb' : '#000'} size={20} />
                  <Text style={{ color: activeAddressType === 'Other' ? '#074feb' : '#000', fontSize: 13, fontWeight: '500', marginLeft: 6 }}>Other</Text>
                </TouchableOpacity>
              </View>
              {errors.activeAddressType && <Text style={styles.errorText}>{errors.activeAddressType}</Text>}
            </View>
          </ScrollView>
          <TouchableOpacity onPress={saveAddress}>
            <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.saveAddress}>
              <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>Save Address</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Edit Address */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editAddressModal}
        onRequestClose={() => { setEditAddressModal(false) }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.headerPart}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 7 }}>
              <Text style={styles.topHeaderText}>Add Address</Text>
            </View>
            <TouchableOpacity onPress={closeEditAddressModal} style={{ alignSelf: 'flex-end' }}>
              <Ionicons name="close" color={'#000'} size={32} marginRight={8} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ width: '100%', marginTop: 20 }}>
            <View style={{ width: '90%', alignSelf: 'center', marginBottom: 20 }}>
              <Text style={styles.inputLable}>Residential Type</Text>
              {options.reduce((rows, option, index) => {
                if (index % 2 === 0) rows.push([]);
                rows[rows.length - 1].push(option);
                return rows;
              }, []).map((row, rowIndex) => (
                <View key={rowIndex} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  {row.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 10,
                        paddingHorizontal: 15,
                        borderRadius: 20,
                        backgroundColor: selectedOption === option.value ? '#007AFF' : '#f0f0f0',
                        borderWidth: selectedOption === option.value ? 0 : 1,
                        borderColor: '#ccc',
                        flex: 1,
                        marginHorizontal: 5,
                      }}
                      onPress={() => setSelectedOption(option.value)}
                    >
                      <View
                        style={{
                          height: 16,
                          width: 16,
                          borderRadius: 8,
                          borderWidth: 2,
                          borderColor: selectedOption === option.value ? '#fff' : '#007AFF',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 8,
                        }}
                      >
                        {selectedOption === option.value && (
                          <View
                            style={{
                              height: 8,
                              width: 8,
                              borderRadius: 4,
                              backgroundColor: '#fff',
                            }}
                          />
                        )}
                      </View>
                      <Text style={{ color: selectedOption === option.value ? '#fff' : '#333', fontWeight: 'bold' }}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
              {errors.residential && <Text style={styles.errorText}>{errors.residential}</Text>}
            </View>
            <View style={{ width: '90%', alignSelf: 'center', marginBottom: 20, zIndex: localityOpen ? 10 : 1 }}>
              <Text style={styles.inputLable}>Locality</Text>
              <View style={styles.card}>
                <DropDownPicker
                  style={{ borderColor: 'transparent' }}
                  placeholder={!isFocus ? 'Locality' : '...'}
                  open={localityOpen}
                  value={localityValue}
                  items={localityList}
                  setOpen={setLocalityOpen}
                  setValue={(callback) => {
                    const selectedValue = typeof callback === 'function' ? callback(localityValue) : callback;
                    handleLocalitySelect(selectedValue);
                  }}
                  setItems={setLocalityList}
                  itemSeparator={true}
                  listMode="MODAL"
                  searchable={true}
                  searchPlaceholder="Locality..."
                // autoScroll={true}
                />
              </View>
              {errors.locality && <Text style={styles.errorText}>{errors.locality}</Text>}
            </View>
            {selectedOption === 'apartment' &&
              <View style={{ width: '90%', alignSelf: 'center', marginBottom: 20, zIndex: localityOpen ? 10 : 1 }}>
                <Text style={styles.inputLable}>Apartment</Text>
                {apartmentList.length > 0 ?
                  <View style={styles.card}>
                    <DropDownPicker
                      style={{ borderColor: 'transparent' }}
                      placeholder={!isFocus ? 'Apartment' : '...'}
                      open={apartmentOpen}
                      value={apartmentValue}
                      items={[
                        ...apartmentList,
                        { label: 'Add Your Apartment', value: 'add_new' }, // Special "Other" option
                      ]}
                      setOpen={setApartmentOpen}
                      setValue={(callback) => {
                        const selectedValue = typeof callback === 'function' ? callback(apartmentValue) : callback;
                        setApartmentValue(selectedValue);
                      }}
                      setItems={setApartmentList}
                      itemSeparator={true}
                      listMode="MODAL"
                      searchable={true}
                      searchPlaceholder="Apartment..."
                    // autoScroll={true}
                    />
                  </View>
                  :
                  <View style={styles.card}>
                    <TextInput
                      style={styles.inputs}
                      onChangeText={setNewApartment}
                      value={newApartment}
                      placeholder="Enter Your Apartment Name"
                      placeholderTextColor="#424242"
                      underlineColorAndroid="transparent"
                    />
                  </View>
                }
                {errors.apartment && <Text style={styles.errorText}>{errors.apartment}</Text>}
                {apartmentValue === 'add_new' && (
                  <View style={[styles.card, { marginTop: 15 }]}>
                    <TextInput
                      style={styles.inputs}
                      onChangeText={setNewApartment}
                      value={newApartment}
                      placeholder="Enter Your Apartment Name"
                      placeholderTextColor="#424242"
                      underlineColorAndroid="transparent"
                    />
                  </View>
                )}
                {errors.apartment && <Text style={styles.errorText}>{errors.apartment}</Text>}
              </View>
            }
            <View style={{ width: '90%', alignSelf: 'center', marginBottom: 20 }}>
              <Text style={styles.inputLable}>Plot / Flat  Number</Text>
              <View style={styles.card}>
                <TextInput
                  style={styles.inputs}
                  onChangeText={setPlotFlatNumber}
                  value={plotFlatNumber}
                  placeholder="Enter Your Plot/Flat Number"
                  placeholderTextColor="#424242"
                  underlineColorAndroid='transparent'
                />
              </View>
              {errors.plotFlatNumber && <Text style={styles.errorText}>{errors.plotFlatNumber}</Text>}
            </View>
            <View style={{ width: '90%', alignSelf: 'center', marginBottom: 20 }}>
              <Text style={styles.inputLable}>LandMark</Text>
              <View style={styles.card}>
                <TextInput
                  style={styles.inputs}
                  onChangeText={setLandmark}
                  value={landmark}
                  placeholder="Enter Your LandMark"
                  placeholderTextColor="#424242"
                  underlineColorAndroid='transparent'
                />
              </View>
              {errors.landmark && <Text style={styles.errorText}>{errors.landmark}</Text>}
            </View>
            <View style={{ width: '90%', alignSelf: 'center', marginBottom: 20 }}>
              <Text style={styles.inputLable}>Town/City</Text>
              <View style={styles.card}>
                <TextInput
                  style={styles.inputs}
                  onChangeText={setCity}
                  value={city}
                  placeholder="Enter Your Town/City"
                  placeholderTextColor="#424242"
                  underlineColorAndroid='transparent'
                />
              </View>
              {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
            </View>
            <View style={{ width: '90%', alignSelf: 'center', marginBottom: 20 }}>
              <Text style={styles.inputLable}>State</Text>
              <View style={styles.card}>
                <TextInput
                  style={styles.inputs}
                  onChangeText={setState}
                  value={state}
                  placeholder="Enter Your State"
                  placeholderTextColor="#424242"
                  underlineColorAndroid='transparent'
                />
              </View>
              {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
            </View>
            <View style={{ width: '90%', alignSelf: 'center', marginBottom: 20 }}>
              <Text style={styles.inputLable}>Pincode</Text>
              <View style={[styles.card, { backgroundColor: '#ebe8e8' }]}>
                <TextInput
                  style={styles.inputs}
                  onChangeText={setPincode}
                  value={pincode} // This should reflect the updated pincode
                  maxLength={6}
                  editable={false} // Disable editing of pincode
                  keyboardType="number-pad"
                  placeholder="Enter Your Pincode"
                  placeholderTextColor="#424242"
                  underlineColorAndroid="transparent"
                />
              </View>
              {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}
            </View>
            <View style={{ width: '90%', alignSelf: 'center', marginBottom: 20 }}>
              <Text style={styles.inputLable}>Type of address</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', height: 40, marginTop: 5 }}>
                <TouchableOpacity onPress={() => setActiveAddressType('Home')} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: activeAddressType === 'Home' ? '#c7d4f0' : '#fff', marginRight: 20, borderWidth: 0.8, borderColor: activeAddressType === 'Home' ? '#074feb' : '#000', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 }}>
                  <Entypo name="home" color={activeAddressType === 'Home' ? '#074feb' : '#000'} size={20} />
                  <Text style={{ color: activeAddressType === 'Home' ? '#074feb' : '#000', fontSize: 13, fontWeight: '500', marginLeft: 6 }}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveAddressType('Work')} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: activeAddressType === 'Work' ? '#c7d4f0' : '#fff', marginRight: 20, borderWidth: 0.8, borderColor: activeAddressType === 'Work' ? '#074feb' : '#000', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 }}>
                  <MaterialCommunityIcons name="office-building" color={activeAddressType === 'Work' ? '#074feb' : '#000'} size={20} />
                  <Text style={{ color: activeAddressType === 'Work' ? '#074feb' : '#000', fontSize: 13, fontWeight: '500', marginLeft: 6 }}>Work</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveAddressType('Other')} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: activeAddressType === 'Other' ? '#c7d4f0' : '#fff', borderWidth: 0.8, borderColor: activeAddressType === 'Other' ? '#074feb' : '#000', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 }}>
                  <Feather name="globe" color={activeAddressType === 'Other' ? '#074feb' : '#000'} size={20} />
                  <Text style={{ color: activeAddressType === 'Other' ? '#074feb' : '#000', fontSize: 13, fontWeight: '500', marginLeft: 6 }}>Other</Text>
                </TouchableOpacity>
              </View>
              {errors.activeAddressType && <Text style={styles.errorText}>{errors.activeAddressType}</Text>}
            </View>
          </ScrollView>
          <TouchableOpacity onPress={editAddress}>
            <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.saveAddress}>
              <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>Edit Address</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Start Delete Area Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={openDeleteAreaModal}
        onRequestClose={closeDeleteAreaModal}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={{ width: '90%', alignSelf: 'center', marginBottom: 10 }}>
              <View style={{ alignItems: 'center' }}>
                <MaterialIcons name="report-gmailerrorred" size={100} color="red" />
                <Text style={{ color: '#000', fontSize: 23, fontWeight: 'bold', textAlign: 'center', letterSpacing: 0.3 }}>Are You Sure To Delete This Address</Text>
                <Text style={{ color: 'gray', fontSize: 17, fontWeight: '500', marginTop: 4 }}>You won't be able to revert this!</Text>
              </View>
            </View>
            <View style={{ width: '95%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', marginTop: 10 }}>
              <TouchableOpacity onPress={closeDeleteAreaModal} style={styles.cancelDeleteBtn}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={deleteAddress} style={styles.confirmDeleteBtn}>
                <Text style={styles.btnText}>Yes, delete it!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* End Delete Area Modal */}
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
  modalContainer: {
    backgroundColor: '#f5f5f5',
    flex: 1
  },
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
  topHeaderText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 3,
    marginLeft: 5,
  },
  inputLable: {
    color: '#000',
    fontSize: 17,
    fontWeight: '400',
    marginBottom: 5
  },
  saveAddress: {
    width: '90%',
    backgroundColor: '#ffcb44',
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 13,
    marginTop: 5,
  },
  card: {
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 13,
    elevation: 5,
  },
  inputs: {
    height: 50,
    width: '90%',
    alignSelf: 'center',
    fontSize: 16,
    color: '#000'
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 15, // Slightly more rounded corners
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 }, // More pronounced shadow
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    padding: 20,
  },
  cancelDeleteBtn: {
    backgroundColor: 'red',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 7
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  confirmDeleteBtn: {
    backgroundColor: 'green',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 7
  },
})