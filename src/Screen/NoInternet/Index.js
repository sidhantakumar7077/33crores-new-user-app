import React from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';

const Index = () => {
    return (
        <SafeAreaView style={styles.container}>
            {/* Animated Illustration */}
            <LottieView
                source={require('../../assets/animations/noInternet.json')}
                autoPlay
                loop
                style={styles.lottie}
            />

            {/* Message */}
            <View style={styles.textWrap}>
                <Text style={styles.title}>No Internet Connection</Text>
                <Text style={styles.subtitle}>
                    Oops! It looks like you are offline. Please check your network
                    settings and try again.
                </Text>
            </View>

            {/* Retry Button */}
            <TouchableOpacity
                activeOpacity={0.8}
                // onPress={onRetry}
                style={styles.btnWrap}
            >
                <LinearGradient
                    colors={['#FF6B35', '#F7931E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.button}
                >
                    <Text style={styles.btnText}>Try Again</Text>
                </LinearGradient>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

export default Index;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    lottie: {
        width: 250,
        height: 250,
    },
    textWrap: {
        marginTop: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: '#475569',
        textAlign: 'center',
        lineHeight: 20,
        maxWidth: 280,
    },
    btnWrap: {
        marginTop: 30,
        width: '70%',
    },
    button: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    btnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});