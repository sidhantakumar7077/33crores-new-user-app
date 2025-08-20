import React, { useEffect, useMemo, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Image,
    FlatList,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { base_url } from '../../../App';

const currency = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? `₹${n.toFixed(2)}` : '—';
};

const STATUS_COLORS = {
    pending: { bg: '#FFF7ED', border: '#FED7AA', text: '#9A3412' },
    approved: { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46' },
    paid: { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46' },
    completed: { bg: '#EEF2FF', border: '#C7D2FE', text: '#3730A3' },
    rejected: { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B' },
    cancelled: { bg: '#F1F5F9', border: '#CBD5E1', text: '#334155' },
    default: { bg: '#F1F5F9', border: '#CBD5E1', text: '#334155' },
};

function StatusBadge({ value }) {
    const key = String(value || '').toLowerCase();
    const c = STATUS_COLORS[key] || STATUS_COLORS.default;
    return (
        <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
            <View style={[styles.badgeDot, { backgroundColor: c.text }]} />
            <Text style={[styles.badgeText, { color: c.text }]}>{(value || '—').toUpperCase()}</Text>
        </View>
    );
}

export default function Index() {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const insets = useSafeAreaInsets();

    const [spinner, setSpinner] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [requested_orderList, setRequested_orderList] = useState([]);

    const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'pending' | 'approved' | ...

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        getCustomeOrderList().finally(() => setRefreshing(false));
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            getCustomeOrderList();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const getCustomeOrderList = async () => {
        const access_token = await AsyncStorage.getItem('storeAccesstoken');
        setSpinner(true);
        try {
            const res = await fetch(base_url + 'api/orders-list', {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + access_token,
                },
            });
            const json = await res.json();
            if (json?.success) {
                setRequested_orderList(Array.isArray(json?.data?.requested_orders) ? json.data.requested_orders : []);
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
        if (isFocused) getCustomeOrderList();
    }, [isFocused]);

    const stats = useMemo(() => {
        const all = requested_orderList.length;
        const by = (s) => requested_orderList.filter((x) => String(x?.status || '').toLowerCase() === s).length;
        return {
            all,
            pending: by('pending'),
            approved: by('approved'),
            paid: by('paid'),
        };
    }, [requested_orderList]);

    const filtered = useMemo(() => {
        if (activeFilter === 'all') return requested_orderList;
        return requested_orderList.filter(
            (x) => String(x?.status || '').toLowerCase() === activeFilter
        );
    }, [requested_orderList, activeFilter]);

    const renderCard = ({ item }) => {
        const status = String(item?.status || '').toLowerCase();
        const price = item?.order?.total_price;
        const canPay = status === 'approved';

        const badgeColors = STATUS_COLORS[status] || STATUS_COLORS.default;

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('CustomOrderDetailsPage', item)}
                style={styles.card}
            >
                {/* left image */}
                <View style={styles.imageWrap}>
                    <Image
                        source={{ uri: item?.flower_product?.product_image_url }}
                        style={styles.image}
                    />
                    <View style={styles.ribbon}>
                        <Text style={styles.ribbonText}>#{item?.request_id}</Text>
                    </View>
                </View>

                {/* right content */}
                <View style={{ flex: 1 }}>
                    <Text numberOfLines={2} style={styles.title}>
                        {item?.flower_product?.name ?? 'Custom Flower Request'}
                    </Text>

                    <View style={styles.rowBetween}>
                        <StatusBadge value={status} />
                        <View style={[styles.pricePill, { borderColor: badgeColors.border }]}>
                            <Icon name="rupee-sign" size={10} color="#0f172a" />
                            <Text style={styles.priceText}>{price ? currency(price) : 'TBD'}</Text>
                        </View>
                    </View>

                    {/* contextual hint */}
                    {status === 'pending' && (
                        <View style={styles.hint}>
                            <Icon name="clock" size={10} color="#9A3412" />
                            <Text style={styles.hintText}>We’re calculating your cost. You’ll be notified shortly.</Text>
                        </View>
                    )}

                    {/* actions */}
                    <View style={styles.actionsRow}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('CustomOrderDetailsPage', item)}
                            style={styles.outlineBtn}
                        >
                            <Text style={styles.outlineBtnText}>View Details</Text>
                        </TouchableOpacity>

                        {canPay && (
                            <TouchableOpacity
                                onPress={() => navigation.navigate('CustomOrderDetailsPage', item)}
                                style={styles.payBtn}
                                activeOpacity={0.9}
                            >
                                <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.payGrad}>
                                    <Icon name="lock" size={12} color="#fff" style={{ marginRight: 6 }} />
                                    <Text style={styles.payText}>Pay</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
            {/* Header */}
            <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-left" size={18} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Custom Orders</Text>
                    <View style={{ width: 36 }} />
                </View>

                <Text style={styles.headerSubtitle}>
                    Track your flower requests, pricing, and payments.
                </Text>

                {/* quick stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{stats.all}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{stats.pending}</Text>
                        <Text style={styles.statLabel}>Pending</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{stats.approved}</Text>
                        <Text style={styles.statLabel}>Approved</Text>
                    </View>
                </View>

                {/* filter chips */}
                <View style={styles.filters}>
                    {['all', 'pending', 'approved', 'paid'].map((f) => {
                        const active = activeFilter === f;
                        return (
                            <TouchableOpacity
                                key={f}
                                onPress={() => setActiveFilter(f)}
                                style={[styles.filterChip, active && styles.filterChipActive]}
                            >
                                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </LinearGradient>

            {/* Content */}
            {spinner ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="small" color="#f18204ff" />
                    <Text style={{ color: '#64748B', marginTop: 8 }}>Loading orders…</Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item, idx) => String(item?.request_id ?? idx)}
                    renderItem={renderCard}
                    contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f18204ff" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <View style={styles.emptyBadge}>
                                <Text style={styles.emptyEmoji}>🌸</Text>
                            </View>
                            <Text style={styles.emptyTitle}>No Requests Yet</Text>
                            <Text style={styles.emptyText}>
                                Create a custom flower request and it will appear here.
                            </Text>
                        </View>
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },

    header: {
        paddingHorizontal: 16,
        paddingTop: 38,
        paddingBottom: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
    headerSubtitle: { color: '#E5E7EB', marginTop: 8 },

    statsRow: {
        marginTop: 14,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        padding: 10,
        borderRadius: 14,
    },
    statCard: { flex: 1, alignItems: 'center' },
    statNumber: { color: '#fff', fontWeight: '900', fontSize: 16 },
    statLabel: { color: '#E5E7EB', fontSize: 12 },
    statDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.2)' },

    filters: { flexDirection: 'row', gap: 8, marginTop: 12 },
    filterChip: {
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    },
    filterChipActive: { backgroundColor: '#fff' },
    filterText: { color: '#E5E7EB', fontWeight: '700', fontSize: 12 },
    filterTextActive: { color: '#0f172a' },

    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    // Card
    card: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    imageWrap: { width: 90, height: 90, borderRadius: 12, overflow: 'hidden' },
    image: { width: '100%', height: '100%' },
    ribbon: {
        position: 'absolute', left: 8, top: 0, right: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        paddingHorizontal: 8, paddingVertical: 2,
        borderRadius: 6,
    },
    ribbonText: { color: '#fff', fontSize: 10, fontWeight: '800' },

    title: { color: '#0f172a', fontWeight: '800', fontSize: 15, marginBottom: 6 },

    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 999,
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    badgeDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },

    pricePill: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
        backgroundColor: '#F8FAFC', borderWidth: 1,
    },
    priceText: { color: '#0f172a', fontWeight: '900', fontSize: 12 },

    hint: {
        marginTop: 8,
        backgroundColor: '#FFEDD5',
        borderColor: 'rgba(251,146,60,0.45)',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    hintText: { color: '#7C2D12', fontSize: 12, fontWeight: '700', width: '95%' },

    actionsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
    outlineBtn: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        backgroundColor: '#fff',
    },
    outlineBtnText: { color: '#0f172a', fontWeight: '800' },

    payBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
    payGrad: {
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    payText: { color: '#fff', fontWeight: '900' },

    // empty
    emptyWrap: { alignItems: 'center', marginTop: 60, paddingHorizontal: 24 },
    emptyBadge: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA',
        alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    emptyEmoji: { fontSize: 30 },
    emptyTitle: { color: '#0f172a', fontSize: 18, fontWeight: '900', marginBottom: 4 },
    emptyText: { color: '#64748B', textAlign: 'center', fontWeight: '600' },
});
