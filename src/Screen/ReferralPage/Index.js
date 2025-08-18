import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Share,
    Linking,
    RefreshControl,
    ToastAndroid,
    ActivityIndicator,
    FlatList
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Clipboard from '@react-native-clipboard/clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import moment from 'moment';
import { base_url } from '../../../App';

const Index = () => {

    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const isFocused = useIsFocused();

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [referralCode, setReferralCode] = useState(null);
    const [summary, setSummary] = useState({
        used_count: 0,
        completed_count: 0,
    });

    const [activeTab, setActiveTab] = useState('used');
    const [usedList, setUsedList] = useState([]);
    const [completedList, setCompletedList] = useState([]);
    const [offer_details, setOffer_details] = useState({});

    const prettyDate = (v) => {
        const m = moment(v, [moment.ISO_8601, 'YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD'], true);
        return m.isValid() ? m.format('DD MMM YYYY') : (v ?? '');
    };

    const fetchReferralSummary = async () => {
        try {
            setLoading(true);

            // Pull referral code from saved user first (no extra API needed for the code)
            const rawUser = await AsyncStorage.getItem('userData');
            const u = rawUser ? JSON.parse(rawUser) : null;
            if (u?.referral_code) setReferralCode(u.referral_code);

            const token = await AsyncStorage.getItem('storeAccesstoken');

            // Your Postman shows: GET /api/referrals/stats
            const res = await fetch(`${base_url}api/referrals/stats`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            const json = await res.json();

            if (!json?.success) {
                console.log('Unexpected response:', json);
                return;
            }

            // Normalize backend -> UI
            const rb = json?.refer_data?.referred_by ?? {};
            const od = json?.offer_details ?? {};

            const used = Array.isArray(rb.referrers_list)
                ? rb.referrers_list.map((x) => ({
                    name: x?.name || null,
                    phone: x?.mobile_number || null, // UI expects "phone"
                    status: x?.status || null,
                    date: prettyDate(x?.created_at),
                }))
                : [];

            const completed = Array.isArray(rb.referrers_completed_list)
                ? rb.referrers_completed_list.map((x) => ({
                    name: x?.name || null,
                    phone: x?.mobile_number || null,
                    status: 'Completed',
                    date: prettyDate(x?.created_at),
                }))
                : [];

            const used_count = Number(rb.referrers_count) || used.length;
            const completed_count = Number(rb.referrers_completed_count) || completed.length;

            setUsedList(used);
            setCompletedList(completed);
            setSummary({ used_count, completed_count });
            // console.log("Offer Details:", od);
            setOffer_details(od || {});
        } catch (e) {
            console.log('Referral summary error:', e);
        } finally {
            setLoading(false);
        }
    };

    const rows = useMemo(() => {
        const refers = Array.isArray(offer_details?.no_of_refer) ? offer_details.no_of_refer : [];
        const benefits = Array.isArray(offer_details?.benefit) ? offer_details.benefit : [];
        const len = Math.min(refers.length, benefits.length);
        const out = [];
        for (let i = 0; i < len; i++) {
            out.push({
                id: `${offer_details?.id || 'offer'}-${i}`,
                referCount: refers[i],
                benefitText: benefits[i],
            });
        }
        return out;
    }, [offer_details]);

    const handleClaim = (item) => {
        const completed = Number(summary?.completed_count) || 0;
        const need = Number(item?.referCount || 0);
        const itemDisabled = completed < need;
        if (itemDisabled) return;

        if (typeof onClaimPress === 'function') {
            onClaimPress(item, offer_details);
        } else {
            ToastAndroid.show(
                `Claim tapped: Refer ${need} ${need === 1 ? 'user' : 'users'} → ${item.benefitText}`,
                ToastAndroid.SHORT
            );
        }
    };

    useEffect(() => {
        if (isFocused) {
            fetchReferralSummary();
        }
    }, [isFocused]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchReferralSummary();
        setRefreshing(false);
    }, []);

    // 1) Build the exact message we need for each action
    const buildReferralMessage = (
        mode = 'invite',                // 'invite'
        userName = '',                  // used only for 'remind'
        codeOverride = null
    ) => {
        const code = (codeOverride || referralCode || '').trim();
        const link = 'https://play.google.com/store/apps/details?id=com.thirtythreecroresapp&hl=en';

        if (mode === 'remind') {
            return (
                `🙏 Hi ${userName || 'friend'},\n` +
                `You’ve already used my referral code *${code}* on 33Crores.\n` +
                `Please subscribe now so we BOTH can get the benefit! 🎁\n\n` +
                `Complete your subscription here: ${link}`
            );
        }

        // default: invite
        return (
            `🙏 Namaste\n` +
            `🪔 Join me on 33Crores!\n` +
            `Use my referral code *${code}* to get special benefits on your first puja order.\n\n` +
            `Install / Open: ${link}`
        );
    };

    // 2) Share sheet for INVITE
    const handleInvite = async () => {
        try {
            const message = buildReferralMessage('invite');
            await Share.share({ message });
        } catch (e) {
            console.log('Share error:', e);
        }
    };

    // 3) WhatsApp for INVITE
    const handleWhatsAppInvite = async () => {
        const message = buildReferralMessage('invite');
        const text = encodeURIComponent(message);
        const url = `whatsapp://send?text=${text}`;
        const webUrl = `https://wa.me/?text=${text}`;
        try {
            const canOpen = await Linking.canOpenURL(url);
            await Linking.openURL(canOpen ? url : webUrl);
        } catch (e) {
            console.log('WhatsApp error:', e);
        }
    };

    // 4) WhatsApp for REMIND (per-user)
    const remindUser = async (person) => {
        const message = buildReferralMessage('remind', person?.name || '');
        const encoded = encodeURIComponent(message);

        // If your numbers are stored without country code, prefix with 91 (IN)
        const digits = String(person?.phone || '').replace(/\D/g, '');
        const phoneWithCC = digits ? `91${digits}` : '';

        const waUrl = `whatsapp://send?${phoneWithCC ? `phone=+${phoneWithCC}&` : ''}text=${encoded}`;
        const waWeb = `https://wa.me/${phoneWithCC}?text=${encoded}`;

        try {
            const canOpen = await Linking.canOpenURL(waUrl);
            await Linking.openURL(canOpen ? waUrl : waWeb);
        } catch {
            ToastAndroid.show('Could not open WhatsApp', ToastAndroid.SHORT);
        }
    };

    const copyCode = () => {
        if (!referralCode) {
            ToastAndroid.show('No referral code found', ToastAndroid.SHORT);
            return;
        }
        Clipboard.setString(referralCode);
        ToastAndroid.show('Referral code copied', ToastAndroid.SHORT);
    };

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            {/* Header */}
            <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
                        <Icon name="arrow-left" size={18} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Refer & Earn</Text>
                    <View style={styles.headerIcon} />
                </View>
                <Text style={styles.headerSubtitle}>
                    Share your blessings—invite friends and earn rewards.
                </Text>
            </LinearGradient>

            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={{ paddingBottom: 10 }}
            >
                {/* Refer & Earn promo card */}
                <View style={styles.referralWrap}>
                    <LinearGradient
                        colors={['#FFEDD5', '#FED7AA', '#FDBA74']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.referralCard}
                    >
                        <View style={styles.refHeaderRow}>
                            <View style={styles.refBadge}>
                                <Icon name="gift" size={12} color="#fff" />
                                <Text style={styles.refBadgeText}>Refer & Earn</Text>
                            </View>
                            <Icon name="hands-helping" size={18} color="#9A3412" />
                        </View>

                        <Text style={styles.refTitle}>Invite friends, earn rewards!</Text>
                        <Text style={styles.refSubtitle}>
                            Share your code and they’ll get a welcome benefit on their first puja order.
                        </Text>

                        <View style={styles.codeRow}>
                            <Text style={styles.codeLabel}>Your Code</Text>
                            <View style={styles.codePill}>
                                <Text style={styles.codeText}>{referralCode ?? '—'}</Text>
                            </View>
                            <TouchableOpacity onPress={copyCode} style={styles.copyBtn}>
                                <Icon name="copy" size={12} color="#0f172a" />
                                <Text style={styles.copyText}>Copy</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.refActions}>
                            <TouchableOpacity style={styles.inviteBtn} activeOpacity={0.9} onPress={handleInvite}>
                                <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.inviteGrad}>
                                    <Icon name="share-alt" size={14} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={styles.inviteText}>Invite</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.whatsBtn} activeOpacity={0.9} onPress={handleWhatsAppInvite}>
                                <Icon name="whatsapp" size={16} color="#16A34A" style={{ marginRight: 8 }} />
                                <Text style={styles.whatsText}>WhatsApp</Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>

                <View style={styles.section}>
                    {/* Header */}
                    <Text style={styles.title}>{offer_details?.offer_name || 'Offer'}</Text>

                    {/* List */}
                    <FlatList
                        data={rows}
                        keyExtractor={(item) => item.id}
                        scrollEnabled={false}
                        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                        renderItem={({ item }) => {
                            const need = Number(item?.referCount || 0);
                            const completed = Number(summary?.completed_count || 0);
                            const isActive = ((offer_details?.status || '').toLowerCase() === 'active');
                            const unlocked = isActive && completed >= need;
                            const pct = need > 0 ? Math.min(1, completed / need) : 0;
                            const subWord = need === 1 ? 'subscription' : 'subscriptions';
                            const remaining = Math.max(0, need - completed);
                            const remainingWord = remaining === 1 ? 'subscription' : 'subscriptions';

                            return (
                                <View style={styles.rowCard}>
                                    <View style={styles.rowLeft}>
                                        {/* requirement chip */}
                                        <LinearGradient colors={['#FFE7D1', '#FED7AA']} style={styles.requireChip}>
                                            <Text style={styles.requireChipText}>
                                                Refer {need} {need === 1 ? 'friend' : 'friends'}
                                            </Text>
                                        </LinearGradient>

                                        {/* NEW sentence */}
                                        <Text style={styles.benefitText}>
                                            Unlock <Text style={styles.benefitStrong}>{item.benefitText}</Text> after{' '}
                                            {need} successful {subWord} using your referral code.
                                        </Text>

                                        {/* progress */}
                                        <View style={styles.progressWrap}>
                                            <View style={styles.progressTrack}>
                                                <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
                                            </View>
                                            <Text style={styles.progressLabel}>{completed}/{need}</Text>
                                        </View>

                                        {/* status hint */}
                                        <Text style={[styles.statusText, unlocked ? styles.statusOk : styles.statusWait]}>
                                            {unlocked
                                                ? 'Requirement met — ready to claim'
                                                : `Need ${remaining} more ${remainingWord}`}
                                        </Text>
                                    </View>

                                    {/* CTA */}
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => handleClaim(item)}
                                        disabled={!unlocked}
                                        style={[styles.claimBtn, !unlocked && { opacity: 0.6 }]}
                                    >
                                        <LinearGradient
                                            colors={unlocked ? ['#FF6B35', '#F7931E'] : ['#CBD5E1', '#94A3B8']}
                                            style={styles.claimGrad}
                                        >
                                            <Text style={[styles.claimText, !unlocked && { color: '#1F2937' }]}>
                                                {unlocked ? 'Claim' : 'Locked'}
                                            </Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            );
                        }}
                    />
                </View>

                {/* Tabs */}
                <View style={styles.tabsWrap}>
                    <View style={styles.tabsPill}>
                        {['used', 'completed'].map((key) => {
                            const isActive = activeTab === key;
                            const count =
                                key === 'used'
                                    ? (summary?.used_count ?? usedList.length)
                                    : (summary?.completed_count ?? completedList.length);
                            return (
                                <TouchableOpacity
                                    key={key}
                                    style={[styles.tabBtn, isActive ? styles.tabBtnActive : null]}
                                    onPress={() => setActiveTab(key)}
                                    activeOpacity={0.9}
                                >
                                    <Text style={[styles.tabText, isActive ? styles.tabTextActive : null]}>
                                        {key === 'used' ? `Used (${count})` : `Completed (${count})`}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Loader for list fetch */}
                {loading && (
                    <View style={{ paddingTop: 12 }}>
                        <ActivityIndicator size="small" color="#c9170a" />
                    </View>
                )}

                {/* Lists */}
                {!loading && (
                    <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
                        {(activeTab === 'used' ? usedList : completedList).length === 0 ? (
                            <View style={styles.emptyBox}>
                                <Text style={styles.emptyText}>
                                    {activeTab === 'used'
                                        ? 'No one has used your code yet.'
                                        : 'No completed benefits yet.'}
                                </Text>
                            </View>
                        ) : (
                            (activeTab === 'used' ? usedList : completedList).map((p, idx) => (
                                <View key={`${activeTab}-${idx}`} style={styles.personRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.personName}>{p?.name || 'Unknown'}</Text>
                                        <Text style={styles.personPhone}>{p?.phone || '—'}</Text>

                                        <View style={styles.completedRow}>
                                            <View style={styles.completedDot} />
                                            <Text style={styles.completedText}>
                                                {activeTab === 'used' ? 'Used' : 'Completed'}
                                                {p?.date ? ` • ${p.date}` : ''}
                                            </Text>
                                        </View>
                                    </View>

                                    {activeTab === 'used' ? (
                                        <TouchableOpacity style={styles.remindBtn} onPress={() => remindUser(p)}>
                                            <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.remindGrad}>
                                                <Icon name="bell" size={12} color="#fff" style={{ marginRight: 6 }} />
                                                <Text style={styles.remindText}>Remind</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={styles.completedBadge}>
                                            <Icon name="check" size={10} color="#16A34A" />
                                            <Text style={styles.completedBadgeText}>Done</Text>
                                        </View>
                                    )}
                                </View>
                            ))
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

export default Index;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },

    header: {
        paddingTop: 40,
        padding: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    headerIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
    headerSubtitle: { fontSize: 14, color: '#fff', opacity: 0.9, textAlign: 'center' },

    referralWrap: { paddingHorizontal: 20, marginTop: 18, marginBottom: 6 },
    referralCard: {
        borderRadius: 24,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(251, 146, 60, 0.35)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
    },
    refHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    refBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EA580C',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    refBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 6, letterSpacing: 0.4 },
    refTitle: { fontSize: 18, fontWeight: '800', color: '#7C2D12', marginTop: 12 },
    refSubtitle: { fontSize: 13, color: '#9A3412', marginTop: 6, lineHeight: 18 },
    codeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
    codeLabel: { fontSize: 12, color: '#7C2D12', fontWeight: '700', marginRight: 10 },
    codePill: {
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderWidth: 1,
        borderColor: 'rgba(251,146,60,0.5)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    codeText: { fontSize: 14, fontWeight: '800', color: '#9A3412', letterSpacing: 1 },
    copyBtn: { flexDirection: 'row', alignItems: 'center', marginLeft: 20, backgroundColor: '#E2E8F0', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, },
    refActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
    copyText: { color: '#0f172a', fontSize: 12, fontWeight: '700', marginLeft: 6 },
    inviteBtn: { flex: 1, height: 44, borderRadius: 12, overflow: 'hidden' },
    inviteGrad: { flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
    inviteText: { color: '#fff', fontWeight: '800', fontSize: 14 },
    whatsBtn: {
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(22,163,74,0.35)',
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        backgroundColor: '#F0FDF4',
    },
    whatsText: { color: '#166534', fontWeight: '800', fontSize: 14 },

    // Tabs
    tabsWrap: { paddingHorizontal: 20, marginTop: 12 },
    tabsPill: {
        backgroundColor: '#E2E8F0',
        borderRadius: 14,
        padding: 6,
        flexDirection: 'row',
    },
    tabBtn: {
        flex: 1,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabBtnActive: {
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
    },
    tabText: { color: '#475569', fontWeight: '700', fontSize: 13 },
    tabTextActive: { color: '#111827' },

    // Empty
    emptyBox: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
    },
    emptyText: { color: '#64748B', fontWeight: '600' },

    // List row
    personRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 10,
    },
    personName: { color: '#0f172a', fontWeight: '800', fontSize: 14 },
    personPhone: { color: '#64748B', marginTop: 2, fontWeight: '600', fontSize: 12 },

    // Completed detail line
    completedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    completedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A', marginRight: 6 },
    completedText: { color: '#16A34A', fontWeight: '700', fontSize: 12 },

    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(22,163,74,0.35)',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    completedBadgeText: { color: '#065F46', fontWeight: '800', fontSize: 12, marginLeft: 6 },

    // Remind button
    remindBtn: { height: 40, borderRadius: 999, overflow: 'hidden' },
    remindGrad: {
        height: '100%',
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    remindText: { color: '#fff', fontWeight: '800', fontSize: 12 },

    // Offer Details
    section: {
        marginTop: 16,
        marginHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 10,
    },
    rowCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 12,
    },

    rowLeft: {
        flex: 1,
        paddingRight: 12,
    },

    requireChip: {
        alignSelf: 'flex-start',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: 'rgba(251,146,60,0.45)',
    },

    requireChipText: {
        color: '#000',
        fontWeight: '800',
        fontSize: 12,
        letterSpacing: 0.3,
    },

    benefitText: {
        marginTop: 8,
        color: '#0F172A',
        fontSize: 14,
    },

    benefitStrong: {
        fontWeight: '800',
    },

    progressWrap: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },

    progressTrack: {
        flex: 1,
        height: 8,
        backgroundColor: '#E2E8F0',
        borderRadius: 999,
        overflow: 'hidden',
    },

    progressFill: {
        height: '100%',
        borderRadius: 999,
        backgroundColor: '#F7931E',
    },

    progressLabel: {
        marginLeft: 8,
        color: '#475569',
        fontSize: 12,
        width: 48,
        textAlign: 'right',
        fontWeight: '700',
    },

    statusText: {
        marginTop: 6,
        fontSize: 12,
    },

    statusOk: { color: '#16A34A', fontWeight: '700' },
    statusWait: { color: '#DC2626', fontWeight: '700' },

    claimBtn: {
        borderRadius: 999,
        overflow: 'hidden',
    },

    claimGrad: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
    },

    claimText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 12,
    },
});
