import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  Modal,
  ActivityIndicator,
  ToastAndroid,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome5';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import RazorpayCheckout from 'react-native-razorpay';
import moment from 'moment';
import { base_url } from '../../../App';

const Index = (props) => {

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [packageDetails, setPackageDetails] = useState(null);
  const [flowerList, setFlowerList] = useState([]);
  const [garlandList, setGarlandList] = useState([]);

  const [errorModal, setErrorModal] = useState(false);
  const [errormasg, setErrormasg] = useState(null);
  const closeErrorModal = () => setErrorModal(false);

  const flowerPayment = async () => {
    const access_token = await AsyncStorage.getItem('storeAccesstoken');
    setLoading(true);
    try {
      const options = {
        description: 'Custom Flower Request',
        image: '',
        currency: 'INR',
        key: 'rzp_live_m8GAuZDtZ9W0AI',
        amount: (props?.route?.params?.order?.total_price || 0) * 100,
        name: props?.route?.params?.user?.name,
        order_id: '',
        prefill: {
          email: props?.route?.params?.user?.email,
          contact: props?.route?.params?.user?.mobile_number,
          name: props?.route?.params?.user?.name,
        },
        theme: { color: '#53a20e' },
      };

      const data = await RazorpayCheckout.open(options);

      const response = await fetch(
        `${base_url}api/make-payment/${props?.route?.params?.request_id}`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${access_token}`,
          },
          body: JSON.stringify({
            payment_id: data.razorpay_payment_id,
          }),
        }
      );

      const responseData = await response.json();
      if (response.ok) {
        setLoading(false);
        navigation.goBack();
        ToastAndroid.show('Payment successful', ToastAndroid.SHORT);
      } else {
        setErrorModal(true);
        setErrormasg(responseData?.message || 'Payment failed');
        setLoading(false);
      }
    } catch (error) {
      setErrorModal(true);
      setErrormasg(error?.message || 'An error occurred during payment');
      setLoading(false);
    }
  };

  useEffect(() => {
    setPackageDetails(props.route.params);

    const items = Array.isArray(props?.route?.params?.flower_request_items)
      ? props.route.params.flower_request_items
      : [];

    setFlowerList(items.filter((it) => it?.type === 'flower'));
    setGarlandList(items.filter((it) => it?.type === 'garland'));
  }, [props?.route?.params?.flower_request_items]);

  // --- renderers ---
  const renderFlowerItem = ({ item }) => {
    const qty = item?.flower_quantity ?? '—';
    const unit = item?.flower_unit ?? '—';
    const name = item?.flower_name || 'Unknown';

    return (
      <View style={styles.garlandRow}>
        <View style={styles.garlandAvatar}>
          <Icon name="seedling" size={14} color="#2563EB" />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.garlandTop}>
            <Text style={styles.garlandName}>{name}</Text>
            <Text style={[styles.garlandStatus, { color: '#2563EB' }]}>Flower</Text>
          </View>

          <View style={styles.badgeRow}>
            <View style={[styles.badge, styles.badgeQty]}>
              <Text style={styles.badgeText}>
                Qty: {qty} {unit}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderGarlandItem = ({ item }) => {
    const qty = item?.garland_quantity ?? '—';
    const size = item?.garland_size;
    const count = item?.flower_count;
    const name = item?.garland_name || 'Unknown';

    return (
      <View style={styles.garlandRow}>
        <View style={styles.garlandAvatar}>
          <Icon name="leaf" size={14} color="#166534" />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.garlandTop}>
            <Text style={styles.garlandName}>{name}</Text>
            <Text style={styles.garlandStatus}>Garland</Text>
          </View>

          <View style={styles.badgeRow}>
            <View style={[styles.badge, styles.badgeQty]}>
              <Text style={styles.badgeText}>Qty: {qty}</Text>
            </View>

            {!!size && (
              <View style={[styles.badge, styles.badgeSize]}>
                <Text style={styles.badgeText}>Size: {size}</Text>
              </View>
            )}

            {Number.isFinite(Number(count)) && (
              <View style={[styles.badge, styles.badgeCount]}>
                <Text style={styles.badgeText}>Flower Count: {count}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const [cancelRequestModalVisible, setCancelRequestModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelRequestLoading, setCancelRequestLoading] = useState(false);

  const openCancelRequestModal = () => setCancelRequestModalVisible(true);
  const closeCancelRequestModal = () => {
    setCancelRequestModalVisible(false);
    setCancelReason('');
  };

  const cancelOrderRequest = async () => {
    const requestId = packageDetails?.request_id;
    if (!requestId) {
      ToastAndroid.show('Invalid request ID', ToastAndroid.SHORT);
      return;
    }
    if (!cancelReason.trim()) {
      ToastAndroid.show('Reason required', ToastAndroid.SHORT);
      return;
    }

    try {
      setCancelRequestLoading(true);
      const access_token = await AsyncStorage.getItem('storeAccesstoken');
      const res = await fetch(`${base_url}api/flower-requests/cancel/${requestId}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(access_token ? { Authorization: `Bearer ${access_token}` } : {}),
        },
        body: JSON.stringify({
          cancel_by: 'user',
          cancel_reason: cancelReason.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok || res.status === 200) {
        // success
        closeCancelRequestModal();
        // refresh lists and clear the pending bar
        // console.log("Cancelled Successfully", json);
        navigation.goBack();
        ToastAndroid.show('Your request has been cancelled.', ToastAndroid.SHORT);
      } else {
        ToastAndroid.show(json?.message || 'Unable to cancel the order', ToastAndroid.SHORT);
      }
    } catch (e) {
      ToastAndroid.show(e?.message || 'Something went wrong', ToastAndroid.SHORT);
    } finally {
      setCancelRequestLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.mainView}>
        {/* Header */}
        <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.header}>
          <View style={styles.heroContent}>
            <TouchableOpacity style={styles.headerRow} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color="#FFFFFF" style={styles.backIcon} />
              <Text style={styles.heroTitle}>Custom Order Details</Text>
            </TouchableOpacity>
            <Text style={styles.heroSubtitle}>View and manage your custom orders here.</Text>
          </View>
        </LinearGradient>

        <ScrollView style={{ flex: 1, ...((packageDetails?.status === 'approved' || packageDetails?.status === 'pending') && { marginBottom: 60 }) }} showsVerticalScrollIndicator={false}>
          {/* ===== Top summary card (NEW) ===== */}
          <View style={styles.topCard}>
            <View style={styles.topHeaderRow}>
              <View style={styles.thumbWrap}>
                {packageDetails?.flower_product?.product_image_url ? (
                  <Image
                    source={{ uri: packageDetails?.flower_product?.product_image_url }}
                    style={styles.thumbImg}
                  />
                ) : (
                  <View style={styles.thumbFallback}>
                    <Icon name="image" size={22} color="#94A3B8" />
                  </View>
                )}
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.prodName}>
                  {packageDetails?.flower_product?.name || 'Custom Order'}
                </Text>

                <View style={styles.chipRow}>
                  {!!packageDetails?.status && (
                    <View style={[styles.chip, styles.chipStatus]}>
                      <Text style={styles.chipText}>
                        {String(packageDetails?.status).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Delivery Date</Text>
                <Text style={styles.infoValue}>
                  {packageDetails?.date ? moment(packageDetails?.date).format('DD-MM-YYYY') : '—'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Delivery Time</Text>
                <Text style={styles.infoValue}>{packageDetails?.time || '—'}</Text>
              </View>

              {!!packageDetails?.order?.requested_flower_price && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Flower Cost</Text>
                  <Text style={styles.infoValue}>
                    ₹ {packageDetails?.order?.requested_flower_price}
                  </Text>
                </View>
              )}
              {!!packageDetails?.order?.delivery_charge && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Delivery</Text>
                  <Text style={styles.infoValue}>
                    ₹ {packageDetails?.order?.delivery_charge}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.totalBar}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              {packageDetails?.status === 'pending' ? (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.totalPending}>Order placed</Text>
                  <Text style={styles.totalPending}>Cost will be notified shortly</Text>
                </View>
              ) : (
                <Text style={styles.totalValue}>
                  ₹ {packageDetails?.order?.total_price ?? '—'}
                </Text>
              )}
            </View>
          </View>

          {/* ===== Flowers ===== */}
          {flowerList.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.subtitle}>Flower Ordered</Text>
              <FlatList
                data={flowerList}
                scrollEnabled={false}
                keyExtractor={(item, index) => String(item?.id ?? index)}
                renderItem={renderFlowerItem}
              />
            </View>
          )}

          {/* ===== Garlands ===== */}
          {garlandList.length > 0 && (
            <View style={[styles.card, { marginTop: 10 }]}>
              <Text style={styles.subtitle}>Garland Ordered</Text>
              <FlatList
                data={garlandList}
                scrollEnabled={false}
                keyExtractor={(item, index) => String(item?.id ?? index)}
                renderItem={renderGarlandItem}
              />
            </View>
          )}

          {/* ===== Address (NEW) ===== */}
          {packageDetails?.address && (
            <View style={styles.addrCard}>
              <View style={styles.addrHeader}>
                <View style={styles.addrIcon}>
                  <Icon name="map-marker-alt" size={14} color="#B91C1C" />
                </View>
                <Text style={styles.subtitle}>Delivery Address</Text>
              </View>

              <View style={styles.addrBadgeRow}>
                {!!packageDetails?.address?.address_type && (
                  <View style={[styles.chip, styles.chipType]}>
                    <Text style={styles.chipText}>{packageDetails?.address?.address_type}</Text>
                  </View>
                )}
                {!!packageDetails?.address?.place_category && (
                  <View style={[styles.chip, styles.chipCat]}>
                    <Text style={styles.chipText}>{packageDetails?.address?.place_category}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.addrLine}>
                {packageDetails?.address?.apartment_flat_plot}
                {packageDetails?.address?.landmark ? `, ${packageDetails?.address?.landmark}` : ''}
              </Text>
              <Text style={styles.addrLine}>
                {packageDetails?.address?.locality_details?.locality_name}
                {packageDetails?.address?.city ? `, ${packageDetails?.address?.city}` : ''}
              </Text>
              <Text style={styles.addrLine}>
                {packageDetails?.address?.state}
                {packageDetails?.address?.pincode ? ` - ${packageDetails?.address?.pincode}` : ''}
              </Text>
              {!!packageDetails?.address?.country && (
                <Text style={styles.addrCountry}>{packageDetails?.address?.country}</Text>
              )}
            </View>
          )}
        </ScrollView>

        {/* Footer Actions */}
        {packageDetails?.status === 'pending' && (
          <TouchableOpacity
            onPress={openCancelRequestModal}
            style={[styles.submitButton, { backgroundColor: '#ef4444', width: '90%' }]}
          >
            <Text style={styles.submitText}>Cancel</Text>
          </TouchableOpacity>
        )}

        {packageDetails?.status === 'approved' && (
          <View style={styles.footerActionsRow}>
            <TouchableOpacity onPress={flowerPayment} style={{ flex: 1, marginRight: 8 }}>
              <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.submitButtonRow}>
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Pay</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={openCancelRequestModal}
              style={[styles.submitButtonRow, { backgroundColor: '#ef4444', flex: 1 }]}
            >
              <Text style={styles.submitText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Cancel Custome Oreder */}
        <Modal
          animationType="slide"
          transparent
          visible={cancelRequestModalVisible}
          onRequestClose={closeCancelRequestModal}
        >
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
            {/* backdrop */}
            <TouchableOpacity
              style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
              activeOpacity={1}
              onPress={!cancelRequestLoading ? closeCancelRequestModal : undefined}
            />

            <View
              style={{
                backgroundColor: '#fff',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingHorizontal: 18,
                paddingTop: 10,
                paddingBottom: 18,
                borderTopWidth: 1,
                borderColor: '#E5E7EB',
              }}
            >
              {/* handle bar */}
              <View
                style={{
                  alignSelf: 'center',
                  width: 40,
                  height: 4,
                  borderRadius: 999,
                  backgroundColor: '#E5E7EB',
                  marginBottom: 12,
                }}
              />

              {/* icon */}
              <LinearGradient
                colors={['#fb7185', '#ef4444']}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <Feather name="x-circle" size={26} color="#fff" />
              </LinearGradient>

              {/* title + desc */}
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>
                Cancel this order?
              </Text>
              <Text style={{ marginTop: 6, color: '#374151', lineHeight: 20, fontWeight: '600' }}>
                Please share a reason for cancelling. This helps us improve.
              </Text>

              {/* Request ID pill */}
              {!!packageDetails?.request_id && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, marginTop: 12 }}>
                  <Icon name="hashtag" size={12} color="#6B7280" />
                  <Text style={{ color: '#374151', fontWeight: '700' }}>Request ID: {packageDetails.request_id}</Text>
                </View>
              )}

              {/* reason input */}
              <View
                style={{
                  marginTop: 12,
                  borderWidth: 1,
                  borderColor: '#CBD5E1',
                  borderRadius: 10,
                  backgroundColor: '#F9FAFB',
                }}
              >
                <TextInput
                  style={{
                    minHeight: 90,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: '#0f172a',
                  }}
                  placeholder="Type your reason..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  value={cancelReason}
                  onChangeText={setCancelReason}
                  editable={!cancelRequestLoading}
                />
              </View>

              {/* action buttons */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    borderWidth: 1.5,
                    borderColor: '#CBD5E1',
                    backgroundColor: '#fff',
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                  onPress={closeCancelRequestModal}
                  disabled={cancelRequestLoading}
                >
                  <Text style={{ color: '#111827', fontWeight: '900', fontSize: 14 }}>
                    No, keep order
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    alignItems: 'center',
                    paddingVertical: 12,
                    backgroundColor: '#ef4444',
                    opacity: cancelRequestLoading ? 0.7 : 1,
                  }}
                  onPress={cancelOrderRequest}
                  disabled={cancelRequestLoading}
                >
                  {cancelRequestLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>Yes, cancel</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Error Modal */}
        <Modal animationType="slide" transparent visible={errorModal} onRequestClose={closeErrorModal}>
          <View style={styles.errorModalOverlay}>
            <View style={styles.errorModalContainer}>
              <View style={{ width: '90%', alignSelf: 'center', marginBottom: 10 }}>
                <View style={{ alignItems: 'center' }}>
                  <MaterialIcons name="report-gmailerrorred" size={100} color="red" />
                  <Text
                    style={{
                      color: '#000',
                      fontSize: 20,
                      fontWeight: 'bold',
                      textAlign: 'center',
                      letterSpacing: 0.3,
                    }}
                  >
                    {errormasg}
                  </Text>
                </View>
              </View>
              <View
                style={{
                  width: '95%',
                  alignSelf: 'center',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-evenly',
                  marginTop: 10,
                }}
              >
                <TouchableOpacity onPress={closeErrorModal} style={styles.confirmDeleteBtn}>
                  <Text style={styles.btnText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mainView: {
    flex: 1,
    paddingBottom: 10,
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

  // Generic card (still used for sections)
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

  // Row block for Flower/Garland list
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
    fontSize: 14,
  },
  garlandStatus: {
    color: '#16A34A',
    fontWeight: '700',
    fontSize: 12,
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
    color: '#0f172a',
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
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmDeleteBtn: {
    backgroundColor: 'green',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 7,
  },
  footerActionsRow: {
    position: 'absolute',
    bottom: 5,
    width: '90%',
    alignSelf: 'center',
    flexDirection: 'row',
  },

  submitButtonRow: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    elevation: 3,
  },


  submitButton: {
    position: 'absolute',
    bottom: 5,
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

  // ===== NEW Top card styles =====
  topCard: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbWrap: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prodName: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  chipStatus: {
    backgroundColor: '#FEE2E2',
    borderColor: 'rgba(239,68,68,0.35)',
  },
  chipId: {
    backgroundColor: '#E2E8F0',
    borderColor: 'rgba(148,163,184,0.5)',
  },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoItem: {
    width: '50%',
    paddingVertical: 10,
    paddingRight: 8,
  },
  infoLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  infoValue: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },

  totalBar: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '800',
  },
  totalValue: {
    color: '#065F46',
    fontSize: 18,
    fontWeight: '900',
  },
  totalPending: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
  },

  // ===== NEW Address card styles =====
  addrCard: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addrIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  addrBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  chipType: {
    backgroundColor: '#DBEAFE',
    borderColor: 'rgba(59,130,246,0.35)',
  },
  chipCat: {
    backgroundColor: '#F3E8FF',
    borderColor: 'rgba(168,85,247,0.35)',
  },
  addrLine: {
    color: '#0f172a',
    fontSize: 14,
    marginTop: 2,
  },
  addrCountry: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '700',
  },
});
