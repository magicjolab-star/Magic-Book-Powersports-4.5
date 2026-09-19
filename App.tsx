import { Capacitor } from '@capacitor/core';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import IntroVideo from './src/components/IntroVideo';
import ProspectModal from './src/components/ProspectModal';
import {
  configureRevenueCat,
  restoreProPurchases,
  showProPaywall,
} from './src/billing/revenuecat';

type CurrencyCode = 'CAD' | 'USD' | 'EUR' | 'GBP' | 'AUD';

const CURRENCIES: Array<{ code: CurrencyCode; label: string }> = [
  { code: 'CAD', label: 'Canada' },
  { code: 'USD', label: 'USA' },
  { code: 'EUR', label: 'Europe' },
  { code: 'GBP', label: 'R.-Uni' },
  { code: 'AUD', label: 'Australie' },
];

export default function App() {
  const { width } = useWindowDimensions();

  const [introDone, setIntroDone] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>('CAD');
  const [prospectVisible, setProspectVisible] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [proActive, setProActive] = useState(false);
  const [billingReady, setBillingReady] = useState(false);
  const [billingBusy, setBillingBusy] = useState(false);

  const isNative = Capacitor.isNativePlatform();

  const contentWidth = useMemo(() => {
    if (width >= 1180) return 1080;
    if (width >= 760) return width - 64;
    return width - 28;
  }, [width]);

  useEffect(() => {
    if (!isNative) return;

    let mounted = true;

    void configureRevenueCat()
      .then((status) => {
        if (!mounted) return;
        setBillingReady(true);
        setProActive(status.active);
      })
      .catch((error) => {
        console.warn('[revenuecat/bootstrap]', error);
        if (!mounted) return;
        setBillingReady(false);
      });

    return () => {
      mounted = false;
    };
  }, [isNative]);

  async function openPro() {
    if (!isNative) {
      Alert.alert(
        'Magic Book Pro',
        'Les abonnements Pro sont disponibles dans l’application Android installée depuis Google Play.',
      );
      return;
    }

    if (!billingReady) {
      Alert.alert('Magic Book Pro', 'Le service d’abonnement se prépare. Réessaie dans un instant.');
      return;
    }

    setBillingBusy(true);

    try {
      const status = await showProPaywall();
      setProActive(status.active);
    } catch (error) {
      Alert.alert(
        'Magic Book Pro',
        error instanceof Error ? error.message : 'Le paywall ne peut pas être affiché.',
      );
    } finally {
      setBillingBusy(false);
    }
  }

  async function restorePro() {
    if (!isNative || !billingReady) {
      Alert.alert(
        'Restauration',
        'La restauration des achats est disponible sur Android via Google Play.',
      );
      return;
    }

    setBillingBusy(true);

    try {
      const status = await restoreProPurchases();
      setProActive(status.active);

      Alert.alert(
        'Restauration terminée',
        status.active ? 'Magic Book Pro est actif.' : 'Aucun abonnement Pro actif trouvé.',
      );
    } catch (error) {
      Alert.alert(
        'Restauration impossible',
        error instanceof Error ? error.message : 'Erreur inconnue.',
      );
    } finally {
      setBillingBusy(false);
    }
  }

  if (!introDone) {
    return <IntroVideo onComplete={() => setIntroDone(true)} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0D14" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.page}
      >
        <View style={[styles.content, { width: contentWidth }]}>
          <View style={styles.hero}>
            <Image
              source={require('./footer-logo.png')}
              resizeMode="contain"
              style={styles.logo as any}
            />

            <Text style={styles.eyebrow}>MAGIC APP PRODUCTION</Text>
            <Text style={styles.title}>Magic Book Powersports</Text>
            <Text style={styles.version}>V5.1 · Premium Pro</Text>

            <Text style={styles.subtitle}>
              L’outil intelligent pour évaluer, qualifier et convertir les opportunités
              Powersports avec une expérience haut de gamme prête pour l’international.
            </Text>

            <View style={styles.statusRow}>
              <StatusPill label="VERSION" value={proActive ? 'PRO' : 'GRATUITE'} />
              <StatusPill label="DEVISE" value={currency} />
              <StatusPill label="PLATEFORME" value={Platform.OS.toUpperCase()} />
            </View>
          </View>

          <View style={styles.panel}>
            <Text style={styles.sectionEyebrow}>EXPANSION MONDIALE</Text>
            <Text style={styles.sectionTitle}>Devise d’évaluation</Text>
            <Text style={styles.body}>
              La devise est un état d’affichage global. Les valeurs sources restent intactes
              afin de ne jamais introduire d’arrondi dans les calculs de dépréciation,
              plafonnement ou analyse.
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.currencyRow}
            >
              {CURRENCIES.map((item) => {
                const active = item.code === currency;

                return (
                  <Pressable
                    key={item.code}
                    onPress={() => setCurrency(item.code)}
                    style={[styles.currencyChip, active && styles.currencyChipActive]}
                  >
                    <Text
                      style={[
                        styles.currencyCode,
                        active && styles.currencyCodeActive,
                      ]}
                    >
                      {item.code}
                    </Text>
                    <Text style={styles.currencyLabel}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.leadPanel}>
            <View style={styles.leadCopy}>
              <Text style={styles.sectionEyebrow}>ACQUISITION</Text>
              <Text style={styles.sectionTitle}>Un client prêt à avancer?</Text>
              <Text style={styles.body}>
                Le formulaire reste invisible jusqu’au moment utile. Une seule action ouvre
                la fiche prospect et la transmet directement à l’équipe de ventes.
              </Text>
            </View>

            <Pressable
              onPress={() => setProspectVisible(true)}
              style={({ pressed }) => [styles.goldButton, pressed && styles.pressed]}
            >
              <Text style={styles.goldButtonText}>Transmettre à Théo Récréo</Text>
            </Pressable>
          </View>

          <View style={styles.proPanel}>
            <View style={styles.proHeader}>
              <View style={styles.proHeaderCopy}>
                <Text style={styles.proEyebrow}>MAGIC BOOK PRO</Text>
                <Text style={styles.proTitle}>
                  {proActive ? 'Expérience Pro activée' : 'Débloquer toute la puissance'}
                </Text>
              </View>

              <View style={[styles.proBadge, proActive && styles.proBadgeActive]}>
                <Text style={[styles.proBadgeText, proActive && styles.proBadgeTextActive]}>
                  {proActive ? 'ACTIF' : 'PRO'}
                </Text>
              </View>
            </View>

            <Text style={styles.proDescription}>
              Mensuel et annuel via RevenueCat + Google Play. Entitlement « pro »,
              restauration des achats et contrôle natif sécurisé.
            </Text>

            <View style={styles.features}>
              {['Analyses avancées', 'Historique cloud', 'Outils Premium', 'Expérience complète'].map(
                (feature) => (
                  <View key={feature} style={styles.feature}>
                    <Text style={styles.featureDot}>✦</Text>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ),
              )}
            </View>

            <View style={styles.proActions}>
              <Pressable
                disabled={billingBusy}
                onPress={openPro}
                style={({ pressed }) => [
                  styles.goldButton,
                  (pressed || billingBusy) && styles.pressed,
                ]}
              >
                <Text style={styles.goldButtonText}>
                  {proActive ? 'Gérer Magic Book Pro' : 'Découvrir Magic Book Pro'}
                </Text>
              </Pressable>

              <Pressable
                disabled={billingBusy}
                onPress={restorePro}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  (pressed || billingBusy) && styles.pressed,
                ]}
              >
                <Text style={styles.secondaryButtonText}>Restaurer mes achats</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={() => setAboutVisible(true)}
            style={({ pressed }) => [styles.aboutButton, pressed && styles.pressed]}
          >
            <Text style={styles.aboutButtonText}>À propos de Magic App Production</Text>
          </Pressable>

          <Text style={styles.footer}>
            Une création de Magic App Production · Signé JoLab
          </Text>
        </View>
      </ScrollView>

      <ProspectModal
        visible={prospectVisible}
        onClose={() => setProspectVisible(false)}
        currency={currency}
      />

      <AboutModal visible={aboutVisible} onClose={() => setAboutVisible(false)} />
    </SafeAreaView>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statusPill}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={styles.statusValue}>{value}</Text>
    </View>
  );
}

function AboutModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose(): void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <SafeAreaView style={styles.aboutSafe}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.aboutScroll}
          >
            <View style={styles.aboutCard}>
              <View style={styles.aboutImageContainer}>
                <Image
                  source={require('./18490.png')}
                  resizeMode="contain"
                  style={styles.aboutImage as any}
                />
              </View>

              <View style={styles.aboutContent}>
                <Text style={styles.sectionEyebrow}>À PROPOS · MAGIC APP PRODUCTION</Text>
                <Text style={styles.aboutName}>Jonathan Labelle</Text>
                <Text style={styles.aboutRole}>Créateur · Technologie · Performance</Text>
                <Text style={styles.aboutText}>
                  Magic App Production conçoit des outils intelligents qui réunissent
                  automatisation, expérience terrain et innovation pour transformer la vente
                  Powersports sans sacrifier l’humain.
                </Text>

                <Pressable onPress={onClose} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Fermer</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0D14',
  },
  page: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingBottom: 48,
    backgroundColor: '#0A0D14',
  },
  content: {
    maxWidth: 1080,
    gap: 18,
  },
  hero: {
    padding: 28,
    borderRadius: 28,
    backgroundColor: '#10141D',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.34)',
    shadowColor: '#000000',
    shadowOpacity: 0.34,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
  logo: {
    width: 220,
    height: 128,
    alignSelf: 'center',
    marginBottom: 8,
  },
  eyebrow: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 40,
    lineHeight: 43,
    fontWeight: '900',
    marginTop: 9,
  },
  version: {
    color: '#E8CB66',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 8,
  },
  subtitle: {
    color: '#C9CED8',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 15,
    maxWidth: 760,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: 22,
  },
  statusPill: {
    minWidth: 110,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#090C12',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.18)',
  },
  statusLabel: {
    color: '#737B89',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  statusValue: {
    color: '#F2DA7A',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 3,
  },
  panel: {
    padding: 22,
    borderRadius: 24,
    backgroundColor: '#0F131B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sectionEyebrow: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 6,
  },
  body: {
    color: '#AEB4BF',
    lineHeight: 21,
    marginTop: 10,
  },
  currencyRow: {
    gap: 9,
    paddingTop: 18,
    paddingBottom: 2,
  },
  currencyChip: {
    minWidth: 96,
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: 14,
    backgroundColor: '#090C12',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  currencyChipActive: {
    borderColor: '#D4AF37',
    backgroundColor: '#211B09',
  },
  currencyCode: {
    color: '#C7CBD3',
    fontSize: 14,
    fontWeight: '900',
  },
  currencyCodeActive: {
    color: '#F4D969',
  },
  currencyLabel: {
    color: '#737B89',
    fontSize: 10,
    marginTop: 3,
  },
  leadPanel: {
    padding: 22,
    borderRadius: 24,
    backgroundColor: '#0F131B',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.18)',
    gap: 18,
  },
  leadCopy: {
    maxWidth: 760,
  },
  proPanel: {
    padding: 24,
    borderRadius: 26,
    backgroundColor: '#171405',
    borderWidth: 1,
    borderColor: '#8E7420',
  },
  proHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  proHeaderCopy: {
    flex: 1,
  },
  proEyebrow: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  proTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 7,
  },
  proBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D4AF37',
    backgroundColor: '#0A0D14',
  },
  proBadgeActive: {
    backgroundColor: '#D4AF37',
  },
  proBadgeText: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '900',
  },
  proBadgeTextActive: {
    color: '#0A0D14',
  },
  proDescription: {
    color: '#D0CBAE',
    lineHeight: 21,
    marginTop: 14,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minWidth: 160,
  },
  featureDot: {
    color: '#D4AF37',
  },
  featureText: {
    color: '#ECE5C9',
    fontSize: 13,
    fontWeight: '700',
  },
  proActions: {
    gap: 10,
    marginTop: 20,
  },
  goldButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#D4AF37',
  },
  goldButtonText: {
    color: '#0A0D14',
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.34)',
    backgroundColor: '#11151D',
  },
  secondaryButtonText: {
    color: '#E9D47A',
    fontWeight: '900',
  },
  aboutButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#10141D',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
  },
  aboutButtonText: {
    color: '#E7D16F',
    fontWeight: '900',
  },
  footer: {
    color: '#6F7682',
    textAlign: 'center',
    fontSize: 12,
    marginTop: 6,
  },
  pressed: {
    opacity: 0.72,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
  },
  aboutSafe: {
    flex: 1,
  },
  aboutScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  aboutCard: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    flexDirection: 'column',
    overflow: 'hidden',
    borderRadius: 28,
    backgroundColor: '#0A0D14',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.34)',
  },
  aboutImageContainer: {
    width: '100%',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 22,
    backgroundColor: '#05070B',
  },
  aboutImage: {
    width: '100%',
    aspectRatio: 0.84,
  },
  aboutContent: {
    position: 'relative',
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 25,
    paddingBottom: 28,
    backgroundColor: '#10141D',
  },
  aboutName: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 9,
  },
  aboutRole: {
    color: '#D4AF37',
    fontWeight: '900',
    marginTop: 5,
  },
  aboutText: {
    color: '#C7CBD3',
    lineHeight: 22,
    marginTop: 16,
    marginBottom: 22,
  },
});
