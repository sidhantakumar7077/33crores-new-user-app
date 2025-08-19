import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    ScrollView,
    Animated,
} from 'react-native';
import Modal from 'react-native-modal';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome5';

const PromotionModal = ({
    visible,
    data,
    onClose,
    onPrimaryPress,
    onSecondaryPress,
    primaryText = 'Book Now',
    secondaryText = 'Later',
    closeText = 'Close'
}) => {
    // ✅ Always create hooks, regardless of props
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // run pulse only when the modal is visible
        if (!visible) {
            pulseAnim.setValue(1);
            return;
        }
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.06, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1.0, duration: 800, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [visible, pulseAnim]);

    // ❇️ After hooks, you can safely early-return
    if (!visible || !data) return null;

    const { header, body, photo, start_date, end_date, status } = data;
    const statusText = status ? String(status).toLowerCase() : null;

    return (
        <Modal
            isVisible={visible}
            onBackdropPress={onClose}
            onBackButtonPress={onClose}
            backdropOpacity={0.75}
            animationIn="zoomIn"
            animationOut="zoomOut"
            useNativeDriver
            style={styles.modalWrap}
        >
            <LinearGradient colors={['#FFF7E6', '#FFDAB9']} style={styles.card}>
                {/* Close */}
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                    <Icon name="times" size={18} color="#B91C1C" />
                </TouchableOpacity>

                {/* Image */}
                {!!photo && (
                    <View style={styles.imageWrap}>
                        <Image source={{ uri: photo }} style={styles.image} />
                    </View>
                )}

                {/* Status */}
                {!!statusText && (
                    <View style={styles.statusChip}>
                        <Icon name="bolt" size={12} color="#fff" />
                        <Text style={styles.statusText}>{statusText}</Text>
                    </View>
                )}

                {/* Title */}
                {!!header && <Text style={styles.header}>{header}</Text>}

                {/* Body */}
                <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
                    {!!body && <Text style={styles.body}>{String(body).replace(/(\r\n|\n|\r)/g, '\n')}</Text>}
                </ScrollView>

                {/* Dates */}
                <View style={styles.datesRow}>
                    {!!start_date && (
                        <View style={styles.dateChip}>
                            <Icon name="calendar-alt" size={12} color="#B91C1C" />
                            <Text style={styles.dateText}>Start: {start_date}</Text>
                        </View>
                    )}
                    {!!end_date && (
                        <View style={styles.dateChip}>
                            <Icon name="calendar-check" size={12} color="#B91C1C" />
                            <Text style={styles.dateText}>End: {end_date}</Text>
                        </View>
                    )}
                </View>

                {/* Single pulsing primary button */}
                <View style={styles.actionsSingle}>
                    <Animated.View
                        style={[
                            { transform: [{ scale: pulseAnim }] }, // removed flex
                            styles.primaryShadow,
                        ]}
                    >
                        <TouchableOpacity
                            style={styles.primaryBtn}
                            activeOpacity={0.9}
                            onPress={onClose}
                        >
                            <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.primaryGrad}>
                                <Icon name="times" size={12} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.primaryText}>{closeText}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                {/* Actions */}
                {/* <View style={styles.actions}>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={onSecondaryPress || onClose}>
                        <Text style={styles.secondaryText}>{secondaryText}</Text>
                    </TouchableOpacity>

                    <Animated.View
                        style={[
                            { flex: 1, transform: [{ scale: pulseAnim }] },
                            {
                                shadowColor: '#F7931E',
                                shadowOpacity: 0.6,
                                shadowRadius: 10,
                                shadowOffset: { width: 0, height: 4 },
                                elevation: 6,
                            },
                        ]}
                    >
                        <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.9} onPress={onPrimaryPress}>
                            <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.primaryGrad}>
                                <Icon name="hand-holding-heart" size={14} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.primaryText}>{primaryText}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View> */}
            </LinearGradient>
        </Modal>
    );
};

export default PromotionModal;

const styles = StyleSheet.create({
    modalWrap: { justifyContent: 'center', alignItems: 'center', margin: 0 },
    card: {
        width: '88%',
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 16,
        alignItems: 'center',
        elevation: 12,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        borderWidth: 2,
        borderColor: '#F59E0B',
    },
    closeBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#FFF1F2',
        borderRadius: 50,
        padding: 6,
        elevation: 3,
    },
    imageWrap: { borderRadius: 14, overflow: 'hidden', elevation: 4, marginBottom: 12 },
    image: { width: 200, height: 120, resizeMode: 'cover' },
    statusChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#B91C1C',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        marginBottom: 8,
    },
    statusText: { color: '#fff', marginLeft: 6, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
    header: { fontSize: 20, fontWeight: '800', color: '#B91C1C', textAlign: 'center', marginBottom: 10 },
    bodyScroll: { maxHeight: 140, marginBottom: 12 },
    body: { fontSize: 15, color: '#374151', textAlign: 'center', lineHeight: 22 },
    datesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 14 },
    dateChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
    dateText: { marginLeft: 6, color: '#B91C1C', fontSize: 12, fontWeight: '600' },
    actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
    secondaryBtn: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', height: 46, backgroundColor: '#fff' },
    secondaryText: { color: '#0f172a', fontWeight: '700', fontSize: 14 },
    // primaryBtn: { flex: 1, height: 46, borderRadius: 12, overflow: 'hidden' },
    // primaryGrad: { flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
    // primaryText: { color: '#fff', fontWeight: '800', fontSize: 14 },


    // Single action row
    actionsSingle: { width: '100%', alignItems: 'center', marginTop: 8 },
    primaryShadow: {
        shadowColor: '#F7931E',
        shadowOpacity: 0.6,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    primaryBtn: {
        width: 160,          // ← small width
        height: 40,          // ← small height
        borderRadius: 999,   // pill shape
        overflow: 'hidden',
    },
    primaryGrad: { flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
    primaryText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});
