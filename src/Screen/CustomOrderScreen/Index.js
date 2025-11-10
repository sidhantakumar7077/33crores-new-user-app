import React, { useRef, useState, useEffect, useMemo, useRef as useRefAlias } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Pressable,
  TextInput,
  SafeAreaView,
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
import Icon from 'react-native-vector-icons/FontAwesome5';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation, useIsFocused, useRoute } from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import { Calendar } from 'react-native-calendars';
import moment from 'moment';
import { base_url } from '../../../App';

const Index = () => {

  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  const route = useRoute();
  const reorderFrom = route?.params?.reorderFrom || null;

  // prevent double rehydrate on focus/refetches
  const didHydrateFromReorder = useRef(false);

  const [spinner, setSpinner] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const openDatePicker = () => { setDatePickerVisibility(true) };
  const closeDatePicker = () => { setDatePickerVisibility(false) };

  const CUTOFF_PM = 17;     // 5 PM
  const CUTOFF_AM = 7;      // 7 AM

  // 10:00 AM on the given day
  const at10AM = (m) => m.clone().hour(10).minute(0).second(0).millisecond(0);

  // DEFAULT start date/time when the screen opens
  const getInitialDobAndTime = () => {
    const now = moment();

    // Rule #2 defaults
    if (now.hour() >= CUTOFF_PM) {
      // after 5 PM → default: tomorrow 10:00 AM
      const dob = now.clone().add(1, 'day').startOf('day');
      return { dob: dob.toDate(), time: at10AM(dob).toDate() };
    }
    if (now.hour() < CUTOFF_AM) {
      // before 7 AM → default: today 10:00 AM
      const dob = now.clone().startOf('day');
      return { dob: dob.toDate(), time: at10AM(dob).toDate() };
    }

    // Daytime (>=7 AM and <5 PM)
    // Same-day allowed, but must be >= now+2h
    const dob = now.clone().startOf('day'); // today
    const minToday = now.clone().add(2, 'hours'); // earliest valid today
    return { dob: dob.toDate(), time: minToday.toDate() /* or roundTo15(minToday).toDate() */ };
  };

  // Compute min selectable time for the currently selected date
  const getMinTimeForDate = (selectedDate) => {
    const now = moment();
    const sel = moment(selectedDate);
    if (sel.isSame(now, 'day')) {
      // today → must be >= now+2h, but if we're before 7AM, 10AM default still OK
      const base = now.clone().add(2, 'hours');
      return base.toDate();
    }
    // future dates → no lower bound (you can also return 10AM if you want to guide users)
    return undefined;
  };

  // INITIAL DEFAULTS
  const { dob: initialDob, time: initialTime } = getInitialDobAndTime();
  const [dob, setDob] = useState(initialDob);              // Date object
  const [deliveryTime, setDeliveryTime] = useState(initialTime);

  // const [dob, setDob] = useState(new Date());
  // const [deliveryTime, setDeliveryTime] = useState(new Date(new Date().getTime() + 2 * 60 * 60 * 1000));
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
    const picked = moment(day?.dateString, 'YYYY-MM-DD', true);
    const now = moment();

    // If user selects "today" after 5PM → bump to tomorrow 10AM (rule #2)
    if (picked.isSame(now, 'day') && now.hour() >= CUTOFF_PM) {
      const tmr = now.clone().add(1, 'day').startOf('day');
      setDob(tmr.toDate());
      setDeliveryTime(at10AM(tmr).toDate());
      closeDatePicker();
      return;
    }

    // Set selected date
    setDob(picked.toDate());

    // Default time per rules:
    if (picked.isSame(now, 'day')) {
      // Same-day: at least now + 2h (rule #1)
      const minToday = now.clone().add(2, 'hours');
      setDeliveryTime(minToday.toDate());
    } else {
      // Future date: default 10AM of that day
      setDeliveryTime(at10AM(picked).toDate());
    }

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

  const joinParts = (...vals) =>
    vals
      .filter(v => v !== null && v !== undefined && String(v).trim() !== '')
      .map(v => String(v).trim())
      .join(',  ');

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
    if (selectedOption === 'apartment' && (apartmentValue === null && newApartment === "")) {
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
  // 1 ft to 20 ft
  const garlandSizes = Array.from({ length: 20 }, (_, i) => {
    const ft = i + 1;
    return { label: `${ft} ft`, value: ft }; // use `${ft}` if you need a string
  });

  const [selectedType, setSelectedType] = useState('flower');
  const handleTypeSwitch = (type) => {
    setSelectedType(type);
    // Close dropdowns just in case
    setFlowerInput(prev => ({ ...prev, flowerNameOpen: false, flowerUnitOpen: false }));
    setGarlandInput(prev => ({ ...prev, garlandNameOpen: false, garlandSizeOpen: false }));
  };

  // === NEW: Single entry inputs + saved tables ===

  useEffect(() => {
    if (!reorderFrom || didHydrateFromReorder.current) return;

    // --- Items as you already do ---
    const items = Array.isArray(reorderFrom?.flower_request_items)
      ? reorderFrom.flower_request_items
      : [];
    const flowers = items.filter(i => i?.type === 'flower').map(mapFlower);
    const garlands = items.filter(i => i?.type === 'garland').map(mapGarland);
    setSavedFlowers(flowers);
    setSavedGarlands(garlands);

    const now = moment();
    const today = now.clone().startOf('day');

    // ---- Decide DOB ----
    let effectiveDob = today; // default
    let reorderMoment = null;
    if (reorderFrom?.date) {
      const parsedDate = moment(reorderFrom.date, ['YYYY-MM-DD', moment.ISO_8601], true);
      if (parsedDate.isValid()) reorderMoment = parsedDate.clone().startOf('day');
    }

    if (reorderMoment) {
      if (reorderMoment.isSame(today, 'day')) {
        // 1) Reorder date is TODAY -> keep today
        effectiveDob = today;
      } else if (reorderMoment.isBefore(today, 'day')) {
        // 2) Reorder date is BEFORE TODAY -> apply your rules
        if (now.hour() >= CUTOFF_PM) {
          // after 5pm -> default to tomorrow 10AM
          effectiveDob = today.clone().add(1, 'day');
        } else if (now.hour() < CUTOFF_AM) {
          // before 7am -> default to today 10AM
          effectiveDob = today;
        } else {
          // 7am–5pm -> same-day allowed with 2h lead
          effectiveDob = today;
        }
      } else {
        // (Optional) If reorder date is in the FUTURE, respect it
        effectiveDob = reorderMoment;
      }
    }

    setDob(effectiveDob.toDate());

    // ---- Decide TIME ----
    // Try to use reorder time if present; otherwise fill per rules.
    const parsedTime = reorderFrom?.time
      ? moment(reorderFrom.time, ['HH:mm', 'hh:mm A', moment.ISO_8601], true)
      : null;

    const isNightWindow = now.hour() >= CUTOFF_PM || now.hour() < CUTOFF_AM;
    const isDobToday = effectiveDob && moment(effectiveDob).isSame(today, 'day');

    let nextTime;

    if (reorderMoment && reorderMoment.isBefore(today, 'day')) {
      // REORDER DATE IN THE PAST -> apply your 2 rules
      if (isNightWindow) {
        // 5pm–7am -> 10AM (tomorrow if after 5pm, today if before 7am)
        nextTime = at10AM(moment(effectiveDob));
      } else {
        // 7am–5pm -> same-day allowed with 2h lead
        const minToday = now.clone().add(2, 'hours');
        nextTime = minToday;
      }
    } else if (reorderMoment && reorderMoment.isSame(today, 'day')) {
      // REORDER DATE IS TODAY
      if (parsedTime?.isValid()) {
        // use reorder time but clamp to >= now + 2h
        const proposed = moment(effectiveDob)
          .hour(parsedTime.hour())
          .minute(parsedTime.minute())
          .second(0)
          .millisecond(0);
        const minToday = now.clone().add(2, 'hours');
        nextTime = proposed.isBefore(minToday) ? minToday : proposed;
      } else {
        // no time -> default to now + 2h
        nextTime = now.clone().add(2, 'hours');
      }
    } else {
      // FUTURE DATE or no reorder date
      if (parsedTime?.isValid()) {
        nextTime = moment(effectiveDob)
          .hour(parsedTime.hour())
          .minute(parsedTime.minute())
          .second(0)
          .millisecond(0);
      } else {
        nextTime = at10AM(moment(effectiveDob));
      }
    }

    setDeliveryTime(nextTime.toDate());

    // --- Suggestions / address / product (unchanged) ---
    setSuggestions(reorderFrom?.suggestion || '');
    setSelectedOption(reorderFrom?.address?.id ?? null);
    if (reorderFrom?.flower_product) {
      setFlowerRequest(prev => ({
        ...prev,
        product_id: reorderFrom.flower_product.product_id ?? prev?.product_id,
        name: reorderFrom.flower_product.name ?? prev?.name,
        immediate_price: prev?.immediate_price,
        product_image: reorderFrom.flower_product.product_image_url ?? prev?.product_image,
      }));
    }

    didHydrateFromReorder.current = true;
  }, [reorderFrom]); // eslint-disable-line react-hooks/exhaustive-deps

  const mapFlower = (it) => ({
    type: 'flower',
    flower_name: String(it?.flower_name ?? ''),
    flower_unit: String(it?.flower_unit ?? ''),
    flower_quantity: Number(it?.flower_quantity ?? 0),
  });

  const mapGarland = (it) => ({
    type: 'garland',
    garland_name: String(it?.garland_name ?? ''),
    garland_quantity: Number(it?.garland_quantity ?? 0),
    flower_count: it?.flower_count != null ? Number(it.flower_count) : null,
    garland_size: it?.garland_size ?? null,
  });

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

  // --- Edit FLOWER state ---
  const [editFlowerVisible, setEditFlowerVisible] = useState(false);
  const [editingFlowerIndex, setEditingFlowerIndex] = useState(null);
  const [editingFlower, setEditingFlower] = useState({
    flowerName: null,
    flowerQuantity: '',
    flowerUnit: null,
  });

  // --- Edit GARLAND state ---
  const [editGarlandVisible, setEditGarlandVisible] = useState(false);
  const [editingGarlandIndex, setEditingGarlandIndex] = useState(null);
  const [editingGarland, setEditingGarland] = useState({
    garlandName: null,
    garlandQuantity: '',
    radioChoice: null,
    garlandCount: '',
    garlandSize: null,
  });

  // Launch edit for a FLOWER row
  const startEditFlower = (idx) => {
    const f = savedFlowers[idx];
    setEditingFlowerIndex(idx);
    setEditingFlower({
      flowerName: f.flower_name ?? null,
      flowerQuantity: String(f.flower_quantity ?? ''),
      flowerUnit: f.flower_unit ?? null,
    });
    setEditFlowerVisible(true);
  };

  // Validate + save edited FLOWER
  const isEditingFlowerValid = () =>
    isNonEmpty(editingFlower.flowerName) &&
    isNonEmpty(editingFlower.flowerUnit) &&
    toNumberOrNull(editingFlower.flowerQuantity) !== null;

  const handleUpdateFlower = () => {
    if (!isEditingFlowerValid() || editingFlowerIndex === null) return;
    setSavedFlowers(prev =>
      prev.map((row, i) =>
        i === editingFlowerIndex
          ? {
            ...row,
            flower_name: editingFlower.flowerName,
            flower_unit: editingFlower.flowerUnit,
            flower_quantity: toNumberOrNull(editingFlower.flowerQuantity),
          }
          : row
      )
    );
    setEditFlowerVisible(false);
    setEditingFlowerIndex(null);
  };

  // Launch edit for a GARLAND row
  const startEditGarland = (idx) => {
    const g = savedGarlands[idx];
    setEditingGarlandIndex(idx);
    setEditingGarland({
      garlandName: g.garland_name ?? null,
      garlandQuantity: String(g.garland_quantity ?? ''),
      radioChoice: g.flower_count != null ? 'count' : 'size',
      garlandCount: g.flower_count != null ? String(g.flower_count) : '',
      garlandSize: g.garland_size != null ? g.garland_size : null,
    });
    setEditGarlandVisible(true);
  };

  // Validate + save edited GARLAND
  const isEditingGarlandValid = () => {
    const qtyOK = toNumberOrNull(editingGarland.garlandQuantity) !== null;
    const basicOK =
      isNonEmpty(editingGarland.garlandName) && qtyOK && isNonEmpty(editingGarland.radioChoice);
    if (!basicOK) return false;
    if (editingGarland.radioChoice === 'count') {
      return toNumberOrNull(editingGarland.garlandCount) !== null;
    }
    if (editingGarland.radioChoice === 'size') {
      return isNonEmpty(editingGarland.garlandSize);
    }
    return false;
  };

  const handleUpdateGarland = () => {
    if (!isEditingGarlandValid() || editingGarlandIndex === null) return;
    setSavedGarlands(prev =>
      prev.map((row, i) =>
        i === editingGarlandIndex
          ? {
            type: 'garland',
            garland_name: editingGarland.garlandName,
            garland_quantity: toNumberOrNull(editingGarland.garlandQuantity),
            flower_count:
              editingGarland.radioChoice === 'count'
                ? toNumberOrNull(editingGarland.garlandCount)
                : null,
            garland_size:
              editingGarland.radioChoice === 'size' ? editingGarland.garlandSize : null,
          }
          : row
      )
    );
    setEditGarlandVisible(false);
    setEditingGarlandIndex(null);
  };

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

  const removeFlowerAt = (index) => {
    setSavedFlowers((prev) => prev.filter((_, i) => i !== index));
  };

  const removeGarlandAt = (index) => {
    setSavedGarlands((prev) => prev.filter((_, i) => i !== index));
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
        // displayErrorMessage("Please Select Your Address");
        setErrormasg("Please Select/Add Your Address");
        setErrorModal(true);
        setIsLoading(false);
        return;
      }
      if (!flowerRequest?.product_id) {
        setErrormasg("Missing product id");
        setErrorModal(true);
        setIsLoading(false);
        return;
      }

      const payload = buildPayloadForApi();
      // console.log("Built payload:", payload);
      // return; // Uncomment this to dry-run

      if (!payload.items.length) {
        // displayErrorMessage("Please save at least one Flower or Garland entry");
        setErrormasg("Please save at least one Flower or Garland entry");
        setErrorModal(true);
        setIsLoading(false);
        return;
      }

      // console.log('Payload to API:', JSON.stringify(payload));
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
          <Text style={[styles.tableCell, styles.th, { flex: 2 }]}>Flower</Text>
          <Text style={[styles.tableCell, styles.th]}>Qty</Text>
          <Text style={[styles.tableCell, styles.th]}>Unit</Text>
          <View style={[styles.tableCell, styles.actionCellHeader]}>
            <Feather name="trash-2" size={14} color="#64748B" />
          </View>
        </View>
        {savedFlowers.map((row, idx) => (
          <View key={`sf-${idx}`} style={styles.tableDataRow}>
            <Text style={[styles.tableCell, { flex: 2 }]}>{row.flower_name}</Text>
            <Text style={styles.tableCell}>{row.flower_quantity}</Text>
            <Text style={styles.tableCell}>{row.flower_unit}</Text>
            <View style={[styles.tableCell, styles.actionCell]}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => startEditFlower(idx)}
                  style={[styles.iconBtn, { backgroundColor: '#EFF6FF' }]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="edit-2" size={16} color="#2563EB" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => removeFlowerAt(idx)}
                  style={styles.iconBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="trash-2" size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
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
          <View style={[styles.tableCell, styles.actionCellHeader]}>
            <Feather name="trash-2" size={14} color="#64748B" />
          </View>
        </View>
        {savedGarlands.map((row, idx) => (
          <View key={`sg-${idx}`} style={styles.tableDataRow}>
            {/* <Text style={styles.tableCell}>{idx + 1}</Text> */}
            <Text style={[styles.tableCell, { flex: 2 }]}>{row.garland_name}</Text>
            <Text style={styles.tableCell}>{row.garland_quantity}</Text>
            <Text style={styles.tableCell}>{row.flower_count ?? '-'}</Text>
            <Text style={styles.tableCell}>{row.garland_size ?? '-'}</Text>
            <View style={[styles.tableCell, styles.actionCell]}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => startEditGarland(idx)}
                  style={[styles.iconBtn, { backgroundColor: '#EFF6FF' }]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="edit-2" size={16} color="#2563EB" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => removeGarlandAt(idx)}
                  style={styles.iconBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="trash-2" size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // Modal toggles for pickers
  const [modalFlowerName, setModalFlowerName] = useState(false);
  const [modalFlowerUnit, setModalFlowerUnit] = useState(false);
  const [modalGarlandName, setModalGarlandName] = useState(false);
  const [modalGarlandSize, setModalGarlandSize] = useState(false);

  // Reusable modal selector with search + list
  const SelectModal = ({
    visible,
    title = 'Select',
    data = [],             // [{label, value}]
    selectedValue = null,  // current value
    onClose,
    onSelect,
    showSearch = true,
  }) => {
    const [query, setQuery] = useState('');
    const filtered = useMemo(() => {
      if (!query.trim()) return data;
      const q = query.toLowerCase();
      return data.filter(i => String(i.label).toLowerCase().includes(q));
    }, [query, data]);

    return (
      <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          {/* sheet */}
          <View style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 18,
            maxHeight: '75%',
          }}>
            {/* handle */}
            <View style={{
              alignSelf: 'center',
              width: 40, height: 4, borderRadius: 999, backgroundColor: '#E5E7EB', marginBottom: 10,
            }} />

            {/* header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ flex: 1, fontSize: 18, fontWeight: '900', color: '#0f172a' }}>{title}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name="x" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>

            {/* search */}
            {showSearch && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10,
                paddingHorizontal: 10, backgroundColor: '#f8fafc', marginBottom: 10
              }}>
                <Feather name="search" size={16} color="#475569" />
                <TextInput
                  style={{ height: 42, flex: 1, paddingLeft: 8, color: '#0f172a' }}
                  placeholder="Search..."
                  placeholderTextColor="#94a3b8"
                  value={query}
                  onChangeText={setQuery}
                />
                {query ? (
                  <TouchableOpacity onPress={() => setQuery('')}>
                    <Feather name="x-circle" size={18} color="#94a3b8" />
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            {/* list */}
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {filtered.map((item, idx) => {
                const isActive = selectedValue === item.value;
                return (
                  <TouchableOpacity
                    key={`${item.value}-${idx}`}
                    onPress={() => { onSelect(item.value); onClose(); }}
                    activeOpacity={0.8}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      paddingVertical: 12, paddingHorizontal: 6,
                      borderBottomWidth: idx === filtered.length - 1 ? 0 : 1,
                      borderBottomColor: '#eef2f7'
                    }}
                  >
                    <View style={{
                      width: 28, height: 28, borderRadius: 14,
                      alignItems: 'center', justifyContent: 'center',
                      backgroundColor: isActive ? '#e0f2fe' : '#f1f5f9', marginRight: 10
                    }}>
                      <Feather name="tag" size={14} color={isActive ? '#0284c7' : '#475569'} />
                    </View>
                    <Text style={{ flex: 1, color: '#0f172a', fontSize: 15, fontWeight: isActive ? '800' : '600' }}>
                      {item.label}
                    </Text>
                    {isActive ? <Feather name="check" size={18} color="#16a34a" /> : null}
                  </TouchableOpacity>
                );
              })}
              {!filtered.length && (
                <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                  <Text style={{ color: '#64748b', fontWeight: '700' }}>No results</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} style={{ flex: 1, marginBottom: 50 }}>
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
                        <View style={[styles.col, { flex: 1 }]}>
                          <Text style={styles.inputLabel}>Flower</Text>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setModalFlowerName(true)}
                            style={styles.textInput}
                          >
                            <Text style={{ color: flowerInput.flowerName ? '#0f172a' : '#94a3b8', fontSize: 15, marginTop: 8 }}>
                              {flowerInput.flowerName
                                ? (flowerNames.find(f => f.value === flowerInput.flowerName)?.label || flowerInput.flowerName)
                                : 'Select flower'}
                            </Text>
                            <Feather
                              name="chevron-down"
                              size={18}
                              color="#64748B"
                              style={{ position: 'absolute', right: 12, top: 13 }}
                            />
                          </TouchableOpacity>
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
                        <View style={[styles.col, { flex: 1 }]}>
                          <Text style={styles.inputLabel}>Unit</Text>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setModalFlowerUnit(true)}
                            style={styles.textInput}
                          >
                            <Text style={{ color: flowerInput.flowerUnit ? '#0f172a' : '#94a3b8', fontSize: 15, marginTop: 8 }}>
                              {flowerInput.flowerUnit
                                ? (flowerUnits.find(u => u.value === flowerInput.flowerUnit)?.label || flowerInput.flowerUnit)
                                : 'Select unit'}
                            </Text>
                            <Feather
                              name="chevron-down"
                              size={18}
                              color="#64748B"
                              style={{ position: 'absolute', right: 12, top: 13 }}
                            />
                          </TouchableOpacity>
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
                        <View style={[styles.col, { flex: 1.2 }]}>
                          <Text style={styles.inputLabel}>Flower</Text>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setModalGarlandName(true)}
                            style={styles.textInput}
                          >
                            <Text style={{ color: garlandInput.garlandName ? '#0f172a' : '#94a3b8', fontSize: 15, marginTop: 8 }}>
                              {garlandInput.garlandName
                                ? (flowerNames.find(f => f.value === garlandInput.garlandName)?.label || garlandInput.garlandName)
                                : 'Select flower'}
                            </Text>
                            <Feather
                              name="chevron-down"
                              size={18}
                              color="#64748B"
                              style={{ position: 'absolute', right: 12, top: 13 }}
                            />
                          </TouchableOpacity>
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
                          <View style={[styles.col, { flex: 1 }]}>
                            <Text style={styles.inputLabel}>Size</Text>
                            <TouchableOpacity
                              activeOpacity={0.8}
                              onPress={() => setModalGarlandSize(true)}
                              style={styles.textInput}
                            >
                              <Text style={{ color: garlandInput.garlandSize ? '#0f172a' : '#94a3b8', fontSize: 15, marginTop: 8 }}>
                                {garlandInput.garlandSize
                                  ? (garlandSizes.find(s => s.value === garlandInput.garlandSize)?.label || `${garlandInput.garlandSize}`)
                                  : 'Select size'}
                              </Text>
                              <Feather
                                name="chevron-down"
                                size={18}
                                color="#64748B"
                                style={{ position: 'absolute', right: 12, top: 13 }}
                              />
                            </TouchableOpacity>
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
                    const selected = moment(date);
                    const now = moment();
                    if (moment(dob).isSame(now, 'day')) {
                      const minToday = now.clone().add(2, 'hours');
                      // Clamp to >= now+2h
                      setDeliveryTime(selected.isBefore(minToday) ? minToday.toDate() : selected.toDate());
                    } else {
                      setDeliveryTime(selected.toDate());
                    }
                    setOpenTimePicker(false);
                  }}
                  onCancel={() => setOpenTimePicker(false)}
                  // Only enforce a minimum when it's today
                  minimumDate={
                    moment(dob).isSame(moment(), 'day')
                      ? moment().add(2, 'hours').toDate()
                      : undefined
                  }
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
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 15, alignItems: 'center' }}>
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
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {isLoading ? (
          <ActivityIndicator size="large" color="#c80100" />
        ) : (
          <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.fixedBtm}>
            <Pressable hitSlop={10} style={({ pressed }) => [styles.buyNowBtn, pressed && { opacity: 0.3 }]} onPress={handleAnyFlowerBuy} disabled={isLoading}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>BUY NOW</Text>
              <Feather name="arrow-right" color={'#fff'} size={24} marginLeft={10} marginTop={3} />
            </Pressable>
          </LinearGradient>
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
          <TouchableOpacity onPress={saveAddress}>
            <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.saveAddress}>
              <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>Save Address</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Flower Request Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={flowerRequestModalVisible}
        onRequestClose={closeFlowerRequestModal}
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
              <TouchableOpacity onPress={() => navigation.replace('CustomOrderHistory')} activeOpacity={0.9} style={styles.primaryBtn}>
                <LinearGradient colors={['#F59E0B', '#F97316']} style={styles.primaryGrad}>
                  <Text style={styles.primaryText}>Order Details</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { closeFlowerRequestModal(); navigation.goBack() }} activeOpacity={0.9} style={styles.secondaryBtn}>
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
                <MaterialIcons name="report-gmailerrorred" size={80} color="red" />
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

      {/* Edit Flower Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={editFlowerVisible}
        onRequestClose={() => setEditFlowerVisible(false)}
      >
        <View style={styles.errorModalOverlay}>
          <View style={[styles.errorModalContainer, { paddingBottom: 10 }]}>
            <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: '800', marginBottom: 12 }}>
              Edit Flower
            </Text>

            {/* Flower */}
            <Text style={styles.inputLabel}>Flower</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.textInput}
            >
              <Text style={{ color: editingFlower.flowerName ? '#0f172a' : '#94a3b8', fontSize: 15, marginTop: 8 }}>
                {editingFlower.flowerName
                  ? (flowerNames.find(f => f.value === editingFlower.flowerName)?.label || editingFlower.flowerName)
                  : 'Select flower'}
              </Text>
              <Feather name="chevron-down" size={18} color="#64748B" style={{ position: 'absolute', right: 12, top: 13 }} />
            </TouchableOpacity>

            {/* Quantity */}
            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Quantity</Text>
            <TextInput
              style={styles.textInput}
              value={editingFlower.flowerQuantity}
              onChangeText={t => setEditingFlower(prev => ({ ...prev, flowerQuantity: t }))}
              keyboardType="numeric"
              placeholder="e.g. 2"
              placeholderTextColor="#94a3b8"
            />

            {/* Unit */}
            <Text style={[styles.inputLabel, { marginTop: 10 }]}>Unit</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setModalFlowerUnit(true)}
              style={styles.textInput}
            >
              <Text style={{ color: editingFlower.flowerUnit ? '#0f172a' : '#94a3b8', fontSize: 15, marginTop: 8 }}>
                {editingFlower.flowerUnit
                  ? (flowerUnits.find(u => u.value === editingFlower.flowerUnit)?.label || editingFlower.flowerUnit)
                  : 'Select unit'}
              </Text>
              <Feather name="chevron-down" size={18} color="#64748B" style={{ position: 'absolute', right: 12, top: 13 }} />
            </TouchableOpacity>

            {/* Actions */}
            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <TouchableOpacity onPress={() => setEditFlowerVisible(false)} style={[styles.secondaryBtn, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.secondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!isEditingFlowerValid()}
                onPress={handleUpdateFlower}
                style={[styles.primaryBtn, { flex: 1, opacity: isEditingFlowerValid() ? 1 : 0.5 }]}
              >
                <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.primaryGrad}>
                  <Text style={styles.primaryText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Garland Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={editGarlandVisible}
        onRequestClose={() => setEditGarlandVisible(false)}
      >
        <View style={styles.errorModalOverlay}>
          <View style={[styles.errorModalContainer, { paddingBottom: 10 }]}>
            <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: '800', marginBottom: 12 }}>
              Edit Garland
            </Text>

            {/* Flower */}
            <Text style={styles.inputLabel}>Flower</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.textInput}
            >
              <Text style={{ color: editingGarland.garlandName ? '#0f172a' : '#94a3b8', fontSize: 15, marginTop: 8 }}>
                {editingGarland.garlandName
                  ? (flowerNames.find(f => f.value === editingGarland.garlandName)?.label || editingGarland.garlandName)
                  : 'Select flower'}
              </Text>
              <Feather name="chevron-down" size={18} color="#64748B" style={{ position: 'absolute', right: 12, top: 13 }} />
            </TouchableOpacity>

            {/* No. of Garlands */}
            <Text style={[styles.inputLabel, { marginTop: 10 }]}>No. of Garlands</Text>
            <TextInput
              style={styles.textInput}
              value={editingGarland.garlandQuantity}
              onChangeText={t => setEditingGarland(prev => ({ ...prev, garlandQuantity: t }))}
              keyboardType="numeric"
              placeholder="e.g. 2"
              placeholderTextColor="#94a3b8"
            />

            {/* Radio Choice */}
            <View style={[styles.row, { marginTop: 12 }]}>
              <TouchableOpacity
                onPress={() => setEditingGarland(prev => ({ ...prev, radioChoice: 'count' }))}
                style={[styles.radioPill, editingGarland.radioChoice === 'count' && styles.radioPillActive]}
              >
                <View style={[styles.radioCircle, editingGarland.radioChoice === 'count' && styles.radioCircleActive]}>
                  {editingGarland.radioChoice === 'count' && <View style={styles.radioDot} />}
                </View>
                <Text style={[styles.radioText, editingGarland.radioChoice === 'count' && styles.radioTextActive]}>Flower Count</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setEditingGarland(prev => ({ ...prev, radioChoice: 'size' }))}
                style={[styles.radioPill, editingGarland.radioChoice === 'size' && styles.radioPillActive]}
              >
                <View style={[styles.radioCircle, editingGarland.radioChoice === 'size' && styles.radioCircleActive]}>
                  {editingGarland.radioChoice === 'size' && <View style={styles.radioDot} />}
                </View>
                <Text style={[styles.radioText, editingGarland.radioChoice === 'size' && styles.radioTextActive]}>Garland Size</Text>
              </TouchableOpacity>
            </View>

            {/* Conditional field */}
            {editingGarland.radioChoice === 'count' ? (
              <>
                <Text style={[styles.inputLabel, { marginTop: 10 }]}>Flower Count</Text>
                <TextInput
                  style={styles.textInput}
                  value={editingGarland.garlandCount}
                  onChangeText={t => setEditingGarland(prev => ({ ...prev, garlandCount: t }))}
                  keyboardType="numeric"
                  placeholder="e.g. 50"
                  placeholderTextColor="#94a3b8"
                />
              </>
            ) : null}

            {editingGarland.radioChoice === 'size' ? (
              <>
                <Text style={[styles.inputLabel, { marginTop: 10 }]}>Size</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setModalGarlandSize(true)}
                  style={styles.textInput}
                >
                  <Text style={{ color: editingGarland.garlandSize ? '#0f172a' : '#94a3b8', fontSize: 15, marginTop: 8 }}>
                    {editingGarland.garlandSize
                      ? (garlandSizes.find(s => s.value === editingGarland.garlandSize)?.label || `${editingGarland.garlandSize}`)
                      : 'Select size'}
                  </Text>
                  <Feather name="chevron-down" size={18} color="#64748B" style={{ position: 'absolute', right: 12, top: 13 }} />
                </TouchableOpacity>
              </>
            ) : null}

            {/* Actions */}
            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <TouchableOpacity onPress={() => setEditGarlandVisible(false)} style={[styles.secondaryBtn, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.secondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!isEditingGarlandValid()}
                onPress={handleUpdateGarland}
                style={[styles.primaryBtn, { flex: 1, opacity: isEditingGarlandValid() ? 1 : 0.5 }]}
              >
                <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.primaryGrad}>
                  <Text style={styles.primaryText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Select Flower (Flower section) */}
      <SelectModal
        visible={modalFlowerName}
        title="Select Flower"
        data={flowerNames}
        selectedValue={flowerInput.flowerName}
        onClose={() => setModalFlowerName(false)}
        onSelect={(val) => setFlowerInput(prev => ({ ...prev, flowerName: val }))}
      />

      {/* Modal: Select Unit (Flower section) */}
      <SelectModal
        visible={modalFlowerUnit}
        title="Select Unit"
        data={flowerUnits}
        selectedValue={flowerInput.flowerUnit}
        onClose={() => setModalFlowerUnit(false)}
        onSelect={(val) => { setFlowerInput(prev => ({ ...prev, flowerUnit: val })); setEditingFlower(prev => ({ ...prev, flowerUnit: val })) }}
      />

      {/* Modal: Select Flower (Garland section) */}
      <SelectModal
        visible={modalGarlandName}
        title="Select Flower"
        data={flowerNames}
        selectedValue={garlandInput.garlandName}
        onClose={() => setModalGarlandName(false)}
        onSelect={(val) => setGarlandInput(prev => ({ ...prev, garlandName: val }))}
      />

      {/* Modal: Select Size (Garland section) */}
      <SelectModal
        visible={modalGarlandSize}
        title="Select Garland Size"
        data={garlandSizes}
        selectedValue={garlandInput.garlandSize}
        onClose={() => setModalGarlandSize(false)}
        onSelect={(val) => { setGarlandInput(prev => ({ ...prev, garlandSize: val })); setEditingGarland(prev => ({ ...prev, garlandSize: val })) }}
      />
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
  buyNowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
  },
  primaryBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 8,  // small spacing
  },
  primaryGrad: { paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: '#334155', fontWeight: '800' },
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
    backgroundColor: '#F59E0B',
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
  actionCellHeader: {
    flex: 0,
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCell: {
    flex: 0,
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2', // subtle red tint
  },
});