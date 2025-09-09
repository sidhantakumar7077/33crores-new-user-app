import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  ActivityIndicator,
  Animated, Easing,
  Linking,
  KeyboardAvoidingView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay';
import Icon from 'react-native-vector-icons/FontAwesome5';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import moment from 'moment';
import { base_url } from '../../../App';

const Index = (props) => {

  const { flowerData = {}, order_id = "", preEndDate = null } = props?.route?.params || {};

  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [packageDetails, setPackageDetails] = useState({});
  const defaultStart = preEndDate ? moment(preEndDate, 'YYYY-MM-DD').add(1, 'day').toDate() : moment().add(1, 'day').toDate();
  const [dob, setDob] = useState(defaultStart);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const openDatePicker = () => { setDatePickerVisibility(true) };
  const closeDatePicker = () => { setDatePickerVisibility(false) };
  const [suggestions, setSuggestions] = useState("");
  const [addressError, setAddressError] = useState('');
  const [addressErrorMessageVisible, setAddressErrorMessageVisible] = useState(false);
  const [addAddressModal, setAddAddressModal] = useState(false);
  const [showAllAddresses, setShowAllAddresses] = useState(false);
  const [allAddresses, setAllAddresses] = useState([]);
  const [displayedAddresses, setDisplayedAddresses] = useState([]);
  const [selectedOption, setSelectedOption] = useState('');
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const closeOrderModal = () => { setOrderModalVisible(false) };
  const [profileDetails, setProfileDetails] = useState({});

  const [isFocus, setIsFocus] = useState(false);
  const [seletedAddress, setSeletedAddress] = useState(null);
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
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [errorModal, setErrorModal] = useState(false);
  const closeErrorModal = () => { setErrorModal(false); }
  const [errormasg, setErrormasg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDayPress = (day) => {
    const selected = moment(day.dateString, 'YYYY-MM-DD');
    const tomorrow = moment().add(1, 'day').startOf('day');
    const cutoffPassed = moment().isSameOrAfter(moment().hour(18).minute(0).second(0));

    // Block picking "tomorrow" after 6PM
    if (selected.isSame(tomorrow, 'day') && cutoffPassed) {
      Alert.alert(
        'Not available',
        'Tomorrow’s start date is no longer available after 6:00 PM. Please choose a later date.'
      );
      return;
    }

    setDob(new Date(day.dateString));
    closeDatePicker();
  };

  const getAllAddress = async () => {
    var access_token = await AsyncStorage.getItem('storeAccesstoken');
    try {
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
        setAllAddresses(responseData.addressData);
        if (responseData.addressData.length === 1 && responseData.addressData[0].default === 0) {
          handleDefaultAddress(responseData.addressData[0].id);
          // console.log("0 Index Address Id", responseData.addressData[0].id);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  const joinParts = (...vals) =>
    vals
      .filter(v => v !== null && v !== undefined && String(v).trim() !== '')
      .map(v => String(v).trim())
      .join(',  ');

  useEffect(() => {
    // When 'allAddresses' changes, update 'displayedAddresses' with the first address
    if (allAddresses.length > 0) {
      setDisplayedAddresses(allAddresses.slice(0, 1));
    }
  }, [allAddresses]);

  const handleAddressChange = (option) => {
    setSelectedOption(option);
    // console.log("Address Id", option);
  };

  const toggleAddresses = () => {
    setShowAllAddresses(!showAllAddresses);
    if (!showAllAddresses) {
      setDisplayedAddresses(allAddresses);
    } else {
      setDisplayedAddresses(allAddresses.slice(0, 1));
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
  };

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

  const saveAddress = async () => {
    if (!validateFields()) return;
    const apartment = apartmentValue && apartmentValue !== 'add_new' ? apartmentValue : newApartment;
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    // let addressData = JSON.stringify({
    //     country: "India",
    //     state: state,
    //     city: city,
    //     pincode: pincode,
    //     address_type: activeAddressType,
    //     locality: localityValue,
    //     apartment_name: apartmentValue,
    //     place_category: String(seletedAddress),
    //     apartment_flat_plot: apartment,
    //     landmark: landmark
    // });
    // console.log("addressData", addressData);
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
          place_category: String(seletedAddress),
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

  const validateFields = () => {
    let valid = true;
    let errors = {};

    if (seletedAddress === null) {
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
    if (selectedOption === 'apartment' && (apartmentValue === null && newApartment === "")) {
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

  const displayErrorMessage = (message) => {
    setAddressError(message);
    setAddressErrorMessageVisible(true);

    setTimeout(() => {
      setAddressErrorMessageVisible(false);
      setAddressError('');
    }, 30000); // 30 seconds
  };

  const getProfile = async () => {
    var access_token = await AsyncStorage.getItem('storeAccesstoken');
    try {
      const response = await fetch(base_url + 'api/user/details', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },
      });
      const responseData = await response.json();
      if (responseData.success === true) {
        // console.log("getProfile-------", responseData);
        setProfileDetails(responseData.user);
        // setImageSource(user.);
      }
    } catch (error) {
      console.log(error);
    }
  }

  const handleBuy = async () => {
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    setIsLoading(true);

    try {
      if (selectedOption === "") {
        // displayErrorMessage("Please Select Your Address");
        setErrormasg("Please Select Your Address");
        setErrorModal(true);
        setIsLoading(false);
        return;
      }

      const options = {
        description: props.route.params.flowerData.name,
        image: '',
        currency: 'INR',
        key: 'rzp_live_m8GAuZDtZ9W0AI',
        amount: props.route.params.flowerData.price * 100,
        name: profileDetails.name,
        order_id: '',
        prefill: {
          email: profileDetails.email,
          contact: profileDetails.mobile_number,
          name: profileDetails.name
        },
        theme: { color: '#53a20e' }
      };
      const data = await RazorpayCheckout.open(options);

      // const Data = {
      //     product_id: props.route.params.flowerData.product_id,
      //     order_id: props.route.params.orderId || "", // capture Razorpay order ID if available
      //     address_id: selectedOption,
      //     payment_id: data.razorpay_payment_id || "", // capture Razorpay payment ID if available
      //     // payment_id: "pay_29QQoUBi66xm2f",
      //     paid_amount: props.route.params.flowerData.price,
      //     duration: props.route.params.flowerData.duration,
      //     suggestion: suggestions,
      //     start_date: moment(dob).format('YYYY-MM-DD')
      // }
      // console.log("Data", Data);
      // return;

      // Proceed only if Razorpay payment succeeds
      const response = await fetch(base_url + 'api/purchase-subscription', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },
        body: JSON.stringify({
          product_id: props.route.params.flowerData.product_id,
          order_id: props.route.params.orderId || "",
          address_id: selectedOption,
          payment_id: data.razorpay_payment_id || "",
          // payment_id: "pay_29QQoUBi66xm2f",
          paid_amount: props.route.params.flowerData.price,
          duration: props.route.params.flowerData.duration,
          suggestion: suggestions,
          start_date: moment(dob).format('YYYY-MM-DD')
        }),
      });

      const responseData = await response.json();
      if (response.ok) {
        // console.log("Booking successfully", responseData);
        setOrderModalVisible(true);
      } else {
        setErrorModal(true);
        setErrormasg(responseData.message);
        // console.log("responseData", responseData);
      }
    } catch (error) {
      // Handle any errors, either from Razorpay or fetch
      setErrorModal(true);
      setErrormasg(error.message || "An error occurred during payment");
      console.log("An error occurred during payment", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  useEffect(() => {
    if (isFocused) {
      // console.log("Get Subscription Details By props", props.route.params);
      setPackageDetails(flowerData || {});
      getAllAddress();
      getAllLocality();
      getProfile();

      // Keep dob in sync if page is re-entered with different preEndDate
      const freshDefault = preEndDate
        ? moment(preEndDate, 'YYYY-MM-DD').add(1, 'day').toDate()
        : moment().add(1, 'day').toDate();
      setDob(freshDefault);
    }
  }, [isFocused, flowerData, preEndDate]);

  // The earliest allowed start date = max(tomorrow, preEndDate+1)
  const minStartDate = React.useMemo(() => {
    const tomorrow = moment().add(1, 'day');
    const afterPrev = preEndDate ? moment(preEndDate, 'YYYY-MM-DD').add(1, 'day') : null;
    return (afterPrev && afterPrev.isAfter(tomorrow) ? afterPrev : tomorrow).format('YYYY-MM-DD');
  }, [preEndDate]);

  const effectiveMinStartDate = React.useMemo(() => {
    const now = moment();
    const cutoffPassed = now.isSameOrAfter(now.clone().hour(18).minute(0).second(0));
    const base = moment(minStartDate, 'YYYY-MM-DD');

    // if base == tomorrow and cutoff has passed, move to day-after-tomorrow
    if (cutoffPassed && base.isSame(moment().add(1, 'day'), 'day')) {
      return base.add(1, 'day').format('YYYY-MM-DD');
    }
    return base.format('YYYY-MM-DD');
  }, [minStartDate]);

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.scrollView}>
        <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.header}>
          <View style={styles.heroContent}>
            <TouchableOpacity style={styles.headerRow} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color="#FFFFFF" style={styles.backIcon} />
              <Text style={styles.heroTitle}>Subscription Checkout</Text>
            </TouchableOpacity>
            <Text style={styles.heroSubtitle}>
              Please review your subscription details before proceeding to payment.
            </Text>
          </View>
        </LinearGradient>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} style={{ flex: 1, marginBottom: 50 }}>
            <View style={styles.productContainer}>
              <View style={styles.productDetails}>
                <View style={{ width: '35%', paddingVertical: 10 }}>
                  <View style={styles.flowerImage}>
                    <Image
                      style={{ flex: 1, borderRadius: 8, resizeMode: 'cover' }}
                      source={{ uri: packageDetails.product_image }}
                    />
                  </View>
                </View>
                <View style={{ width: '60%', justifyContent: 'center' }}>
                  <Text style={{ color: '#000', fontSize: 18, fontWeight: '500', textTransform: 'capitalize' }}>
                    {packageDetails.name}
                  </Text>
                  <Text style={{ color: '#000', fontSize: 14, fontWeight: '400', textTransform: 'capitalize', marginTop: 5 }}>
                    Price : ₹{packageDetails.price}
                  </Text>
                </View>
              </View>
              {/* Benefits Section */}
              {packageDetails.benefits && (
                <View style={styles.planFeatures}>
                  {packageDetails.benefits.split('#').map((benefit, idx) => (
                    <View key={idx} style={styles.featureRow}>
                      <Icon name="check" size={12} color="#059669" />
                      <Text style={styles.featureText}>{benefit.trim()}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            {/* Address, Date & Suggestion Section */}
            <View style={styles.address}>
              {/* Subscription Start Date */}
              {!!preEndDate && (
                <Text style={{ color: '#065F46', fontWeight: '700', marginBottom: 6 }}>
                  Renewal detected — start date prefilled to {moment(preEndDate).add(1, 'day').format('DD-MM-YYYY')}
                </Text>
              )}
              <View style={{ width: '100%', marginBottom: 5 }}>
                <Text style={styles.label}>Subscription Start Date</Text>
                <TouchableOpacity onPress={openDatePicker}>
                  <TextInput
                    style={styles.input}
                    value={dob ? moment(dob).format('DD-MM-YYYY') : ""}
                    editable={false}
                  />
                  <MaterialCommunityIcons name="calendar-month" color={'#555454'} size={26} style={{ position: 'absolute', right: 10, top: 10 }} />
                </TouchableOpacity>
              </View>
              {/* Message & Suggestions */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <View style={{ width: '15%', height: 80, borderWidth: 0.8, borderRightWidth: 0, backgroundColor: '#fbfdff', alignItems: 'center', justifyContent: 'center', borderColor: '#edeff1', borderTopLeftRadius: 5, borderBottomLeftRadius: 5 }}>
                  <Feather name="message-square" color={'#495057'} size={20} />
                </View>
                <View style={{ width: '85%', height: 80, borderWidth: 0.8, borderColor: '#edeff1', borderTopRightRadius: 5, borderBottomRightRadius: 5 }}>
                  <TextInput
                    style={{ flex: 1, paddingLeft: 15, fontSize: 15, textAlignVertical: 'top', color: '#000' }}
                    onChangeText={setSuggestions}
                    value={suggestions}
                    multiline={true}
                    type='text'
                    placeholder="Any suggestions? We will pass it on..."
                    placeholderTextColor="#888888"
                    underlineColorAndroid='transparent'
                  />
                </View>
              </View>
              {/* Address */}
              <View style={{ flex: 1, marginTop: 15 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
                  <View style={{ width: '65%' }}>
                    {addressErrorMessageVisible ?
                      <Text style={{ color: '#f00c27', fontWeight: '500' }}>{addressError}</Text>
                      : null
                    }
                  </View>
                  <TouchableOpacity onPress={() => setAddAddressModal(true)}>
                    <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.addressAddBtm}>
                      <Text style={{ color: '#fff', fontSize: 15, fontWeight: '500' }}>Add Address</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                <FlatList
                  showsHorizontalScrollIndicator={false}
                  data={displayedAddresses}
                  scrollEnabled={false}
                  keyExtractor={(item) => item.id?.toString?.()}
                  renderItem={({ item }) => {
                    const line1 = joinParts(item?.apartment_name, item?.apartment_flat_plot, item?.landmark);
                    const line2 = joinParts(item?.locality_details?.locality_name, item?.city, item?.state);
                    const line3 = joinParts(item?.pincode, item?.place_category);

                    return (
                      <TouchableOpacity
                        onPress={() => handleAddressChange(item?.id)}
                        style={{
                          borderColor: '#edeff1',
                          borderWidth: 1,
                          padding: 10,
                          flexDirection: 'row',
                          alignItems: 'center',
                          borderRadius: 8,
                          marginVertical: 5,
                        }}
                      >
                        <View style={{ width: '8%', alignSelf: 'flex-start', marginTop: 2 }}>
                          {item?.address_type === 'Home' && <Feather name="home" color={'#555454'} size={18} />}
                          {item?.address_type === 'Work' && <Feather name="briefcase" color={'#555454'} size={17} />}
                          {item?.address_type === 'Other' && <Feather name="globe" color={'#555454'} size={17} />}
                        </View>

                        <View style={{ width: '82%' }}>
                          <View>
                            {item?.address_type ? (
                              <Text style={{ color: '#000', fontSize: 15, fontWeight: '600' }}>
                                {item.address_type}
                              </Text>
                            ) : null}
                          </View>

                          {line1 ? <Text style={{ color: '#555454', fontSize: 13 }}>{line1}</Text> : null}
                          {line2 ? <Text style={{ color: '#555454', fontSize: 13 }}>{line2}</Text> : null}
                          {line3 ? <Text style={{ color: '#555454', fontSize: 13 }}>{line3}</Text> : null}
                        </View>

                        <View style={{ width: '10%', alignItems: 'center', justifyContent: 'center' }}>
                          {selectedOption === item?.id ? (
                            <MaterialCommunityIcons name="record-circle" color={'#ffcb44'} size={24} />
                          ) : (
                            <Feather name="circle" color={'#555454'} size={20} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
                {allAddresses.length > 1 && (
                  !showAllAddresses ? (
                    <TouchableOpacity onPress={toggleAddresses} style={{ backgroundColor: 'transparent', flexDirection: 'row', alignSelf: 'center', alignItems: 'center', marginTop: 5 }}>
                      <Text style={{ color: '#000', fontSize: 15, fontWeight: '600', marginBottom: 3, marginRight: 3 }}>Show All Addresses</Text>
                      <FontAwesome name="angle-double-down" color={'#000'} size={17} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={toggleAddresses} style={{ backgroundColor: 'transparent', flexDirection: 'row', alignSelf: 'center', alignItems: 'center', marginTop: 5 }}>
                      <Text style={{ color: '#000', fontSize: 15, fontWeight: '600', marginBottom: 2, marginRight: 3 }}>Hide</Text>
                      <FontAwesome name="angle-double-up" color={'#000'} size={17} />
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {isLoading ? (
          <ActivityIndicator size="large" color="#c80100" />
        ) : (
          <TouchableOpacity onPress={handleBuy}>
            <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.fixedBtm}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>BUY NOW</Text>
              <Feather name="arrow-right" color={'#fff'} size={24} marginLeft={10} marginTop={3} />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Date Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isDatePickerVisible}
        onRequestClose={closeDatePicker}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View style={{ width: '90%', padding: 20, backgroundColor: 'white', borderRadius: 10, elevation: 5 }}>
            <Calendar
              onDayPress={handleDayPress}
              markedDates={{
                [moment(dob).format('YYYY-MM-DD')]: {
                  selected: true,
                  marked: true,
                  selectedColor: 'blue'
                }
              }}
              minDate={effectiveMinStartDate}
            />
          </View>
        </View>
      </Modal>

      {/* Add Address Modal */}
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
                        backgroundColor: seletedAddress === option.value ? '#007AFF' : '#f0f0f0',
                        borderWidth: seletedAddress === option.value ? 0 : 1,
                        borderColor: '#ccc',
                        flex: 1,
                        marginHorizontal: 5,
                      }}
                      onPress={() => setSeletedAddress(option.value)}
                    >
                      <View
                        style={{
                          height: 16,
                          width: 16,
                          borderRadius: 8,
                          borderWidth: 2,
                          borderColor: seletedAddress === option.value ? '#fff' : '#007AFF',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 8,
                        }}
                      >
                        {seletedAddress === option.value && (
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
                      <Text style={{ color: seletedAddress === option.value ? '#fff' : '#333', fontWeight: 'bold' }}>
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
            {seletedAddress === 'apartment' &&
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
                {/* {errors.apartment && <Text style={styles.errorText}>{errors.apartment}</Text>} */}
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

      {/* Order Success Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={orderModalVisible}
        onRequestClose={closeOrderModal}
      >
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <LinearGradient colors={['#10B981', '#059669']} style={styles.checkCircle}>
                <FontAwesome name="check" color="#fff" size={42} />
              </LinearGradient>
            </Animated.View>

            <Text style={styles.title}>Congratulations!</Text>
            <Text style={styles.body}>Your order has been placed successfully.</Text>
            <Text style={[styles.body, { marginTop: 6 }]}>
              For any inquiry, call us:
            </Text>

            <TouchableOpacity onPress={() => Linking.openURL('tel:9776888887')} activeOpacity={0.9} style={styles.phonePill}>
              <FontAwesome name="phone" size={12} color="#065F46" />
              <Text style={styles.phoneText}>9776 888 887</Text>
            </TouchableOpacity>

            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={() => navigation.replace('SubscriptionOrderHistory')} activeOpacity={0.9} style={styles.primaryBtn}>
                <LinearGradient colors={['#F59E0B', '#F97316']} style={styles.primaryGrad}>
                  <Text style={styles.primaryText}>Order Details</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { closeOrderModal(); navigation.goBack() }} activeOpacity={0.9} style={styles.secondaryBtn}>
                <Text style={styles.secondaryText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Start Show Error Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={errorModal}
        onRequestClose={closeErrorModal}
      >
        <View style={styles.errorModalOverlay}>
          <View style={styles.errorModalContainer}>
            <View style={{ width: '90%', alignSelf: 'center', marginBottom: 10 }}>
              <View style={{ alignItems: 'center' }}>
                <MaterialIcons name="report-gmailerrorred" size={100} color="red" />
                <Text style={{ color: '#000', fontSize: 20, fontWeight: 'bold', textAlign: 'center', letterSpacing: 0.3 }}>{errormasg}</Text>
              </View>
            </View>
            <View style={{ width: '95%', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', marginTop: 10 }}>
              <TouchableOpacity onPress={closeErrorModal} style={styles.confirmDeleteBtn}>
                <Text style={styles.btnText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flex: 1,
    paddingBottom: 10
  },
  header: {
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: 50,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  backIcon: {
    position: 'absolute',
    left: 0,
  },
  heroContent: {
    // marginTop: 10,
  },
  heroTitle: {
    fontSize: 25,
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
  spinnerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row'
  },
  productContainer: {
    width: '95%',
    backgroundColor: '#fff',
    alignSelf: 'center',
    marginTop: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  productDetails: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  flowerImage: {
    height: 120,
    width: 120,
    borderRadius: 8,
    backgroundColor: '#6c757d',
  },
  planFeatures: {
    width: '95%',
    alignSelf: 'center',
    marginBottom: 8,
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 8,
  },
  benefitsHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  featureText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#374151',
    flexShrink: 1,
  },
  address: {
    marginVertical: 15,
    backgroundColor: '#fff',
    width: '95%',
    alignSelf: 'center',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    paddingHorizontal: 20,
    paddingVertical: 15,
    zIndex: 1000
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#757473',
    marginBottom: 10,
    color: '#333',
  },
  addressAddBtm: {
    backgroundColor: '#ffcb44',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6
  },
  errorText: {
    color: '#f00c27',
    marginTop: 10,
    fontWeight: '500'
  },

  // Add address Modal
  modalContainer: {
    backgroundColor: '#f5f5f5',
    flex: 1
  },
  headerPart: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 13,
    paddingHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 13,
    elevation: 5,
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
  saveAddress: {
    width: '90%',
    backgroundColor: '#ffcb44',
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 10,
    marginBottom: 10
  },
  // fixedBtm
  fixedBtm: {
    backgroundColor: '#28a745',
    width: '90%',
    alignSelf: 'center',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0
  },
  // Order Modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.65)', // slate overlay
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#fff',
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
  },
  phonePill: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneText: { color: '#065F46', fontWeight: '800', letterSpacing: 0.2 },

  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  primaryBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  primaryGrad: { paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  secondaryText: { color: '#334155', fontWeight: '800' },
  // Error Modal
  errorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorModalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    padding: 20,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  confirmDeleteBtn: {
    backgroundColor: '#FF6B35',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 7
  },
})