import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome5';
import moment from 'moment';

const currency = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? `₹ ${n.toFixed(2)}` : '₹ 0.00';
};

const statusChip = (raw) => {
  const s = String(raw || '').toLowerCase();
  if (s === 'pending') return { bg: '#FEF3C7', text: '#92400E', label: 'Pending' };
  if (s === 'active' || s === 'paid' || s === 'completed' || s === 'delivered')
    return { bg: '#ECFDF5', text: '#065F46', label: s === 'active' ? 'Active' : 'Completed' };
  if (s === 'paused') return { bg: '#E0E7FF', text: '#3730A3', label: 'Paused' };
  if (s === 'expired' || s === 'cancelled' || s === 'failed')
    return { bg: '#FEE2E2', text: '#991B1B', label: s[0].toUpperCase() + s.slice(1) };
  return { bg: '#E5E7EB', text: '#374151', label: s ? s[0].toUpperCase() + s.slice(1) : '—' };
};

const Index = (props) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [packageDetails, setPackageDetails] = useState(null);

  useEffect(() => {
    setPackageDetails(props?.route?.params ?? null);
  }, [props?.route?.params]);

  const prod = packageDetails?.flower_product || {};
  const sub = packageDetails?.subscription || {};
  const addr = packageDetails?.address || {};
  const chip = statusChip(sub?.status);

  // Prefer package_items_details; fallback to package_items (normalize)
  const itemsPref = Array.isArray(prod?.package_items_details) ? prod.package_items_details : [];
  const itemsFallback = Array.isArray(prod?.package_items)
    ? prod.package_items.map((p) => ({
      item_name: p?.item?.item_name,
      variant_name: p?.variant?.title,
      price: p?.variant?.price,
    }))
    : [];
  const pkgItems = itemsPref.length > 0 ? itemsPref : itemsFallback;
  const itemsCount = pkgItems.length;

  const startDate = sub?.start_date ? moment(sub.start_date).format('DD MMM YYYY') : null;
  const endDateRaw = sub?.new_date || sub?.end_date;
  const endDate = endDateRaw ? moment(endDateRaw).format('DD MMM YYYY') : null;

  // Pricing summary like your checkout snippet
  const priceNum = Number(prod?.price ?? 0);
  const mrpNum = Number(prod?.mrp ?? priceNum);
  const hasDiscount = Number.isFinite(mrpNum) && Number.isFinite(priceNum) && mrpNum > priceNum;
  const youSave = hasDiscount ? mrpNum - priceNum : 0;

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
            <Icon name="arrow-left" size={16} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
          <View style={styles.headerIcon} />
        </View>
        <Text style={styles.headerSubtitle}>Overview of your puja product order.</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: 4 }}>
        {/* Product Hero */}
        <View style={styles.card}>
          {!!prod?.product_image_url && (
            <Image source={{ uri: prod.product_image_url }} style={styles.heroImage} />
          )}

          <Text style={styles.prodTitle} numberOfLines={2}>
            {prod?.name || 'Puja Product'}
          </Text>

          {!!prod?.description && <Text style={styles.prodDesc}>{prod.description}</Text>}

          <View style={styles.badgesRow}>
            {!!prod?.price && (
              <View style={[styles.chip, styles.moneyChip]}>
                <Icon name="rupee-sign" size={10} color="#111827" style={{ marginRight: 4 }} />
                <Text style={styles.moneyText}>{currency(prod.price)}</Text>
              </View>
            )}

            {!!prod?.duration && (
              <View style={[styles.chip, styles.infoChip]}>
                <Icon name="clock" size={10} color="#1F2937" style={{ marginRight: 6 }} />
                <Text style={styles.infoText}>
                  {prod.duration} Month{Number(prod.duration) > 1 ? 's' : ''}
                </Text>
              </View>
            )}

            {!!sub?.status && (
              <View style={[styles.chip, { backgroundColor: chip.bg, borderColor: chip.bg }]}>
                <Text style={[styles.chipText, { color: chip.text }]}>{chip.label}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Items in this Package */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Items in this Package {itemsCount ? `(${itemsCount})` : ''}
          </Text>

          {itemsCount > 0 ? (
            <View style={styles.itemsWrap}>
              {pkgItems.map((it, idx) => (
                <View key={`${it?.item_name || 'item'}-${idx}`} style={styles.itemRow}>
                  <View style={styles.itemIcon}>
                    <Icon name="leaf" size={12} color="#166534" />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {it?.item_name || '—'}
                    </Text>
                  </View>
                  {!!it?.quantity && (
                    <Text style={styles.itemMeta} numberOfLines={1}>
                      {it.quantity} {it.unit}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ color: '#64748B', fontWeight: '600' }}>No items listed.</Text>
          )}
        </View>

        {/* Order Summary (info + pricing block) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Order Summary</Text>

          {/* Basic info rows */}
          <View style={styles.kvRow}>
            <Text style={styles.kvKey}>Order ID</Text>
            <Text style={styles.kvVal}>{packageDetails?.order_id || '—'}</Text>
          </View>

          {!!startDate && (
            <View style={styles.kvRow}>
              <Text style={styles.kvKey}>Start Date</Text>
              <Text style={styles.kvVal}>{startDate}</Text>
            </View>
          )}

          {!!endDate && (
            <View style={styles.kvRow}>
              <Text style={styles.kvKey}>End Date</Text>
              <Text style={styles.kvVal}>{endDate}</Text>
            </View>
          )}

          {!!sub?.status && (
            <View style={styles.kvRow}>
              <Text style={styles.kvKey}>Subscription Status</Text>
              <View style={[styles.chip, { backgroundColor: chip.bg, borderColor: chip.bg }]}>
                <Text style={[styles.chipText, { color: chip.text }]}>{chip.label}</Text>
              </View>
            </View>
          )}

          {/* Divider before pricing block */}
          <View style={styles.divider} />

          {/* Pricing block (matches your checkout snippet) */}
          <View style={styles.summaryRow}>
            <Text style={styles.sumLabel}>Package Price</Text>
            <Text style={styles.sumValue}>{currency(mrpNum)}</Text>
          </View>

          {hasDiscount && (
            <View style={styles.summaryRow}>
              <Text style={[styles.sumLabel, { color: '#16A34A' }]}>Discount</Text>
              <Text style={[styles.sumValue, { color: '#16A34A' }]}>{currency(youSave)}</Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.sumLabel}>Delivery</Text>
            <Text style={[styles.sumValue, { color: '#16A34A', fontWeight: '800' }]}>Free</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.sumTotal}>Total</Text>
            <Text style={styles.sumTotal}>{currency(priceNum)}</Text>
          </View>

          {/* Still show what was actually charged (if you want to keep this line) */}
          <View style={[styles.kvRow, { marginTop: 8 }]}>
            <Text style={[styles.kvKey, { color: '#475569' }]}>Total Paid</Text>
            <Text style={styles.totalText}>{currency(packageDetails?.total_price)}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        {!!addr && Object.keys(addr).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <Text style={styles.addrLine}>
              {addr?.address_type || '—'}, {addr?.place_category || '—'}
            </Text>
            <Text style={styles.addrLine}>
              {addr?.apartment_flat_plot || '—'}, {addr?.landmark || '—'}
            </Text>
            <Text style={styles.addrLine}>
              {addr?.locality_details?.locality_name || '—'}, {addr?.city || '—'}
            </Text>
            <Text style={styles.addrLine}>
              {addr?.state || '—'} - {addr?.pincode || '—'}
            </Text>
            <Text style={styles.addrLine}>{addr?.country || '—'}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Header
  header: {
    paddingTop: 42,
    paddingHorizontal: 16,
    paddingBottom: 25,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  headerSubtitle: { color: '#fff', opacity: 0.9, marginTop: 8, textAlign: 'center' },

  // Cards
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  // Hero
  heroImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    resizeMode: 'cover',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  prodTitle: { color: '#0f172a', fontSize: 18, fontWeight: '800' },
  prodDesc: { color: '#475569', marginTop: 6, lineHeight: 18 },

  badgesRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  chipText: { fontWeight: '800', fontSize: 11, letterSpacing: 0.3 },

  moneyChip: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  moneyText: { color: '#111827', fontWeight: '900', fontSize: 12 },

  infoChip: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: { color: '#1F2937', fontWeight: '800', fontSize: 11 },

  // Sections
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 10 },

  kvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  kvKey: { color: '#6B7280', fontWeight: '700' },
  kvVal: { color: '#111827', fontWeight: '800' },
  totalText: { color: '#0f172a', fontWeight: '900', fontSize: 16 },

  // Divider
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 },

  // Pricing summary rows
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  sumLabel: { color: '#475569', fontWeight: '700' },
  sumValue: { color: '#0f172a', fontWeight: '800' },
  sumTotal: { color: '#0f172a', fontWeight: '900', fontSize: 16 },

  // Address
  addrLine: { color: '#475569', fontWeight: '700', marginBottom: 4 },

  // Package items
  itemsWrap: { gap: 10 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
  },
  itemIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.35)',
  },
  itemName: { color: '#0f172a', fontWeight: '700' },
  itemMeta: { color: '#64748B', fontSize: 12, marginTop: 2 },
  itemPrice: { color: '#0f172a', fontWeight: '800' },
});
