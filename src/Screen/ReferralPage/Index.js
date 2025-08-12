import React, { useCallback, useEffect, useState } from 'react';
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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Clipboard from '@react-native-clipboard/clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { base_url } from '../../../App';

const Index = () => {

    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const isFocused = useIsFocused();

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // You can seed from props if you like; we set after fetch
    const [referralCode, setReferralCode] = useState('BAPPA10');
    const [summary, setSummary] = useState(null);

    const [activeTab, setActiveTab] = useState('used'); // 'used' | 'completed'
    const [usedList, setUsedList] = useState([]);
    const [completedList, setCompletedList] = useState([]);

    const fetchReferralSummary = async () => {
        try {
            setLoading(true);

            await new Promise(res => setTimeout(res, 800));

            const mockData = {
                referral_code: 'BAPPA10',
                used_count: 2,
                completed_count: 2,
                reward_text: '₹50 off on first order',
                used_list: [
                    { name: 'Ravi Kumar', phone: '9876543210', date: '2025-08-01' },
                    { name: 'Priya Sharma', phone: '9123456780', date: '2025-08-05' },
                ],
                completed_list: [
                    { name: 'Amit Verma', phone: '9988776655', date: '2025-08-03', status: 'Completed' },
                    { name: 'Neha Singh', phone: '9001122334', date: '2025-08-06', status: 'Completed' },
                ],
            };

            setSummary(mockData);
            setReferralCode(mockData.referral_code);
            setUsedList(mockData.used_list);
            setCompletedList(mockData.completed_list);

            return; // stop here if using mock
            // === REMOVE ABOVE WHEN USING REAL API ===

            const token = await AsyncStorage.getItem('storeAccesstoken');

            const res = await fetch(`${base_url}api/referral/summary`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            const json = await res.json();

            if (json?.success && json?.data) {
                const d = json.data;
                setSummary(d);
                if (d.referral_code) setReferralCode(d.referral_code);

                // Be defensive about key names
                const used =
                    Array.isArray(d.used_list) ? d.used_list :
                        Array.isArray(d.used) ? d.used :
                            [];
                const completed =
                    Array.isArray(d.completed_list) ? d.completed_list :
                        Array.isArray(d.completed) ? d.completed :
                            [];

                setUsedList(used);
                setCompletedList(completed);
            } else {
                console.log('Referral summary unexpected:', json);
            }
        } catch (e) {
            console.log('Referral summary error:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) fetchReferralSummary();
    }, [isFocused]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchReferralSummary();
        setRefreshing(false);
    }, []);

    const buildReferralMessage = (isReminder = false, userName = '', codeOverride = null) => {
        const code = codeOverride || summary?.referral_code || referralCode;
        const link = `${base_url}referral/${code}`;

        if (isReminder) {
            // Message for someone who already used the code but hasn’t subscribed yet
            return (
                `🙏 Hi ${userName || 'friend'},\n` +
                `You’ve already used my referral code *${code}* on 33Crores.\n` +
                `Please subscribe now so we BOTH can get the benefit! 🎁\n\n` +
                `Complete your subscription here: ${link}`
            );
        }

        // Default invite message
        return (
            `🪔 Join me on 33Crores!\n` +
            `Use my referral code *${code}* to get special benefits on your first puja order.\n\n` +
            `Install / Open: ${link}`
        );
    };

    const handleInvite = async () => {
        try {
            await Share.share({ message: buildReferralMessage() });
        } catch (e) {
            console.log('Share error:', e);
        }
    };

    const handleWhatsAppInvite = async () => {
        const text = encodeURIComponent(buildReferralMessage());
        const url = `whatsapp://send?text=${text}`;
        const webUrl = `https://wa.me/?text=${text}`;
        try {
            const canOpen = await Linking.canOpenURL(url);
            await Linking.openURL(canOpen ? url : webUrl);
        } catch (e) {
            console.log('WhatsApp error:', e);
        }
    };

    const copyCode = () => {
        Clipboard.setString(referralCode);
        ToastAndroid.show('Referral code copied', ToastAndroid.SHORT);
    };

    const remindUser = async (person) => {
        const code = summary?.referral_code || referralCode;
        const msg =
            `🙏 Namaste ${person?.name || ''}\n` +
            `Use my referral code *${code}* on 33Crores to start your subscription.\n` +
            `We both get the benefit when you complete your first order. 😊`;
        const encoded = encodeURIComponent(msg);

        // Assuming India numbers; tweak as needed
        const phone = person?.phone ? `91${String(person.phone).replace(/\D/g, '')}` : '';
        const waUrl = `whatsapp://send?phone=${phone ? `+${phone}` : ''}&text=${encoded}`;
        const waWeb = `https://wa.me/${phone}?text=${encoded}`;

        try {
            const canOpen = await Linking.canOpenURL(waUrl);
            await Linking.openURL(canOpen ? waUrl : waWeb);
        } catch {
            ToastAndroid.show('Could not open WhatsApp', ToastAndroid.SHORT);
        }
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
                {/* Code card */}
                <View style={styles.codeWrap}>
                    <LinearGradient colors={['#F1F5F9', '#FFFFFF']} style={styles.codeCard}>
                        <View style={styles.yourCodeRow}>
                            <Text style={styles.yourCodeLabel}>Your Referral Code</Text>
                            <TouchableOpacity onPress={copyCode} style={styles.copyBtn}>
                                <Icon name="copy" size={12} color="#0f172a" />
                                <Text style={styles.copyText}>Copy</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.codeBadge}>
                            <Icon name="ticket-alt" size={14} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.codeBadgeText}>{referralCode}</Text>
                        </View>

                        {!!summary?.reward_text && (
                            <Text style={styles.rewardHint}>Reward: {summary.reward_text}</Text>
                        )}
                    </LinearGradient>
                </View>

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
                                <Text style={styles.codeText}>{referralCode}</Text>
                            </View>
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

                {/* Lists */}
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

                                    {activeTab === 'completed' && (
                                        <View style={styles.completedRow}>
                                            <View style={styles.completedDot} />
                                            <Text style={styles.completedText}>
                                                {p?.status ? String(p.status) : 'Completed'}
                                                {p?.date ? ` • ${p.date}` : ''}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {activeTab === 'used' ? (
                                    <TouchableOpacity
                                        style={styles.remindBtn}
                                        onPress={() => remindUser(p)}
                                    >
                                        <LinearGradient
                                            colors={['#FF6B35', '#F7931E']}
                                            style={styles.remindGrad}
                                        >
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
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
    },
    headerIcon: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
    headerSubtitle: { fontSize: 14, color: '#fff', opacity: 0.9, textAlign: 'center' },

    codeWrap: { paddingHorizontal: 20, marginTop: 16 },
    codeCard: {
        borderRadius: 18, padding: 16,
        borderWidth: 1, borderColor: '#E2E8F0',
    },
    yourCodeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    yourCodeLabel: { color: '#0f172a', fontWeight: '800', fontSize: 14 },
    copyBtn: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#E2E8F0', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
    },
    copyText: { color: '#0f172a', fontSize: 12, fontWeight: '700', marginLeft: 6 },
    codeBadge: {
        marginTop: 12, alignSelf: 'center',
        backgroundColor: '#EA580C', borderRadius: 12,
        paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center',
    },
    codeBadgeText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
    rewardHint: { marginTop: 10, textAlign: 'center', color: '#334155', fontSize: 12 },

    // Refer & Earn card
    referralWrap: { paddingHorizontal: 20, marginTop: 18, marginBottom: 6 },
    referralCard: {
        borderRadius: 24, padding: 18,
        borderWidth: 1, borderColor: 'rgba(251, 146, 60, 0.35)',
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12, shadowRadius: 16, elevation: 8,
    },
    refHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    refBadge: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#EA580C', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
    },
    refBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 6, letterSpacing: 0.4 },
    refTitle: { fontSize: 18, fontWeight: '800', color: '#7C2D12', marginTop: 12 },
    refSubtitle: { fontSize: 13, color: '#9A3412', marginTop: 6, lineHeight: 18 },
    codeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
    codeLabel: { fontSize: 12, color: '#7C2D12', fontWeight: '700', marginRight: 10 },
    codePill: {
        backgroundColor: 'rgba(255,255,255,0.8)', borderWidth: 1, borderColor: 'rgba(251,146,60,0.5)',
        borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6,
    },
    codeText: { fontSize: 14, fontWeight: '800', color: '#9A3412', letterSpacing: 1 },
    refActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
    inviteBtn: { flex: 1, height: 44, borderRadius: 12, overflow: 'hidden' },
    inviteGrad: { flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
    inviteText: { color: '#fff', fontWeight: '800', fontSize: 14 },
    whatsBtn: {
        height: 44, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(22,163,74,0.35)',
        paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
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
});
