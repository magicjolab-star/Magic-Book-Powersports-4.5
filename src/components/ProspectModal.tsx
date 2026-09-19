import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  getBrandsByCategory,
  type VehicleCategory,
} from '../data/powersportsBrands';

const CATEGORIES: Array<{ id: VehicleCategory; label: string }> = [
  { id: 'ATV_UTV', label: 'VTT / Côte-à-côte' },
  { id: 'SNOWMOBILE', label: 'Motoneige' },
  { id: 'WATERCRAFT', label: 'Marine / Motomarine' },
  { id: 'MOTORCYCLE', label: 'Moto' },
  { id: 'TRAILER', label: 'Remorque' },
];

function apiUrl(path: string): string {
  const origin = (process.env.EXPO_PUBLIC_API_ORIGIN || '').replace(/\/$/, '');
  return origin ? `${origin}${path}` : path;
}

export default function ProspectModal({
  visible,
  onClose,
  currency,
}: {
  visible: boolean;
  onClose(): void;
  currency: string;
}) {
  const [category, setCategory] = useState<VehicleCategory>('ATV_UTV');
  const brands = useMemo(() => getBrandsByCategory(category), [category]);

  const [brand, setBrand] = useState('Yamaha');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [mileageHours, setMileageHours] = useState('');
  const [condition, setCondition] = useState('Bon');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!clientName.trim() || !clientPhone.trim() || !clientEmail.trim()) {
      Alert.alert('Informations requises', 'Nom, téléphone et courriel sont requis.');
      return;
    }

    if (!brand.trim() || !model.trim() || !year.trim()) {
      Alert.alert('Véhicule incomplet', 'Marque, modèle et année sont requis.');
      return;
    }

    setSending(true);

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
          notes: [notes, `Devise sélectionnée: ${currency}`].filter(Boolean).join('\n'),
        }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(body?.error || 'TRANSMISSION_FAILED');
      }

      Alert.alert('Prospect transmis', 'Le prospect a été envoyé à Théo Récréo.');
      onClose();
    } catch (error) {
      Alert.alert(
        'Transmission impossible',
        error instanceof Error ? error.message : 'Erreur inconnue',
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>THÉO RÉCRÉO</Text>
              <Text style={styles.title}>Transmettre un prospect</Text>
            </View>

            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            <Text style={styles.label}>Catégorie</Text>
            <View style={styles.wrap}>
              {CATEGORIES.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    setCategory(item.id);
                    setBrand(getBrandsByCategory(item.id)[0]?.name ?? '');
                  }}
                  style={[styles.chip, category === item.id && styles.chipActive]}
                >
                  <Text style={[styles.chipText, category === item.id && styles.chipTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Marque</Text>
            <View style={styles.wrap}>
              {brands.slice(0, 12).map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => setBrand(item.name === 'Autre marque...' ? '' : item.name)}
                  style={[styles.chip, brand === item.name && styles.chipActive]}
                >
                  <Text style={[styles.chipText, brand === item.name && styles.chipTextActive]}>
                    {item.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Field label="Marque" value={brand} onChangeText={setBrand} />
            <Field label="Modèle" value={model} onChangeText={setModel} />
            <Field label="Année" value={year} onChangeText={setYear} keyboardType="number-pad" />
            <Field
              label="Kilométrage / heures"
              value={mileageHours}
              onChangeText={setMileageHours}
            />
            <Field label="Condition" value={condition} onChangeText={setCondition} />
            <Field label="Nom du client" value={clientName} onChangeText={setClientName} />
            <Field
              label="Téléphone"
              value={clientPhone}
              onChangeText={setClientPhone}
              keyboardType="phone-pad"
            />
            <Field
              label="Courriel"
              value={clientEmail}
              onChangeText={setClientEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={2000}
              placeholder="Accessoires, état, détails importants…"
              placeholderTextColor="#686F7C"
              style={[styles.input, styles.notes]}
            />

            <Pressable
              disabled={sending}
              onPress={submit}
              style={({ pressed }) => [
                styles.submit,
                (pressed || sending) && styles.submitPressed,
              ]}
            >
              {sending ? (
                <ActivityIndicator color="#0A0D14" />
              ) : (
                <Text style={styles.submitText}>Transmettre à Théo Récréo</Text>
              )}
            </Pressable>

            <Text style={styles.routing}>
              theorecreo.ventes@gmail.com · CC Jonathan · CC Jeff
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChangeText(value: string): void;
  keyboardType?: 'default' | 'number-pad' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor="#686F7C"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.76)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: '#0A0D14',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.38)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,175,55,0.15)',
  },
  eyebrow: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 30,
  },
  content: {
    padding: 20,
    paddingBottom: 30,
  },
  label: {
    color: '#C8CBD2',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 7,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: '#11151E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  chipActive: {
    borderColor: '#D4AF37',
    backgroundColor: '#241E0B',
  },
  chipText: {
    color: '#AEB4BF',
    fontSize: 12,
  },
  chipTextActive: {
    color: '#F3DA78',
    fontWeight: '900',
  },
  field: {
    marginBottom: 13,
  },
  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#FFFFFF',
    backgroundColor: '#07090E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
  },
  notes: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submit: {
    minHeight: 54,
    marginTop: 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
  },
  submitPressed: {
    opacity: 0.72,
  },
  submitText: {
    color: '#0A0D14',
    fontSize: 15,
    fontWeight: '950',
  },
  routing: {
    color: '#777D89',
    textAlign: 'center',
    fontSize: 11,
    marginTop: 12,
  },
});
