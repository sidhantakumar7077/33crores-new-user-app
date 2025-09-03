import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';

const EMAIL = 'contact@33crores.com';

const TERMS = [
  {
    icon: 'globe',
    title: 'Use of Website',
    body:
      'You must be at least 18 years old to make a purchase. You agree to provide accurate and complete information when registering or placing an order.',
  },
  {
    icon: 'info-circle',
    title: 'Product Information',
    body:
      'We strive to provide accurate product descriptions, but variations in color, size, and texture may occur. 33 Crores is not responsible for minor discrepancies.',
  },
  {
    icon: 'rupee-sign',
    title: 'Pricing & Payments',
    body:
      'Prices listed are inclusive of applicable taxes. We accept payments via secure gateways. Your financial details are protected.',
  },
  {
    icon: 'truck',
    title: 'Shipping & Delivery',
    body:
      'Orders are processed within 1–3 business days. Delivery timelines vary based on location. Delays due to unforeseen circumstances are not the responsibility of 33 Crores.',
  },
  {
    icon: 'undo-alt',
    title: 'Returns & Refunds',
    body:
      'Refer to our Cancellation & Returns Policy for details on refunds and exchanges.',
  },
  {
    icon: 'copyright',
    title: 'Intellectual Property',
    body:
      'All content, including images, text, and designs, is the property of 33 Crores. Unauthorized use or reproduction is prohibited.',
  },
  {
    icon: 'exclamation-triangle',
    title: 'Limitation of Liability',
    body:
      '33 Crores is not responsible for any indirect damages resulting from the use of our products.',
  },
  {
    icon: 'sync-alt',
    title: 'Changes to Terms',
    body:
      'We may update our Terms & Conditions at any time. Continued use of our website implies acceptance of revised terms.',
  },
];

const openMail = async () => {
  try {
    const url = `mailto:${EMAIL}`;
    const ok = await Linking.canOpenURL(url);
    if (!ok) throw new Error('Cannot open');
    await Linking.openURL(url);
  } catch {
    Alert.alert('Unable to open email', 'Please try again later.');
  }
};

const Index = () => {
  
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Hero header (same template) */}
      <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.header}>
        <View style={styles.heroContent}>
          <TouchableOpacity style={styles.headerRow} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={22} color="#fff" style={styles.backIcon} />
            <Text style={styles.heroTitle}>Terms & Conditions</Text>
          </TouchableOpacity>
          <Text style={styles.heroSubtitle}>
            Please read these terms carefully before using our services.
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* One elegant “paper” card holding all terms (like your web shot) */}
        <View style={styles.paper}>
          <View style={styles.paperHeader}>
            <View style={styles.headerBadge}>
              <Icon name="file-alt" size={14} color="#fff" />
            </View>
            <Text style={styles.paperTitle}>Terms & Conditions</Text>
          </View>

          {TERMS.map((t, i) => (
            <View
              key={t.title}
              style={[styles.termRow, i < TERMS.length - 1 && styles.termDivider]}
            >
              <View style={styles.termIcon}>
                <Icon name={t.icon} size={14} color="#F97316" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.termHeading}>{`${i + 1}. ${t.title}`}</Text>
                <Text style={styles.termBody}>{t.body}</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity onPress={openMail} activeOpacity={0.85} style={styles.helpRow}>
            <Text style={styles.helpText}>
              For inquiries, contact us at{' '}
              <Text style={styles.link}>{EMAIL}</Text>.
            </Text>
          </TouchableOpacity>
        </View>

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
    paddingTop: 50,
    paddingBottom: 22,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroContent: {},
  headerRow: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    flexDirection: 'row',
  },
  backIcon: { position: 'absolute', left: 0 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  heroSubtitle: { color: '#E2E8F0', textAlign: 'center', marginTop: 6, fontWeight: '600' },

  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28 },

  paper: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  paperHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  headerBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  paperTitle: { color: '#0f172a', fontWeight: '900', fontSize: 18 },

  termRow: { flexDirection: 'row', gap: 10, paddingVertical: 12 },
  termDivider: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  termIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  termHeading: { color: '#0f172a', fontWeight: '900', marginBottom: 4 },
  termBody: { color: '#334155', fontWeight: '600', lineHeight: 20 },

  helpRow: { marginTop: 14 },
  helpText: { color: '#64748B', fontWeight: '600' },
  link: { color: '#0ea5e9', fontWeight: '800', textDecorationLine: 'underline' },

  footerNote: {
    textAlign: 'center',
    color: '#64748B',
    fontWeight: '600',
    marginTop: 12,
  },
});