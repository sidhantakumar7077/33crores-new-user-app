import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  FlatList,
  Modal,
  ActivityIndicator,
  Animated, Easing,
  Linking
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome5';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import { Calendar } from 'react-native-calendars';
import moment from 'moment';
import { base_url } from '../../../App';

const Index = () => {

  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  const [spinner, setSpinner] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const openDatePicker = () => { setDatePickerVisibility(true) };
  const closeDatePicker = () => { setDatePickerVisibility(false) };

  const [dob, setDob] = useState(new Date());
  const [deliveryTime, setDeliveryTime] = useState(new Date(new Date().getTime() + 2 * 60 * 60 * 1000));
  const [openTimePicker, setOpenTimePicker] = useState(false);
  const [suggestions, setSuggestions] = useState("");
  const [addressError, setAddressError] = useState('');
  const [addressErrorMessageVisible, setAddressErrorMessageVisible] = useState(false);
  const [addAddressModal, setAddAddressModal] = useState(false);

  const [displayedAddresses, setDisplayedAddresses] = useState([]);
  const [selectedOption, setSelectedOption] = useState('');
  const [allAddresses, setAllAddresses] = useState([]);
  const [showAllAddresses, setShowAllAddresses] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [flowerRequestModalVisible, setFlowerRequestModalVisible] = useState(false);
  const closeFlowerRequestModal = () => { setFlowerRequestModalVisible(false) };

  const [errorModal, setErrorModal] = useState(false);
  const closeErrorModal = () => { setErrorModal(false); }
  const [errormasg, setErrormasg] = useState(null);
  const [flowerRequest, setFlowerRequest] = useState([]);

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

  const handleDayPress = (day) => {
    setDob(new Date(day.dateString));
    setDeliveryTime(new Date(new Date().getTime() + 2 * 60 * 60 * 1000));
    closeDatePicker();
  };

  const handleAddressChange = (option) => {
    setSelectedOption(option);
  };

  const getAllAddress = async () => {
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
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
        setAllAddresses(responseData.addressData);
        if (responseData.addressData.length === 1 && responseData.addressData[0].default === 0) {
          // handleDefaultAddress(responseData.addressData[0].id);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

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
          value: String(item.unique_code),
          pincode: item.pincode,
          apartment: item.apartment || [],
        }));
        setLocalityList(localityData);
      }
    } catch (error) {
      console.log('Error fetching localities:', error);
    }
  };

  const handleLocalitySelect = (value) => {
    setLocalityValue(value);
    const selectedLocality = localityList.find(locality => String(locality.value) === String(value));
    if (selectedLocality) {
      setPincode(selectedLocality.pincode);
      const apartments = selectedLocality.apartment.map(apartment => ({
        label: apartment.apartment_name,
        value: apartment.apartment_name,
      }));
      setApartmentList(apartments);
      setApartmentValue(null);
    } else {
      console.log('Locality not found in list.');
    }
  };

  const validateFields = () => {
    let valid = true;
    let errorsObj = {};

    if (seletedAddress === null) {
      errorsObj.residential = "Please select residential type";
      valid = false;
    }
    if (plotFlatNumber === "") {
      errorsObj.plotFlatNumber = "Plot/Flat Number is required";
      valid = false;
    }
    if (localityValue === null) {
      errorsObj.locality = "Locality is required";
      valid = false;
    }
    if (apartmentValue === null && newApartment === "") {
      errorsObj.apartment = "Apartment is required";
      valid = false;
    }
    if (landmark === "") {
      errorsObj.landmark = "Landmark is required";
      valid = false;
    }
    if (city === "") {
      errorsObj.city = "City is required";
      valid = false;
    }
    if (state === "") {
      errorsObj.state = "State is required";
      valid = false;
    }
    if (pincode === "") {
      errorsObj.pincode = "Pincode is required";
      valid = false;
    }
    if (pincode.length !== 6) {
      errorsObj.pincode = "Pincode must be 6 digits";
      valid = false;
    }
    if (activeAddressType === null) {
      errorsObj.activeAddressType = "Please select address type";
      valid = false;
    }

    setErrors(errorsObj);
    return valid;
  };

  const saveAddress = async () => {
    if (!validateFields()) return;
    const apartment = apartmentValue && apartmentValue !== 'add_new' ? apartmentValue : newApartment;
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
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

      if (responseData.success === 200) {
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

  useEffect(() => {
    if (allAddresses.length > 0) {
      setDisplayedAddresses(allAddresses.slice(0, 1));
    }
  }, [allAddresses]);

  const toggleAddresses = () => {
    setShowAllAddresses(!showAllAddresses);
    if (!showAllAddresses) {
      setDisplayedAddresses(allAddresses);
    } else {
      setDisplayedAddresses(allAddresses.slice(0, 1));
    }
  };

  // === NEW: Simple validators and helpers ===
  const isNonEmpty = (v) => v !== undefined && v !== null && String(v).trim() !== '';
  const toNumberOrNull = (v) => {
    if (v === null || v === undefined) return null;
    const n = parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  };

  // === NEW: Master data ===
  const [flowerNames, setFlowerNames] = useState([]);
  const [flowerUnits, setFlowerUnits] = useState([]);
  const garlandSizes = [
    { label: 'Small', value: 'small' },
    { label: 'Medium', value: 'medium' },
    { label: 'Large', value: 'large' },
  ];

  const [selectedType, setSelectedType] = useState('flower');
  const handleTypeSwitch = (type) => {
    setSelectedType(type);
    // Close dropdowns just in case
    setFlowerInput(prev => ({ ...prev, flowerNameOpen: false, flowerUnitOpen: false }));
    setGarlandInput(prev => ({ ...prev, garlandNameOpen: false, garlandSizeOpen: false }));
  };

  // === NEW: Single entry inputs + saved tables ===

  // Flower input (single row)
  const [flowerInput, setFlowerInput] = useState({
    flowerNameOpen: false,
    flowerUnitOpen: false,
    flowerName: null,
    flowerQuantity: '',
    flowerUnit: null,
  });

  // Saved flower rows
  const [savedFlowers, setSavedFlowers] = useState([]);

  // Garland input (single row)
  const [garlandInput, setGarlandInput] = useState({
    garlandNameOpen: false,
    garlandSizeOpen: false,
    garlandName: null,
    garlandQuantity: '', // number of garlands
    radioChoice: null, // 'count' | 'size'
    garlandCount: '', // only if radioChoice === 'count'
    garlandSize: null, // only if radioChoice === 'size'
  });

  // Saved garland rows
  const [savedGarlands, setSavedGarlands] = useState([]);

  // fetch units
  const getUnitList = async () => {
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    try {
      const response = await fetch(base_url + 'api/manageunit', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },
      });
      const responseData = await response.json();
      if (response.ok) {
        const units = responseData.data.map(unit => ({
          label: unit.unit_name,
          value: unit.unit_name
        }));
        setFlowerUnits(units);
      } else {
        console.error('Failed to fetch units:', responseData.message);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  // fetch products
  const getFlowerList = async () => {
    await fetch(base_url + 'api/products', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }).then(response => response.json()).then(response => {
      if (response.status === 200) {
        const flowers = response.data.filter(product => product.category === "Flower");
        const flowerNamesMap = flowers.map(flower => ({
          label: flower.name,
          value: flower.name
        }));
        setFlowerNames(flowerNamesMap);
      } else {
        console.error('Failed to fetch packages:', response.message);
      }
    }).catch((error) => {
      console.error('Error:', error);
    });
  };

  // fetch immediate product (for product_id)
  const getRequestFlowerData = async () => {
    setSpinner(true);
    await fetch(base_url + 'api/products', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }).then(response => response.json()).then(response => {
      if (response.status === 200) {
        setFlowerRequest(response.data.find(item => item.category === "Immediateproduct") || {});
        setSpinner(false);
      } else {
        setSpinner(false);
      }
      setSpinner(false);
    }).catch((error) => {
      setSpinner(false);
    });
  };

  const displayErrorMessage = (message) => {
    setAddressError(message);
    setAddressErrorMessageVisible(true);
    setTimeout(() => {
      setAddressErrorMessageVisible(false);
      setAddressError('');
    }, 10000);
  };

  // === NEW: validators for enabling save buttons ===
  const isFlowerInputValid = () => {
    return isNonEmpty(flowerInput.flowerName) &&
      isNonEmpty(flowerInput.flowerUnit) &&
      toNumberOrNull(flowerInput.flowerQuantity) !== null;
  };

  const isGarlandInputValid = () => {
    const qtyOK = toNumberOrNull(garlandInput.garlandQuantity) !== null;
    const basicOK = isNonEmpty(garlandInput.garlandName) && qtyOK && isNonEmpty(garlandInput.radioChoice);
    if (!basicOK) return false;
    if (garlandInput.radioChoice === 'count') {
      return toNumberOrNull(garlandInput.garlandCount) !== null;
    }
    if (garlandInput.radioChoice === 'size') {
      return isNonEmpty(garlandInput.garlandSize);
    }
    return false;
  };

  // === NEW: Save handlers ===
  const handleSaveFlower = () => {
    if (!isFlowerInputValid()) return;
    const row = {
      type: 'flower',
      flower_name: String(flowerInput.flowerName).trim(),
      flower_unit: String(flowerInput.flowerUnit).trim(),
      flower_quantity: toNumberOrNull(flowerInput.flowerQuantity),
    };
    setSavedFlowers(prev => [...prev, row]);
    // Reset the input
    setFlowerInput({
      flowerNameOpen: false,
      flowerUnitOpen: false,
      flowerName: null,
      flowerQuantity: '',
      flowerUnit: null,
    });
  };

  const handleSaveGarland = () => {
    if (!isGarlandInputValid()) return;
    const base = {
      type: 'garland',
      garland_name: String(garlandInput.garlandName).trim(),
      garland_quantity: toNumberOrNull(garlandInput.garlandQuantity), // number of garlands
    };
    let row = base;
    if (garlandInput.radioChoice === 'count') {
      row = { ...base, flower_count: toNumberOrNull(garlandInput.garlandCount), garland_size: null };
    } else {
      row = { ...base, flower_count: null, garland_size: String(garlandInput.garlandSize).trim() };
    }

    setSavedGarlands(prev => [...prev, row]);
    // Reset the input
    setGarlandInput({
      garlandNameOpen: false,
      garlandSizeOpen: false,
      garlandName: null,
      garlandQuantity: '',
      radioChoice: null,
      garlandCount: '',
      garlandSize: null,
    });
  };

  // === Build payload from saved tables ===
  const buildPayloadForApi = () => {
    const items = [
      ...savedFlowers.map((f, idx) => ({
        type: 'flower',
        flower_name: f.flower_name,
        flower_unit: f.flower_unit,
        flower_quantity: f.flower_quantity,
        // __row__: `F${idx + 1}`,
      })),
      ...savedGarlands.map((g, idx) => ({
        type: 'garland',
        garland_name: g.garland_name,
        garland_quantity: g.garland_quantity,
        flower_count: g.flower_count ?? null,
        garland_size: g.garland_size ?? null,
        // __row__: `G${idx + 1}`,
      }))
    ];

    return {
      product_id: flowerRequest?.product_id,
      address_id: selectedOption,
      suggestion: suggestions || '',
      date: moment(dob).format('YYYY-MM-DD'),
      time: moment(deliveryTime).format('HH:mm'),
      items,
    };
  };

  const handleAnyFlowerBuy = async () => {
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    setIsLoading(true);

    try {
      if (!selectedOption) {
        displayErrorMessage("Please Select Your Address");
        setIsLoading(false);
        return;
      }
      if (!flowerRequest?.product_id) {
        displayErrorMessage("Missing product id");
        setIsLoading(false);
        return;
      }

      const payload = buildPayloadForApi();

      if (!payload.items.length) {
        displayErrorMessage("Please save at least one Flower or Garland entry");
        setIsLoading(false);
        return;
      }

      console.log('Payload to API:', JSON.stringify(payload));
      // return; // Uncomment this to dry-run

      const response = await fetch(base_url + 'api/flower-requests', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(access_token ? { Authorization: `Bearer ${access_token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      if (response.ok) {
        setFlowerRequestModalVisible(true);
      } else {
        setErrorModal(true);
        setErrormasg(responseData?.message || 'Something went wrong');
      }
    } catch (error) {
      setErrorModal(true);
      setErrormasg(error?.message || String(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      getRequestFlowerData();
      getUnitList();
      getFlowerList();
      getAllAddress();
      getAllLocality();
    }
  }, [isFocused]);

  // === Renderers for saved tables ===
  const renderFlowerTable = () => {
    if (!savedFlowers.length) return null;
    return (
      <View style={styles.tableCard}>
        <Text style={styles.tableTitle}>Saved Flowers</Text>
        <View style={styles.tableHeaderRow}>
          {/* <Text style={[styles.tableCell, styles.th]}>#</Text> */}
          <Text style={[styles.tableCell, styles.th, { flex: 2 }]}>Flower</Text>
          <Text style={[styles.tableCell, styles.th]}>Qty</Text>
          <Text style={[styles.tableCell, styles.th]}>Unit</Text>
        </View>
        {savedFlowers.map((row, idx) => (
          <View key={`sf-${idx}`} style={styles.tableDataRow}>
            {/* <Text style={styles.tableCell}>{idx + 1}</Text> */}
            <Text style={[styles.tableCell, { flex: 2 }]}>{row.flower_name}</Text>
            <Text style={styles.tableCell}>{row.flower_quantity}</Text>
            <Text style={styles.tableCell}>{row.flower_unit}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderGarlandTable = () => {
    if (!savedGarlands.length) return null;
    return (
      <View style={styles.tableCard}>
        <Text style={styles.tableTitle}>Saved Garlands</Text>
        <View style={styles.tableHeaderRow}>
          {/* <Text style={[styles.tableCell, styles.th]}>#</Text> */}
          <Text style={[styles.tableCell, styles.th, { flex: 2 }]}>Flower</Text>
          <Text style={[styles.tableCell, styles.th]}>No. of Garlands</Text>
          <Text style={[styles.tableCell, styles.th]}>Flower Count</Text>
          <Text style={[styles.tableCell, styles.th]}>Size</Text>
        </View>
        {savedGarlands.map((row, idx) => (
          <View key={`sg-${idx}`} style={styles.tableDataRow}>
            {/* <Text style={styles.tableCell}>{idx + 1}</Text> */}
            <Text style={[styles.tableCell, { flex: 2 }]}>{row.garland_name}</Text>
            <Text style={styles.tableCell}>{row.garland_quantity}</Text>
            <Text style={styles.tableCell}>{row.flower_count ?? '-'}</Text>
            <Text style={styles.tableCell}>{row.garland_size ?? '-'}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.scrollView}>
        {/* Hero Header with Gradient */}
        <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.header}>
          <View style={styles.heroContent}>
            <TouchableOpacity style={styles.headerRow} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color="#FFFFFF" style={styles.backIcon} />
              <Text style={styles.heroTitle}>Custom Order</Text>
            </TouchableOpacity>
            <Text style={styles.heroSubtitle}>
              Create your own custom flower arrangements for any occasion
            </Text>
          </View>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginBottom: 50 }}>
          {/* Product Details */}
          <View style={styles.productDetails}>
            <View style={{ width: '35%', paddingVertical: 10 }}>
              <View style={styles.flowerImage}>
                <Image style={{ flex: 1, borderRadius: 8, resizeMode: 'cover' }} source={{ uri: flowerRequest.product_image }} />
              </View>
            </View>
            <View style={{ width: '60%', alignItems: 'flex-start', justifyContent: 'center' }}>
              <Text style={{ color: '#000', fontSize: 18, fontWeight: '500', textTransform: 'capitalize' }}>{flowerRequest.name}</Text>
              <Text style={{ color: '#000', fontSize: 14, fontWeight: '400', textTransform: 'capitalize', marginTop: 5 }}>Price :  {flowerRequest.immediate_price}</Text>
            </View>
          </View>

          {/* ===================== Flower / Garland Section (REWRITTEN) ===================== */}
          <View style={{ marginTop: 15, backgroundColor: '#fff', width: '100%', paddingHorizontal: 15, zIndex: 2000 }}>
            {/* Type Switch */}
            <View style={styles.typeSwitchWrapper}>
              <View style={styles.typeSwitch}>
                {['flower', 'garland'].map((type) => {
                  const isActive = selectedType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      activeOpacity={0.8}
                      style={[styles.typePill, isActive ? styles.typePillActive : styles.typePillInactive]}
                      onPress={() => handleTypeSwitch(type)}
                    >
                      {isActive ? (
                        <LinearGradient
                          colors={['#FF6B35', '#F7931E']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.typePillGradient}
                        >
                          <Image
                            source={type === 'flower' ? require('../../assets/images/flower.png') : require('../../assets/images/garland.png')}
                            style={{ width: 30, height: 30, marginRight: 8 }}
                          />
                          <Text style={styles.typePillTextActive}>
                            {type === 'flower' ? 'Flower' : 'Garland'}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <>
                          <Image
                            source={type === 'flower' ? require('../../assets/images/flower.png') : require('../../assets/images/garland.png')}
                            style={{ width: 30, height: 30, marginRight: 8 }}
                          />
                          <Text style={styles.typePillText}> {type === 'flower' ? 'Flower' : 'Garland'} </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Inputs */}
            <View style={{ marginTop: 12, paddingHorizontal: 12 }}>
              {selectedType === 'flower' ? (
                <View style={styles.detailCard}>
                  {/* Header */}
                  <View style={styles.detailHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <LinearGradient
                        colors={['#1E293B', '#334155']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.detailIconWrap}
                      >
                        <Image source={require('../../assets/images/flower.png')} style={{ width: 24, height: 24 }} />
                      </LinearGradient>
                      <Text style={styles.detailTitle}>Flower</Text>
                    </View>
                  </View>

                  {/* Fields: Flower, Quantity, Unit */}
                  <View style={{ marginTop: 12 }}>
                    {/* Flower & Quantity in one row */}
                    <View style={styles.row}>
                      <View style={[styles.col, { flex: 1, zIndex: 3000, elevation: 3000 }]}>
                        <Text style={styles.inputLabel}>Flower</Text>
                        <DropDownPicker
                          open={flowerInput.flowerNameOpen}
                          value={flowerInput.flowerName}
                          items={flowerNames}
                          setOpen={(open) => setFlowerInput(prev => ({ ...prev, flowerNameOpen: open }))}
                          setValue={(next) => {
                            const cur = flowerInput.flowerName;
                            const val = typeof next === 'function' ? next(cur) : next;
                            setFlowerInput(prev => ({ ...prev, flowerName: val }));
                          }}
                          placeholder="Select flower"
                          listMode="MODAL"
                          style={styles.ddInput}
                          dropDownContainerStyle={styles.ddContainer}
                          zIndex={3000}
                          zIndexInverse={1000}
                        />
                      </View>

                      <View style={[styles.col, { flex: 1 }]}>
                        <Text style={styles.inputLabel}>Quantity</Text>
                        <TextInput
                          style={styles.textInput}
                          onChangeText={(text) => setFlowerInput(prev => ({ ...prev, flowerQuantity: text }))}
                          value={flowerInput.flowerQuantity}
                          keyboardType="numeric"
                          placeholder="e.g. 2"
                          placeholderTextColor="#94a3b8"
                        />
                      </View>
                    </View>

                    {/* Unit & Save Button in one row */}
                    <View style={styles.row}>
                      <View style={[styles.col, { flex: 1, zIndex: 2500, elevation: 2500 }]}>
                        <Text style={styles.inputLabel}>Unit</Text>
                        <DropDownPicker
                          open={flowerInput.flowerUnitOpen}
                          value={flowerInput.flowerUnit}
                          items={flowerUnits}
                          setOpen={(open) => setFlowerInput(prev => ({ ...prev, flowerUnitOpen: open }))}
                          setValue={(next) => {
                            const cur = flowerInput.flowerUnit;
                            const val = typeof next === 'function' ? next(cur) : next;
                            setFlowerInput(prev => ({ ...prev, flowerUnit: val }));
                          }}
                          placeholder="Select unit"
                          listMode="MODAL"
                          style={styles.ddInput}
                          dropDownContainerStyle={styles.ddContainer}
                          zIndex={2500}
                          zIndexInverse={3000}
                        />
                      </View>

                      {/* fixed width save column to avoid being pushed off-screen */}
                      <View style={[styles.col, { width: 140, alignSelf: 'flex-end' }]}>
                        <TouchableOpacity
                          disabled={!isFlowerInputValid()}
                          onPress={handleSaveFlower}
                          style={[styles.saveRowBtn, !isFlowerInputValid() && { opacity: 0.5 }]}
                        >
                          <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.smallBtnGradient}>
                            <Text style={styles.smallBtnText}>Save</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.detailCard}>
                  {/* Header */}
                  <View style={styles.detailHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <LinearGradient
                        colors={['#1E293B', '#334155']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.detailIconWrap}
                      >
                        <Image source={require('../../assets/images/garland.png')} style={{ width: 24, height: 24 }} />
                      </LinearGradient>
                      <Text style={styles.detailTitle}>Garland</Text>
                    </View>
                  </View>

                  {/* Fields */}
                  <View style={{ marginTop: 12 }}>
                    {/* Garland (Flower name) */}
                    <View style={styles.row}>
                      <View style={[styles.col, { flex: 1.2, zIndex: 3000, elevation: 3000 }]}>
                        <Text style={styles.inputLabel}>Flower</Text>
                        <DropDownPicker
                          open={garlandInput.garlandNameOpen}
                          value={garlandInput.garlandName}
                          items={flowerNames} // reuse same list
                          setOpen={(open) => setGarlandInput(prev => ({ ...prev, garlandNameOpen: open }))}
                          setValue={(next) => {
                            const cur = garlandInput.garlandName;
                            const val = typeof next === 'function' ? next(cur) : next;
                            setGarlandInput(prev => ({ ...prev, garlandName: val }));
                          }}
                          placeholder="Select flower"
                          listMode="MODAL"
                          style={styles.ddInput}
                          dropDownContainerStyle={styles.ddContainer}
                          zIndex={3000}
                          zIndexInverse={1000}
                        />
                      </View>
                      {/* Number of Garlands */}
                      <View style={[styles.col, { flex: 0.8 }]}>
                        <Text style={styles.inputLabel}>No. of Garlands</Text>
                        <TextInput
                          style={styles.textInput}
                          onChangeText={(text) => setGarlandInput(prev => ({ ...prev, garlandQuantity: text }))}
                          value={garlandInput.garlandQuantity}
                          keyboardType="numeric"
                          placeholder="e.g. 2"
                          placeholderTextColor="#94a3b8"
                        />
                      </View>
                    </View>

                    {/* Radio: Flower Count or Garland Size */}
                    <View style={[styles.row, { marginTop: 12 }]}>
                      <TouchableOpacity
                        onPress={() => setGarlandInput(prev => ({ ...prev, radioChoice: 'count' }))}
                        style={[styles.radioPill, garlandInput.radioChoice === 'count' && styles.radioPillActive]}
                      >
                        <View style={[styles.radioCircle, garlandInput.radioChoice === 'count' && styles.radioCircleActive]}>
                          {garlandInput.radioChoice === 'count' && <View style={styles.radioDot} />}
                        </View>
                        <Text style={[styles.radioText, garlandInput.radioChoice === 'count' && styles.radioTextActive]}>Flower Count</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setGarlandInput(prev => ({ ...prev, radioChoice: 'size' }))}
                        style={[styles.radioPill, garlandInput.radioChoice === 'size' && styles.radioPillActive]}
                      >
                        <View style={[styles.radioCircle, garlandInput.radioChoice === 'size' && styles.radioCircleActive]}>
                          {garlandInput.radioChoice === 'size' && <View style={styles.radioDot} />}
                        </View>
                        <Text style={[styles.radioText, garlandInput.radioChoice === 'size' && styles.radioTextActive]}>Garland Size</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Conditional Field */}
                    {garlandInput.radioChoice === 'count' && (
                      <View style={[styles.row, { marginTop: 10 }]}>
                        <View style={[styles.col, { flex: 1 }]}>
                          <Text style={styles.inputLabel}>Flower Count</Text>
                          <TextInput
                            style={styles.textInput}
                            onChangeText={(text) => setGarlandInput(prev => ({ ...prev, garlandCount: text }))}
                            value={garlandInput.garlandCount}
                            keyboardType="numeric"
                            placeholder="e.g. 50"
                            placeholderTextColor="#94a3b8"
                          />
                        </View>
                      </View>
                    )}

                    {garlandInput.radioChoice === 'size' && (
                      <View style={[styles.row, { marginTop: 10 }]}>
                        <View style={[styles.col, { flex: 1, zIndex: 2000, elevation: 2000 }]}>
                          <Text style={styles.inputLabel}>Size</Text>
                          <DropDownPicker
                            open={garlandInput.garlandSizeOpen}
                            value={garlandInput.garlandSize}
                            items={garlandSizes}
                            setOpen={(open) => setGarlandInput(prev => ({ ...prev, garlandSizeOpen: open }))}
                            setValue={(next) => {
                              const cur = garlandInput.garlandSize;
                              const val = typeof next === 'function' ? next(cur) : next;
                              setGarlandInput(prev => ({ ...prev, garlandSize: val }));
                            }}
                            placeholder="Select size"
                            listMode="MODAL"
                            style={styles.ddInput}
                            dropDownContainerStyle={styles.ddContainer}
                            zIndex={2000}
                            zIndexInverse={2500}
                          />
                        </View>
                      </View>
                    )}

                    {/* Save Button */}
                    <TouchableOpacity
                      disabled={!isGarlandInputValid()}
                      onPress={handleSaveGarland}
                      style={[styles.saveRowBtn, !isGarlandInputValid() && { opacity: 0.5 }]}
                    >
                      <LinearGradient
                        colors={['#FF6B35', '#F7931E']}
                        style={styles.smallBtnGradient}
                      >
                        <Text style={styles.smallBtnText}>Save</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Saved table */}
              {renderFlowerTable()}
              {/* Saved table */}
              {renderGarlandTable()}
            </View>
          </View>
          {/* ===================== END REWRITTEN SECTION ===================== */}

          {/* Delivery Address And date & time */}
          <View style={styles.address}>
            <View style={{ width: '100%', marginBottom: 5 }}>
              <Text style={styles.label}>Delivery Flower Date</Text>
              <TouchableOpacity onPress={openDatePicker}>
                <TextInput
                  style={styles.input}
                  value={dob ? moment(dob).format('DD-MM-YYYY') : ""}
                  editable={false}
                />
                <MaterialCommunityIcons name="calendar-month" color={'#555454'} size={26} style={{ position: 'absolute', right: 10, top: 10 }} />
              </TouchableOpacity>
            </View>
            <View style={{ width: '100%', marginBottom: 15 }}>
              <Text style={styles.label}>Delivery Flower Time</Text>
              <TouchableOpacity onPress={() => setOpenTimePicker(true)}>
                <TextInput
                  style={styles.input}
                  value={deliveryTime ? moment(deliveryTime).format('hh:mm A') : ""}
                  editable={false}
                />
                <MaterialCommunityIcons name="av-timer" color={'#555454'} size={26} style={{ position: 'absolute', right: 10, top: 10 }} />
              </TouchableOpacity>
              <DatePicker
                modal
                mode="time"
                open={openTimePicker}
                date={deliveryTime}
                onConfirm={(date) => {
                  setDeliveryTime(date);
                  setOpenTimePicker(false);
                }}
                onCancel={() => setOpenTimePicker(false)}
                minimumDate={dob?.toDateString() === new Date().toDateString() ? new Date(new Date().getTime() + 2 * 60 * 60 * 1000) : undefined}
              />
            </View>
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
                keyExtractor={(item) => item.id.toString()}
                renderItem={(address) => {
                  return (
                    <TouchableOpacity onPress={() => handleAddressChange(address?.item?.id)} style={{ borderColor: '#edeff1', borderWidth: 1, padding: 10, flexDirection: 'row', alignItems: 'center', borderRadius: 8, marginVertical: 5 }}>
                      <View style={{ width: '8%', alignSelf: 'flex-start', marginTop: 2 }}>
                        {address?.item?.address_type === "Home" && <Feather name="home" color={'#555454'} size={18} />}
                        {address?.item?.address_type === "Work" && <Feather name="briefcase" color={'#555454'} size={17} />}
                        {address?.item?.address_type === "Other" && <Feather name="globe" color={'#555454'} size={17} />}
                      </View>
                      <View style={{ width: '82%' }}>
                        <View>
                          {address?.item?.address_type === "Home" && <Text style={{ color: '#000', fontSize: 15, fontWeight: '600' }}>Home</Text>}
                          {address?.item?.address_type === "Work" && <Text style={{ color: '#000', fontSize: 15, fontWeight: '600' }}>Work</Text>}
                          {address?.item?.address_type === "Other" && <Text style={{ color: '#000', fontSize: 15, fontWeight: '600' }}>Other</Text>}
                        </View>
                        <Text style={{ color: '#555454', fontSize: 13 }}>{address?.item?.apartment_name},  {address?.item?.apartment_flat_plot},  {address?.item?.landmark}</Text>
                        <Text style={{ color: '#555454', fontSize: 13 }}>{address?.item?.locality_details?.locality_name},  {address?.item?.city},  {address?.item?.state}</Text>
                        <Text style={{ color: '#555454', fontSize: 13 }}>{address?.item?.pincode},  {address?.item?.place_category}</Text>
                      </View>
                      <View style={{ width: '10%', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedOption === address?.item?.id ?
                          <MaterialCommunityIcons name="record-circle" color={'#ffcb44'} size={24} />
                          :
                          < Feather name="circle" color={'#555454'} size={20} />
                        }
                      </View>
                    </TouchableOpacity>
                  )
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

        {isLoading ? (
          <ActivityIndicator size="large" color="#c80100" />
        ) : (
          <TouchableOpacity onPress={handleAnyFlowerBuy}>
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
              minDate={moment().format('YYYY-MM-DD')}
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
                />
              </View>
              {errors.locality && <Text style={styles.errorText}>{errors.locality}</Text>}
            </View>

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
                      { label: 'Add Your Apartment', value: 'add_new' },
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
                  value={pincode}
                  maxLength={6}
                  editable={false}
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
          <TouchableOpacity onPress={saveAddress} style={styles.saveAddress}>
            <Text style={{ color: '#000', fontSize: 17, fontWeight: '600' }}>Save Address</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Flower Request Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={flowerRequestModalVisible}
        onRequestClose={closeFlowerRequestModal}
      >
        <View style={styles.pModalContainer}>
          <View style={styles.pModalContent}>
            <Animated.View style={[styles.pModalCheckCircle, { transform: [{ scale: scaleAnim }] }]}>
              <FontAwesome name='check' color={'#fff'} size={60} />
            </Animated.View>
            <Text style={styles.pModalCongratulationsText}>Congratulations!</Text>
            <Text style={styles.pModalDetailText}>Your order has been placed successfully.</Text>
            <Text style={[styles.pModalDetailText, { marginTop: 10 }]}>For any inquiry call us at this number</Text>
            <TouchableOpacity onPress={() => Linking.openURL('tel:9776888887')}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '500', textAlign: 'center', marginTop: 5 }}>9776888887</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => navigation.replace('MyOrder')} style={styles.pModalButton}>
            <Text style={styles.pModalButtonText}>Order Details</Text>
          </TouchableOpacity>
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
  heroContent: {},
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
  productDetails: {
    width: '95%',
    alignSelf: 'center',
    marginTop: 15,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  flowerImage: {
    height: 120,
    width: 120,
    borderRadius: 8,
    backgroundColor: '#6c757d'
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },

  // Address And date & time styles
  address: {
    marginTop: 15,
    backgroundColor: '#fff',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 15,
    zIndex: 1000
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

  // Buy Now Button
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

  // Address Modal styles
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
  errorText: {
    color: '#f00c27',
    marginTop: 10,
    fontWeight: '500'
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
    marginBottom: 15
  },

  // Success Modal styles
  pModalContainer: {
    flex: 1,
    backgroundColor: '#141416',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  pModalContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pModalCheckCircle: {
    marginBottom: 20,
    width: 120,
    height: 120,
    borderRadius: 100,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pModalCongratulationsText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff'
  },
  pModalDetailText: {
    fontSize: 16,
    color: '#b6b6b6',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  pModalButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 8,
    top: 100
  },
  pModalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
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
  confirmDeleteBtn: {
    backgroundColor: 'green',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 7
  },
  btnText: {
    color: '#fff',
    fontWeight: '700'
  },

  // Segmented switch
  typeSwitchWrapper: {
    paddingHorizontal: 12,
    marginTop: 12,
  },
  typeSwitch: {
    backgroundColor: '#e2e8f0',
    borderRadius: 14,
    padding: 6,
    flexDirection: 'row',
  },
  typePill: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  typePillInactive: {},
  typePillGradient: {
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  typePillText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 14,
  },
  typePillTextActive: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Card
  detailCard: {
    width: '100%',
    padding: 14,
    marginVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },

  // Grid
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  col: {},

  // Inputs
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  textInput: {
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },

  ddInput: {
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginTop: 0,
    backgroundColor: '#f8fafc',
    minHeight: 44,
  },
  ddContainer: {
    borderColor: '#e2e8f0',
  },

  // Save row button
  saveRowBtn: {
    height: 44,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
  },
  smallBtnGradient: {
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  smallBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Radio pills
  radioPill: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  radioPillActive: {
    borderColor: '#FF6B35',
    backgroundColor: '#fff7ed',
  },
  radioCircle: {
    height: 18,
    width: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioCircleActive: {
    borderColor: '#FF6B35',
  },
  radioDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
  },
  radioText: {
    color: '#334155',
    fontWeight: '600',
  },
  radioTextActive: {
    color: '#FF6B35',
  },

  // Table card
  tableCard: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableTitle: {
    padding: 12,
    fontWeight: '700',
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableDataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableCell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  th: {
    fontWeight: '700',
    color: '#334155',
  },
});
