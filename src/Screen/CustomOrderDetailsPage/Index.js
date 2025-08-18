import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, Image, FlatList, Modal } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome5';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import RazorpayCheckout from 'react-native-razorpay';
import moment from 'moment';
import { base_url } from '../../../App';

const Index = (props) => {

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [packageDetails, setPackageDetails] = useState(null);
  const [flowerList, setFlowerList] = useState([]);
  const [garlandList, setGarlandList] = useState([]);
  const [errorModal, setErrorModal] = useState(false);
  const closeErrorModal = () => { setErrorModal(false); }
  const [errormasg, setErrormasg] = useState(null);

  const flowerPayment = async () => {
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    try {

      const options = {
        description: "props.route.params.flower_product.name",
        image: '',
        currency: 'INR',
        key: 'rzp_live_m8GAuZDtZ9W0AI',
        amount: props.route.params.order.total_price * 100,
        name: props.route.params.user.name,
        order_id: '', // Consider generating this on the server if needed
        prefill: {
          email: props.route.params.user.email,
          contact: props.route.params.user.mobile_number,
          name: props.route.params.user.name
        },
        theme: { color: '#53a20e' }
      };
      const data = await RazorpayCheckout.open(options);

      // Handle success
      const response = await fetch(base_url + 'api/make-payment/' + props.route.params.request_id, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },
        body: JSON.stringify({
          payment_id: data.razorpay_payment_id,
          // payment_id: 'pay_29QQoUBi66xm2f',
        }),
      });

      const responseData = await response.json();
      if (response.ok) {
        console.log("Booking successfully", responseData);
        navigation.goBack();
      } else {
        setErrorModal(true);
        setErrormasg(responseData.message);
        console.log("responseData", responseData);
      }

    } catch (error) {
      // Handle any errors, either from Razorpay or fetch
      setErrorModal(true);
      setErrormasg(error.message || "An error occurred during payment");
      console.log("An error occurred during payment", error);
    }
  };

  useEffect(() => {
    // console.log("object", props.route.params);
    setPackageDetails(props.route.params);

    const items = Array.isArray(props?.route?.params?.flower_request_items)
      ? props.route.params.flower_request_items
      : [];

    setFlowerList(items.filter(it => it?.type === 'flower'));
    setGarlandList(items.filter(it => it?.type === 'garland'));
  }, [props?.route?.params?.flower_request_items]);

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.mainView}>
        {/* Hero Header with Gradient */}
        <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.header}>
          <View style={styles.heroContent}>
            <TouchableOpacity style={styles.headerRow} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color="#FFFFFF" style={styles.backIcon} />
              <Text style={styles.heroTitle}>Custom Order Details</Text>
            </TouchableOpacity>
            <Text style={styles.heroSubtitle}>
              View and manage your custom orders here.
            </Text>
          </View>
        </LinearGradient>

        <ScrollView style={{ flex: 1 }}>
          <View style={styles.card}>
            {packageDetails?.flower_product?.product_image_url && <Image source={{ uri: packageDetails?.flower_product?.product_image_url }} style={styles.image} />}
            <Text style={{ color: '#000', fontFamily: 'Montserrat-Bold', fontSize: 17, marginBottom: 3 }}>{packageDetails?.flower_product?.name}</Text>
            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fae6e6', marginVertical: 2, padding: 5, borderRadius: 5 }}>
              <View style={{ width: '35%' }}>
                <Text style={{ color: '#000', fontSize: 14, fontWeight: 'bold' }}>Request Id:</Text>
              </View>
              <View style={{ width: '65%' }}>
                <Text style={{ color: '#000', fontSize: 14 }}>{packageDetails?.request_id}</Text>
              </View>
            </View>
            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fae6e6', marginVertical: 2, padding: 5, borderRadius: 5 }}>
              <View style={{ width: '35%' }}>
                <Text style={{ color: '#000', fontSize: 14, fontWeight: 'bold' }}>Date:</Text>
              </View>
              <View style={{ width: '65%' }}>
                <Text style={{ color: '#000', fontSize: 14 }}>{moment(packageDetails?.date).format('DD-MM-YYYY')}</Text>
              </View>
            </View>
            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fae6e6', marginVertical: 2, padding: 5, borderRadius: 5 }}>
              <View style={{ width: '35%' }}>
                <Text style={{ color: '#000', fontSize: 14, fontWeight: 'bold' }}>Time:</Text>
              </View>
              <View style={{ width: '65%' }}>
                <Text style={{ color: '#000', fontSize: 14 }}>{packageDetails?.time}</Text>
              </View>
            </View>
            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fae6e6', marginVertical: 2, padding: 5, borderRadius: 5 }}>
              <View style={{ width: '35%' }}>
                <Text style={{ color: '#000', fontSize: 14, fontWeight: 'bold' }}>Status:</Text>
              </View>
              <View style={{ width: '65%' }}>
                <Text style={{ color: '#000', fontSize: 14 }}>{packageDetails?.status}</Text>
              </View>
            </View>
            {packageDetails?.order?.requested_flower_price &&
              <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fae6e6', marginVertical: 2, padding: 5, borderRadius: 5 }}>
                <View style={{ width: '35%' }}>
                  <Text style={{ color: '#000', fontSize: 14, fontWeight: 'bold' }}>Package Price:</Text>
                </View>
                <View style={{ width: '65%' }}>
                  <Text style={{ color: '#000', fontSize: 14 }}>₹ {packageDetails?.order?.requested_flower_price}</Text>
                </View>
              </View>
            }
            {packageDetails?.order?.delivery_charge &&
              <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fae6e6', marginVertical: 2, padding: 5, borderRadius: 5 }}>
                <View style={{ width: '35%' }}>
                  <Text style={{ color: '#000', fontSize: 14, fontWeight: 'bold' }}>Delivery Price:</Text>
                </View>
                <View style={{ width: '65%' }}>
                  <Text style={{ color: '#000', fontSize: 14 }}>₹ {packageDetails?.order?.delivery_charge}</Text>
                </View>
              </View>
            }
            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fae6e6', marginVertical: 2, padding: 5, borderRadius: 5 }}>
              <View style={{ width: '35%' }}>
                <Text style={styles.price}>Total Price:</Text>
              </View>
              <View style={{ width: '65%' }}>
                {packageDetails?.status === 'pending' ?
                  <View>
                    <Text style={styles.price}>Order has been placed.</Text>
                    <Text style={styles.price}>Cost will be notified in few minutes.</Text>
                  </View>
                  :
                  <Text style={styles.price}>₹ {packageDetails?.order?.total_price}</Text>
                }
              </View>
            </View>
          </View>

          {flowerList.length > 0 &&
            <View style={styles.card}>
              <Text style={styles.subtitle}>Flower List</Text>
              <FlatList
                data={flowerList}
                scrollEnabled={false}
                keyExtractor={(item, index) => String(item?.id ?? index)}
                renderItem={({ item }) => (
                  <View style={{ marginBottom: 5 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fae6e6', marginVertical: 2, padding: 8, borderRadius: 6 }}>
                      <Text style={{ color: '#000', fontSize: 14, fontWeight: 'bold', width: '50%' }}>
                        {item?.flower_name}
                      </Text>
                      <Text style={{ color: '#000', fontSize: 14, textAlign: 'right', width: '50%' }}>
                        {item?.flower_quantity} {item?.flower_unit}
                      </Text>
                    </View>
                  </View>
                )}
              />
            </View>
          }

          {garlandList.length > 0 &&
            <View style={[styles.card, { marginTop: 10 }]}>
              <Text style={styles.subtitle}>Garland List</Text>
              <FlatList
                data={garlandList}
                scrollEnabled={false}
                keyExtractor={(item, index) => String(item?.id ?? index)}
                renderItem={({ item }) => {
                  const qty = item?.garland_quantity ?? '—';
                  const size = item?.garland_size ?? '—';
                  const count = (item?.flower_count ?? '—');

                  return (
                    <View style={styles.garlandRow}>
                      <View style={styles.garlandAvatar}>
                        <Icon name="leaf" size={14} color="#166534" />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.garlandTop}>
                          <Text style={styles.garlandName}>{item?.garland_name || 'Unknown'}</Text>
                          <Text style={styles.garlandStatus}>Garland</Text>
                        </View>

                        <View style={styles.badgeRow}>
                          <View style={[styles.badge, styles.badgeQty]}>
                            <Text style={styles.badgeText}>Qty: {qty}</Text>
                          </View>

                          <View style={[styles.badge, styles.badgeSize]}>
                            <Text style={styles.badgeText}>Size: {size}</Text>
                          </View>

                          <View style={[styles.badge, styles.badgeCount]}>
                            <Text style={styles.badgeText}>Flower Count: {count}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                }}
              />
            </View>
          }

          {packageDetails?.address &&
            <View style={styles.card}>
              <Text style={styles.subtitle}>Address</Text>
              <Text style={styles.text}>{packageDetails?.address?.address_type}, {packageDetails?.address?.place_category}</Text>
              <Text style={styles.text}>{packageDetails?.address?.apartment_flat_plot}, {packageDetails?.address?.landmark}</Text>
              <Text style={styles.text}>{packageDetails?.address?.locality_details?.locality_name}, {packageDetails?.address?.city}</Text>
              <Text style={styles.text}>{packageDetails?.address?.state}, {packageDetails?.address?.pincode}</Text>
              <Text style={styles.text}>{packageDetails?.address?.country}</Text>
            </View>
          }
          {packageDetails?.status === 'approved' &&
            <TouchableOpacity onPress={flowerPayment}>
              <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.submitButton}>
                <Text style={styles.submitText}>Pay</Text>
              </LinearGradient>
            </TouchableOpacity>
          }
        </ScrollView>

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
        {/* End Show Error Modal */}
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
  mainView: {
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
    fontSize: 26,
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
  // Main Container
  card: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    marginBottom: 5,
    elevation: 3,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#495057',
  },
  garlandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
  },
  garlandAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  garlandTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  garlandName: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 14
  },
  garlandStatus: {
    color: '#16A34A',
    fontWeight: '700',
    fontSize: 12
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a'
  },
  badgeQty: {
    backgroundColor: '#DBEAFE',
    borderColor: 'rgba(59,130,246,0.35)',
  },
  badgeSize: {
    backgroundColor: '#FEF3C7',
    borderColor: 'rgba(245,158,11,0.35)',
  },
  badgeCount: {
    backgroundColor: '#DCFCE7',
    borderColor: 'rgba(22,163,74,0.35)',
  },
  text: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 5,
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#28a745',
    // marginTop: 10,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
    resizeMode: 'contain',
  },
  dateButton: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#c9170a',
    borderRadius: 5,
    marginVertical: 5,
  },
  dateText: {
    color: '#fff',
    fontSize: 16,
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
  submitButton: {
    width: '90%',
    alignSelf: 'center',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    elevation: 3,
    marginTop: 10,
  },
  submitText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
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