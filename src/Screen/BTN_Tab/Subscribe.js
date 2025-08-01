import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Image,
    StatusBar
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useTab } from '../TabContext';
import { base_url } from '../../../App';

const BENEFITS = [
    {
        icon: 'calendar-alt',
        title: 'Daily Devotion',
        description: 'Fresh flowers delivered every morning before sunrise',
        gradient: ['#FF6B35', '#F7931E'],
    },
    {
        icon: 'truck',
        title: 'Free Delivery',
        description: 'Free home delivery across Bhubaneswar',
        gradient: ['#10B981', '#059669'],
    },
    {
        icon: 'gift',
        title: 'Festival Specials',
        description: 'Special arrangements for Durga Puja, Kali Puja, Jagannath Rath Yatra',
        gradient: ['#8B5CF6', '#A855F7'],
    },
    {
        icon: 'star',
        title: 'Temple Fresh',
        description: 'Hand-picked flowers from local temple gardens',
        gradient: ['#F59E0B', '#D97706'],
    },
];

export default function SubscriptionScreen() {

    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const { setActiveTab } = useTab();
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [spinner, setSpinner] = useState(false);
    const [allPackages, setAllPackages] = useState([]);

    const getIntervalText = (interval) => {
        switch (interval) {
            case 'month': return 'per month';
            case 'quarter': return 'per quarter';
            case 'year': return 'per year';
            default: return '';
        }
    };

    const getAllPackages = async () => {
        setSpinner(true);
        try {
            const response = await fetch(base_url + 'api/products');
            const json = await response.json();

            if (json.status === 200) {
                const filteredPackages = json.data.filter(item => item.category === "Subscription");
                setAllPackages(filteredPackages);

                // ✅ Automatically select the first plan if available
                if (filteredPackages.length > 0) {
                    setSelectedPlan(filteredPackages[0].product_id);
                }
            } else {
                console.error('Failed to fetch packages:', json.message);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setSpinner(false);
        }
    };

    useEffect(() => {
        if (isFocused) {
            getAllPackages();
        }
    }, [isFocused]);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.header}>
                    <View style={styles.heroContent}>
                        <TouchableOpacity style={styles.headerRow} onPress={() => setActiveTab('home')}>
                            <Icon name="arrow-left" size={24} color="#FFFFFF" style={styles.backIcon} />
                            <Text style={styles.heroTitle}>Sacred Subscriptions</Text>
                        </TouchableOpacity>
                        <Text style={styles.heroSubtitle}>
                            Daily fresh flowers for your home temple and prayers
                        </Text>
                    </View>
                </LinearGradient>

                {/* Benefits Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>✨ Benefits</Text>
                    <View style={styles.grid}>
                        {BENEFITS.map((item, idx) => (
                            <View key={idx} style={styles.card}>
                                <LinearGradient colors={item.gradient} style={styles.iconCircle}>
                                    <Icon name={item.icon} size={24} color="#fff" />
                                </LinearGradient>
                                <Text style={styles.cardTitle}>{item.title}</Text>
                                <Text style={styles.cardDesc}>{item.description}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Plans Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📦 Subscription Plans</Text>
                    {allPackages.map((plan) => (
                        <TouchableOpacity
                            key={plan.product_id}
                            onPress={() => setSelectedPlan(plan.product_id)}
                            style={[
                                styles.planCard,
                                selectedPlan === plan.product_id && styles.planCardSelected,
                            ]}
                        >
                            <Image source={{ uri: plan.product_image }} style={styles.planImage} />
                            <View style={styles.planContent}>
                                <Text style={styles.planTitle}>{plan.name}</Text>
                                <Text style={styles.planPrice}>
                                    ₹{plan.price} <Text style={styles.planOriginal}>₹{plan.mrp}</Text>
                                </Text>
                                <Text style={styles.planInterval}>{plan.duration} Month</Text>
                                <View style={styles.planFeatures}>
                                    {/* {plan.features.slice(0, 3).map((f, i) => (
                                        <View key={i} style={styles.featureRow}>
                                            <Icon name="check" size={12} color="#059669" />
                                            <Text style={styles.featureText}>{f}</Text>
                                        </View>
                                    ))} */}
                                </View>
                            </View>
                            <View style={styles.radio}>
                                {selectedPlan === plan.product_id && <Icon name="dot-circle" size={18} color="#FF6B35" />}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Subscribe Button */}
                <View style={styles.subscribe}>
                    <TouchableOpacity style={styles.subscribeBtn}>
                        <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.subscribeGradient}>
                            <Text style={styles.subscribeText}>
                                {allPackages.find(p => p.product_id === selectedPlan)?.name} - ₹{allPackages.find(p => p.product_id === selectedPlan)?.price}/{allPackages.find(p => p.product_id === selectedPlan)?.interval}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// ✅ Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    header: {
        paddingTop: 40,
        padding: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginBottom: 10,
    },
    backIcon: {
        position: 'absolute',
        left: 0,
    },
    heroContent: {
        // marginTop: 10
    },
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
    section: {
        padding: 20
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        width: '48%',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        alignItems: 'center',
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginBottom: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: { fontWeight: '700', fontSize: 16, marginBottom: 6 },
    cardDesc: { fontSize: 12, textAlign: 'center', color: '#6B7280' },
    planCard: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 12,
        marginBottom: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    planCardSelected: {
        borderColor: '#FF6B35',
        backgroundColor: '#FFF7ED',
    },
    planImage: {
        width: 60,
        height: 60,
        borderRadius: 12,
        marginRight: 12,
    },
    planContent: { flex: 1 },
    planTitle: { fontWeight: '700', fontSize: 16 },
    planPrice: { fontSize: 16, color: '#FF6B35' },
    planOriginal: {
        fontSize: 12,
        color: '#9CA3AF',
        textDecorationLine: 'line-through',
        marginLeft: 6,
    },
    planInterval: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
    planFeatures: {},
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    featureText: { marginLeft: 6, fontSize: 12, color: '#374151' },
    radio: { paddingLeft: 10 },
    subscribe: { padding: 20 },
    subscribeBtn: { borderRadius: 12, overflow: 'hidden' },
    subscribeGradient: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    subscribeText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
});
