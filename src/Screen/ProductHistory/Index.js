import React, { useEffect, useState, useCallback } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Image,
    FlatList,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Feather from 'react-native-vector-icons/Feather';
import moment from 'moment';
import { base_url } from '../../../App';

const currency = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? `₹ ${n.toFixed(2)}` : '₹ 0.00';
};

const statusChip = (raw) => {
    const s = String(raw || '').toLowerCase();
    if (s === 'pending') return { bg: '#FEF3C7', text: '#92400E', label: 'Pending' };
    if (s === 'paid' || s === 'completed' || s === 'delivered') return { bg: '#ECFDF5', text: '#065F46', label: 'Completed' };
    if (s === 'cancelled' || s === 'failed') return { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelled' };
    return { bg: '#E5E7EB', text: '#374151', label: s ? s[0].toUpperCase() + s.slice(1) : '—' };
};

const Index = (props) => {

    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const insets = useSafeAreaInsets();

    const [spinner, setSpinner] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [orders, setOrders] = useState([]);

    const getProductOrders = async () => {
        const access_token = await AsyncStorage.getItem('storeAccesstoken');
        setSpinner(true);
        try {
            const res = await fetch(base_url + 'api/product-orders-list', {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + access_token,
                },
            });
            const json = await res.json();
            if (json?.success === 200) {
                // API shape assumed: data.subscriptions_order (as in your current code)
                setOrders(json?.data?.subscriptions_order || []);
            } else {
                console.error('Failed to fetch orders:', json?.message);
            }
        } catch (e) {
            console.error('Error:', e);
        } finally {
            setSpinner(false);
        }
    };

    useEffect(() => {
        if (isFocused) getProductOrders();
    }, [isFocused]);

    useEffect(() => {
        const t = setInterval(() => getProductOrders(), 30000);
        return () => clearInterval(t);
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
            getProductOrders();
        }, 800);
    }, []);

    const renderItem = ({ item }) => {
        const prod = item?.flower_product || {};
        const chip = statusChip(item?.status);
        const duration =
            prod?.duration ? `${prod.duration} Month${Number(prod.duration) > 1 ? 's' : ''}` : null;

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('ProductDetailsPage', item)}
                style={styles.card}
            >
                <View style={styles.row}>
                    {!!prod?.product_image_url ? (
                        <Image source={{ uri: prod.product_image_url }} style={styles.thumb} />
                    ) : (
                        <View style={[styles.thumb, styles.thumbPlaceholder]}>
                            <Icon name="box-open" size={18} color="#6B7280" />
                        </View>
                    )}

                    <View style={{ flex: 1 }}>
                        <Text style={styles.title} numberOfLines={1}>
                            {prod?.name || 'Puja Product'}
                        </Text>

                        {/* order id + date */}
                        <View style={{ marginTop: 4 }}>
                            <Text style={styles.meta}>
                                Order ID: <Text style={styles.metaBold}>{item?.order_id}</Text>
                            </Text>
                            {!!item?.created_at && (
                                <Text style={styles.meta}>
                                    Placed on {moment(item.created_at).format('DD MMM YYYY')}
                                </Text>
                            )}
                        </View>

                        {/* chips: price • duration • status */}
                        <View style={styles.badgesRow}>
                            {prod?.price ? (
                                <View style={[styles.chip, styles.moneyChip]}>
                                    <Icon name="rupee-sign" size={10} color="#111827" style={{ marginRight: 4 }} />
                                    <Text style={styles.moneyText}>{currency(prod.price)}</Text>
                                </View>
                            ) : null}

                            {!!duration && (
                                <View style={[styles.chip, styles.infoChip]}>
                                    <Icon name="clock" size={10} color="#1F2937" style={{ marginRight: 6 }} />
                                    <Text style={styles.infoText}>{duration}</Text>
                                </View>
                            )}

                            <View style={[styles.chip, { backgroundColor: chip.bg, borderColor: chip.bg }]}>
                                <Text style={[styles.chipText, { color: chip.text }]}>{chip.label}</Text>
                            </View>
                        </View>
                    </View>

                    <Feather name="chevron-right" size={20} color="#9CA3AF" />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
            {/* Header */}
            <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => props.navigation.goBack()} style={styles.headerIcon}>
                        <Icon name="arrow-left" size={16} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Product History</Text>
                    <View style={styles.headerIcon} />
                </View>
                <Text style={styles.headerSubtitle}>Track your puja product orders.</Text>
            </LinearGradient>

            {/* Body */}
            {spinner ? (
                <View style={styles.loaderWrap}>
                    <ActivityIndicator size="small" color="#c9170a" />
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item, idx) => String(item?.order_id ?? idx)}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 16, paddingBottom: 4 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <Icon name="box-open" size={22} color="#94A3B8" />
                            <Text style={styles.emptyText}>No product packages found.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

export default Index;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },

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

    loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    // Card
    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    row: { flexDirection: 'row', alignItems: 'center' },
    thumb: {
        width: 68,
        height: 68,
        borderRadius: 12,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    thumbPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' },

    title: { color: '#0f172a', fontWeight: '800', fontSize: 14 },

    meta: { color: '#64748B', fontWeight: '600', fontSize: 12 },
    metaBold: { color: '#111827' },

    badgesRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
    chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
    chipText: { fontWeight: '800', fontSize: 11, letterSpacing: 0.3 },

    moneyChip: { backgroundColor: '#F8FAFC', borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center' },
    moneyText: { color: '#111827', fontWeight: '900', fontSize: 12 },

    infoChip: { backgroundColor: '#F8FAFC', borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center' },
    infoText: { color: '#1F2937', fontWeight: '800', fontSize: 11 },

    emptyBox: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 14,
        padding: 18,
        alignItems: 'center',
        gap: 8,
        marginTop: 24,
    },
    emptyText: { color: '#6B7280', fontWeight: '700' },
});
