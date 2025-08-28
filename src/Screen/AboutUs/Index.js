// AboutUs.tsx
import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';

const SECTIONS = [
  {
    key: 'birth',
    title: 'The Birth of 33 Crores',
    icon: 'seedling',
    body:
      'Our journey began with a simple yet profound realization: amidst our care for earthly comforts, have we overlooked the very creators of the Earth and the universe? Brahma, Vishnu, and Maheswar—supreme powers and parental figures in the vast cosmos—deserve our unwavering devotion.',
  },
  {
    key: 'what',
    title: 'What is 33 Crores',
    icon: 'bullseye',
    body:
      '33 Crores is a platform dedicated to connecting devotees with temples, rituals, and spiritual experiences. We aim to preserve and promote the rich cultural and religious heritage of India by making temple services accessible online.',
  },
  {
    key: 'vision',
    title: 'Our Vision',
    icon: 'eye',
    body:
      'Our vision is to become the largest spiritual platform that connects every temple in India with devotees across the globe, preserving the divine connection between faith, tradition, and modern technology.',
  },
  {
    key: 'how',
    title: 'How It Works',
    icon: 'cogs',
    body:
      'Through 33 Crores, devotees can book temple services, participate in virtual poojas, donate to temples, and receive blessings—all through a seamless online experience.',
  },
];

const Index = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Hero Header (matches your template) */}
      <LinearGradient colors={['#1E293B', '#334155', '#475569']} style={styles.header}>
        <View style={styles.heroContent}>
          <TouchableOpacity style={styles.headerRow} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={22} color="#fff" style={styles.backIcon} />
            <Text style={styles.heroTitle}>About Us</Text>
          </TouchableOpacity>
          <Text style={styles.heroSubtitle}>
            Faith, tradition & technology — brought together for every devotee.
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stacked full-width cards */}
        {SECTIONS.map((s) => (
          <View key={s.key} style={styles.block}>
            <View style={styles.blockHeader}>
              <LinearGradient colors={['#F59E0B', '#F97316']} style={styles.badge}>
                <Icon name={s.icon} size={14} color="#fff" />
              </LinearGradient>
              <Text style={styles.blockTitle}>{s.title}</Text>
            </View>
            <Text style={styles.blockText}>{s.body}</Text>
          </View>
        ))}

        {/* Join Us – highlighted CTA card */}
        <LinearGradient colors={['#FFF7ED', '#FFE7D1']} style={styles.ctaCard}>
          <View style={styles.ctaHeader}>
            <View style={styles.ctaBadge}>
              <Icon name="hands-helping" size={14} color="#F97316" />
            </View>
            <Text style={styles.ctaTitle}>Join Us</Text>
          </View>
          <Text style={styles.ctaText}>
            We invite every temple, devotee, and spiritual seeker to join hands with 33 Crores.
            Together, let’s bridge the gap between faith and technology.
          </Text>
        </LinearGradient>

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
  heroSubtitle: {
    color: '#E2E8F0',
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '600',
  },

  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28, gap: 12 },

  block: {
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
  blockHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  badge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  blockTitle: { color: '#0f172a', fontWeight: '900', fontSize: 18, flexShrink: 1 },
  blockText: { color: '#334155', fontWeight: '700', lineHeight: 20, marginTop: 2 },

  ctaCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  ctaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  ctaBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFF1E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  ctaTitle: { color: '#0f172a', fontWeight: '900', fontSize: 18 },
  ctaText: { color: '#334155', fontWeight: '700', lineHeight: 20 },

  footerNote: { textAlign: 'center', color: '#64748B', fontWeight: '600', marginTop: 10 },
});