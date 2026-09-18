import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  getBrandsByCategory,
  type VehicleCategory,
} from './src/data/powersportsBrands';

const CATEGORY_OPTIONS: Array<{ id: VehicleCategory; label: string }> = [
  { id: 'ATV_UTV', label: 'VTT / Côte-à-côte' },
  { id: 'SNOWMOBILE', label: 'Motoneige' },
  { id: 'WATERCRAFT', label: 'Marine / Motomarine' },
  { id: 'MOTORCYCLE', label: 'Moto' },
  { id: 'TRAILER', label: 'Remorque' },
];

const CONDITIONS = ['Excellent', 'Bon', 'À reconditionner'] as const;

function apiUrl(path: string): string {
  const origin = (process.env.EXPO_PUBLIC_API_ORIGIN || '').replace(/\/$/, '');
  return origin ? `${origin}${path}` : path;
}

export default function App() {
  const [category, setCategory] = useState<VehicleCategory>('ATV_UTV');
  const brands = useMemo(() => getBrandsByCategory(category), [category]);

  const [brand, setBrand] = useState('Yamaha');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [mileageHours, setMileageHours] = useState('');
  const [condition, setCondition] = useState<(typeof CONDITIONS)[number]>('Bon');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submitLead() {
    if (!clientName.trim() || !clientPhone.trim() || !clientEmail.trim()) {
      Alert.alert('Informations requises', 'Indique le nom, le téléphone et le courriel du client.');
      return;
    }
    if (!brand.trim() || !model.trim() || !year.trim()) {
      Alert.alert('Véhicule incomplet', 'Indique la marque, le modèle et l’année.');
      return;
    }

    setSending(true);
    setSent(false);
    try {
      const response = await fetch(apiUrl('/api/leads'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientPhone,
          clientEmail,
          category,
          brand,
          model,
          year,
          mileageHours,
          condition,
          notes,
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          body?.error === 'EMAIL_NOT_CONFIGURED'
            ? 'Le service courriel doit être configuré sur le serveur.'
            : 'La demande n’a pas pu être transmise.'
        );
      }

      setSent(true);
      Alert.alert('Demande transmise', 'Le prospect a été envoyé à l’équipe des ventes Théo Récréo.');
    } catch (error) {
      Alert.alert(
        'Transmission impossible',
        error instanceof Error ? error.message : 'Réessaie dans quelques instants.'
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.kicker}>MAGIC APP PRODUCTION</Text>
          <Text style={styles.title}>Magic Book Powersports</Text>
          <Text style={styles.version}>V4.6 · Bêta terrain</Text>
          <Text style={styles.subtitle}>
            Évaluation et acquisition de véhicules de loisirs — interface de test avant Google Play.
          </Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>1. Type de véhicule</Text>
          <View style={styles.wrap}>
            {CATEGORY_OPTIONS.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  setCategory(item.id);
                  const first = getBrandsByCategory(item.id)[0];
                  setBrand(first?.name || '');
                }}
                style={[styles.chip, category === item.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, category === item.id && styles.chipTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionTitle}>2. Marque</Text>
          <View style={styles.wrap}>
            {brands.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setBrand(item.name === 'Autre marque...' ? '' : item.name)}
                style={[styles.brandChip, brand === item.name && styles.brandChipActive]}
              >
                <Text style={[styles.brandText, brand === item.name && styles.brandTextActive]}>
                  {item.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <Field label="Marque sélectionnée" value={brand} onChangeText={setBrand} placeholder="Ex. Yamaha" />
          <Field label="Modèle" value={model} onChangeText={setModel} placeholder="Ex. Wolverine RMAX2" />
          <Field
            label="Année"
            value={year}
            onChangeText={setYear}
            placeholder="2026"
            keyboardType="number-pad"
          />
          <Field
            label="Kilométrage / heures"
            value={mileageHours}
            onChangeText={setMileageHours}
            placeholder="Ex. 3 200 km ou 240 h"
          />

          <Text style={styles.label}>Condition</Text>
          <View style={styles.wrap}>
            {CONDITIONS.map((value) => (
              <Pressable
                key={value}
                onPress={() => setCondition(value)}
                style={[styles.chip, condition === value && styles.chipActive]}
              >
                <Text style={[styles.chipText, condition === value && styles.chipTextActive]}>
                  {value}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>3. Prospect</Text>
          <Field label="Nom" value={clientName} onChangeText={setClientName} placeholder="Nom du client" />
          <Field
            label="Téléphone"
            value={clientPhone}
            onChangeText={setClientPhone}
            placeholder="819-000-0000"
            keyboardType="phone-pad"
          />
          <Field
            label="Courriel"
            value={clientEmail}
            onChangeText={setClientEmail}
            placeholder="client@exemple.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Notes / commentaires</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Accessoires, état, détails importants…"
            placeholderTextColor="#71849A"
            multiline
            maxLength={2000}
            style={[styles.input, styles.notes]}
          />

          <Pressable
            disabled={sending}
            onPress={submitLead}
            style={({ pressed }) => [
              styles.primaryButton,
              (pressed || sending) && styles.primaryButtonPressed,
            ]}
          >
            {sending ? (
              <ActivityIndicator color="#061121" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {sent ? '✓ Prospect transmis' : 'Transmettre à Théo Récréo'}
              </Text>
            )}
          </Pressable>

          <Text style={styles.routing}>
            Ventes : theorecreo.ventes@gmail.com · CC Jonathan + Jeff
          </Text>
        </View>

        <Text style={styles.footer}>Une création de Magic App Production · Signé JoLab</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText(value: string): void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#71849A"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#030B17' },
  page: { padding: 18, paddingBottom: 42, gap: 16 },
  hero: {
    borderWidth: 1,
    borderColor: 'rgba(197,155,95,0.42)',
    borderRadius: 24,
    padding: 24,
    backgroundColor: '#0B192B',
  },
  kicker: { color: '#5DE2E7', fontSize: 11, fontWeight: '800', letterSpacing: 2.2 },
  title: { color: '#F2D792', fontSize: 30, fontWeight: '900', marginTop: 8 },
  version: { color: '#5DE2E7', fontWeight: '800', marginTop: 6 },
  subtitle: { color: '#C1D0DF', lineHeight: 21, marginTop: 12 },
  panel: {
    borderWidth: 1,
    borderColor: 'rgba(93,226,231,0.18)',
    borderRadius: 22,
    padding: 18,
    backgroundColor: '#081727',
  },
  sectionTitle: { color: '#F2D792', fontSize: 18, fontWeight: '800', marginBottom: 12, marginTop: 4 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  chip: {
    borderWidth: 1,
    borderColor: 'rgba(193,208,223,0.24)',
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: '#061121',
  },
  chipActive: { borderColor: '#5DE2E7', backgroundColor: '#0B2A38' },
  chipText: { color: '#C1D0DF', fontSize: 13 },
  chipTextActive: { color: '#5DE2E7', fontWeight: '800' },
  brandChip: {
    borderWidth: 1,
    borderColor: 'rgba(197,155,95,0.22)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 11,
    backgroundColor: '#061121',
  },
  brandChipActive: { borderColor: '#C59B5F', backgroundColor: '#251D10' },
  brandText: { color: '#C1D0DF', fontSize: 12 },
  brandTextActive: { color: '#F2D792', fontWeight: '800' },
  field: { marginBottom: 13 },
  label: { color: '#C1D0DF', fontSize: 13, fontWeight: '700', marginBottom: 7 },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: 'rgba(193,208,223,0.25)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#FFFFFF',
    backgroundColor: '#020B18',
  },
  notes: { minHeight: 110, textAlignVertical: 'top' },
  primaryButton: {
    minHeight: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2D792',
    marginTop: 10,
  },
  primaryButtonPressed: { opacity: 0.75 },
  primaryButtonText: { color: '#061121', fontSize: 16, fontWeight: '900' },
  routing: { color: '#71849A', textAlign: 'center', fontSize: 11, marginTop: 12 },
  footer: { color: '#8FA4B9', textAlign: 'center', fontSize: 12, marginTop: 6 },
});
