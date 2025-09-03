// PrivacyPolicy.tsx (or Index.tsx)
import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';

const SUPPORT_EMAIL = 'contact@33crores.com';

const openMail = async () => {
  const url = `mailto:${SUPPORT_EMAIL}`;
  try {
    const ok = await Linking.canOpenURL(url);
    if (!ok) throw new Error('cannot open');
    await Linking.openURL(url);
  } catch {
    Alert.alert('Not available', 'Please try again later.');
  }
};

const SectionCard = ({ icon, title, children }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={styles.iconBadge}>
        <Icon name={icon} size={16} color="#F97316" />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <View style={{ marginTop: 6 }}>{children}</View>
  </View>
);

const Bullet = ({ text }) => (
  <View style={styles.bulletRow}>
    <View style={styles.bulletDot} />
    <Text style={styles.bodyText}>{text}</Text>
  </View>
);

const Index = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={{ width: 36 }} />
        </View>
        <Text style={styles.headerSub}>
          We value your trust. Here’s how we collect, use and protect your data.
        </Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SectionCard icon="info-circle" title="1. Information We Collect">
          <Text style={styles.bodyText}>
            We collect personal information such as your name, email address, phone number, and
            shipping details when you place an order or sign up for our services. We also gather
            non-personal data like browser type, IP address, and device information to enhance your
            experience.
          </Text>
        </SectionCard>

        <SectionCard icon="list-alt" title="2. How We Use Your Data">
          <Bullet text="To process your orders and ensure timely delivery." />
          <Bullet text="To send updates on new products, offers, and spiritual content." />
          <Bullet text="To improve our website experience and customer support." />
          <Bullet text="To comply with legal requirements and prevent fraud." />
        </SectionCard>

        <SectionCard icon="shield-alt" title="3. Data Protection Measures">
          <Text style={styles.bodyText}>
            We implement industry-standard security measures to protect your data from unauthorized
            access, loss, or misuse. Your payment details are encrypted and processed through secure
            gateways.
          </Text>
        </SectionCard>

        <SectionCard icon="share-alt" title="4. Sharing of Information">
          <Text style={styles.bodyText}>
            We do not sell or trade your personal information. However, we may share it with trusted
            third-party partners for logistics, payment processing, and customer support.
          </Text>
        </SectionCard>

        <SectionCard icon="user-check" title="5. Your Rights">
          <Text style={styles.bodyText}>
            You have the right to request access, modification, or deletion of your personal data. If
            you wish to opt out of promotional communications, you can do so anytime.
          </Text>
        </SectionCard>

        <SectionCard icon="sync-alt" title="6. Updates to Privacy Policy">
          <Text style={styles.bodyText}>
            We may update this policy periodically. Any changes will be communicated through our
            website and email notifications.
          </Text>
        </SectionCard>

        <SectionCard icon="question-circle" title="7. For Queries">
          <Text style={styles.bodyText}>Have questions or concerns about your privacy?</Text>
          <TouchableOpacity onPress={openMail} activeOpacity={0.85} style={styles.mailBtn}>
            <Icon name="envelope" size={12} color="#fff" />
            <Text style={styles.mailText}>{SUPPORT_EMAIL}</Text>
          </TouchableOpacity>
        </SectionCard>

        <Text style={styles.footerNote}>ॐ — Made with devotion</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  header: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  headerSub: { color: '#E2E8F0', marginTop: 10, fontWeight: '600' },

  content: { padding: 16, gap: 12, paddingBottom: 28 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { color: '#0f172a', fontWeight: '900', fontSize: 16 },

  bodyText: { color: '#334155', fontWeight: '600', lineHeight: 20 },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 6 },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F97316',
    marginTop: 7,
  },

  mailBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#F97316',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mailText: { color: '#fff', fontWeight: '800', letterSpacing: 0.2 },

  footerNote: { textAlign: 'center', color: '#94A3B8', fontWeight: '600', marginTop: 4 },
});