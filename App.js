import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Image, TextInput,
  TouchableOpacity, Alert, Linking, ScrollView, ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFIL_KEY = '@profilecard_data';

export default function App() {
  // --- States ---
  const [foto, setFoto] = useState(null);            
  const [nama, setNama] = useState('');               
  const [lokasi, setLokasi] = useState(null);         
  const [galeriFoto, setGaleriFoto] = useState([]);   
  const [cuaca, setCuaca] = useState(null);           
  const [loadingCuaca, setLoadingCuaca] = useState(false);
  const [showPriming, setShowPriming] = useState(true); 

  // --- Effect: Load Data ---
  useEffect(() => {
    async function muatData() {
      try {
        const json = await AsyncStorage.getItem(PROFIL_KEY);
        if (json != null) {
          const data = JSON.parse(json);
          setFoto(data.foto || null);
          setNama(data.nama || '');
          setLokasi(data.lokasi || null);
          setGaleriFoto(data.galeriFoto || []);
          if (data.lokasi) {
            ambilCuacaAPI(data.lokasi.latitude, data.lokasi.longitude);
          }
        }
      } catch (e) {
        console.log('Gagal memuat data:', e);
      }
    }
    muatData();
  }, []);

  // --- Helper: Simpan Data ---
  async function simpanData(fotoBaru, namaBaru, lokasiBaru, galeriBaru) {
    try {
      const data = JSON.stringify({
        foto: fotoBaru,
        nama: namaBaru,
        lokasi: lokasiBaru,
        galeriFoto: galeriBaru
      });
      await AsyncStorage.setItem(PROFIL_KEY, data);
    } catch (e) {
      console.log('Gagal menyimpan data:', e);
    }
  }

  // --- Fitur: Tombol Settings ---
  function tanganiPenolakanIzin(pesan) {
    Alert.alert(
      'Izin Ditolak',
      `${pesan}\n\nAnda dapat mengaktifkannya secara manual melalui pengaturan aplikasi.`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: '⚙️ Buka Pengaturan', onPress: () => Linking.openSettings() }
      ]
    );
  }

  // --- Fitur: Kamera & Galeri ---
  async function ambilFotoKamera() {
    const izin = await ImagePicker.requestCameraPermissionsAsync();
    if (izin.status !== 'granted') {
      tanganiPenolakanIzin('Aplikasi membutuhkan izin kamera untuk mengambil foto.');
      return;
    }

    const hasil = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!hasil.canceled) {
      const uriBaru = hasil.assets[0].uri;
      setFoto(uriBaru);
      const galeriBaru = [uriBaru, ...galeriFoto];
      setGaleriFoto(galeriBaru);
      simpanData(uriBaru, nama, lokasi, galeriBaru);
    }
  }

  async function pilihDariGaleri() {
    const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (izin.status !== 'granted') {
      tanganiPenolakanIzin('Aplikasi membutuhkan izin galeri untuk memilih foto.');
      return;
    }

    const hasil = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!hasil.canceled) {
      const uriBaru = hasil.assets[0].uri;
      setFoto(uriBaru);
      const galeriBaru = [uriBaru, ...galeriFoto];
      setGaleriFoto(galeriBaru);
      simpanData(uriBaru, nama, lokasi, galeriBaru);
    }
  }

  function ubahFotoPicker() {
    Alert.alert(
      'Ubah Foto Profil',
      'Silakan pilih sumber foto:',
      [
        { text: '📸 Kamera', onPress: ambilFotoKamera },
        { text: '🖼️ Galeri', onPress: pilihDariGaleri },
        { text: 'Batal', style: 'cancel' },
      ]
    );
  }

  // --- Fitur: Hapus Foto ---
  function hapusFotoProfil() {
    Alert.alert(
      'Hapus Foto',
      'Apakah Anda yakin ingin menghapus foto profil ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            setFoto(null);
            simpanData(null, nama, lokasi, galeriFoto);
          }
        }
      ]
    );
  }

  // --- Fitur: GPS & Cuaca + Reverse Geocoding ---
  async function ambilLokasiDanCuaca() {
    const izin = await Location.requestForegroundPermissionsAsync();
    if (izin.status !== 'granted') {
      tanganiPenolakanIzin('Aplikasi membutuhkan izin lokasi untuk fitur check-in.');
      return;
    }

    try {
      const posisi = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = posisi.coords.latitude;
      const lon = posisi.coords.longitude;

      let namaTempat = 'Lokasi Ditemukan';
      try {
        const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        if (geocode && geocode.length > 0) {
          const place = geocode[0];
          namaTempat = `${place.district || 'Kecamatan'}, ${place.city || place.subregion || 'Kota'}`;
        }
      } catch (geoErr) {
        console.log('Geocode bypass di simulator');
      }

      const dataLokasiBaru = { latitude: lat, longitude: lon, namaTempat };
      setLokasi(dataLokasiBaru);
      simpanData(foto, nama, dataLokasiBaru, galeriFoto);

      ambilCuacaAPI(lat, lon);

    } catch (error) {
      Alert.alert('Info', 'Gagal membaca hardware GPS.');
    }
  }

  async function ambilCuacaAPI(lat, lon) {
    setLoadingCuaca(true);
    try {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
      const data = await response.json();
      if (data && data.current_weather) {
        setCuaca({
          temp: data.current_weather.temperature,
          windspeed: data.current_weather.windspeed
        });
      }
    } catch (err) {
      console.log('Gagal mengambil data cuaca:', err);
    } finally {
      setLoadingCuaca(false);
    }
  }

  // --- Fitur: Buka di Maps ---
  function bukaDiMaps() {
    if (!lokasi) return;
    const url = `http://maps.google.com/?q=${lokasi.latitude},${lokasi.longitude}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Tidak bisa membuka Google Maps.'));
  }

  // --- UI: Priming Screen ---
  if (showPriming) {
    return (
      <SafeAreaView style={styles.primingContainer}>
        <View style={styles.primingBox}>
          <Text style={styles.primingEmoji}>🌿</Text>
          <Text style={styles.primingTitle}>Selamat Datang di NativePower!</Text>
          <Text style={styles.primingDesc}>
            Aplikasi ini memerlukan akses ke <Text style={{fontWeight: 'bold', color: '#55efc4'}}>Kamera</Text> untuk foto profil dan <Text style={{fontWeight: 'bold', color: '#55efc4'}}>GPS Lokasi</Text> untuk peta & cuaca real-time.
          </Text>
          <TouchableOpacity style={styles.primingBtn} onPress={() => setShowPriming(false)}>
            <Text style={styles.primingBtnText}>Siap, Lanjutkan!</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }} style={{ width: '100%' }}>
        <Text style={styles.title}>🌿 ProfileCard App</Text>

        {/* KARTU PROFIL */}
        <View style={styles.card}>
          {foto ? (
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: foto }} style={styles.avatar} />
              <TouchableOpacity style={styles.btnHapus} onPress={hapusFotoProfil}>
                <Text style={styles.btnHapusText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={ubahFotoPicker} style={[styles.avatar, styles.avatarKosong]}>
              <Text style={{ fontSize: 40, color: '#2ed573' }}>📷</Text>
            </TouchableOpacity>
          )}

          <TextInput
            style={styles.inputNama}
            placeholder="Ketik Nama Anda di Sini..."
            placeholderTextColor="#a4b0be"
            value={nama}
            onChangeText={(teks) => {
              setNama(teks);
              simpanData(foto, teks, lokasi, galeriFoto);
            }}
            textAlign="center"
          />

          <View style={styles.divider} />

          <TouchableOpacity style={styles.btnMain} onPress={ubahFotoPicker}>
            <Text style={styles.btnMainText}>✏️ Ubah Foto Profil</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSub} onPress={ambilLokasiDanCuaca}>
            <Text style={styles.btnSubText}>📍 Ambil Lokasi & Cuaca</Text>
          </TouchableOpacity>

          {lokasi && (
            <View style={styles.infoBox}>
              <Text style={styles.txtLokasiNama}>{lokasi.namaTempat}</Text>
              <Text style={styles.koordinat}>
                Lat: {lokasi.latitude.toFixed(5)} | Lon: {lokasi.longitude.toFixed(5)}
              </Text>
              
              <TouchableOpacity style={styles.btnMaps} onPress={bukaDiMaps}>
                <Text style={styles.btnMapsText}>🗺️ Buka di Google Maps</Text>
              </TouchableOpacity>
            </View>
          )}

          {loadingCuaca && <ActivityIndicator size="small" color="#2ed573" style={{ marginTop: 10 }} />}
          {cuaca && !loadingCuaca && (
            <View style={styles.cuacaBox}>
              <Text style={styles.txtCuaca}>🌤️ Cuaca Saat Ini: {cuaca.temp}°C</Text>
              <Text style={styles.txtCuacaSub}>Kecepatan Angin: {cuaca.windspeed} km/h</Text>
            </View>
          )}
        </View>

        {/* RIWAYAT FOTO */}
        <Text style={styles.sectionTitle}>🖼️ Riwayat Foto (Galeri Mini)</Text>
        {galeriFoto.length === 0 ? (
          <Text style={styles.txtEmpty}>Belum ada riwayat foto yang diambil.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollHorizontalStyle}>
            {galeriFoto.map((item, index) => (
              <Image key={index} source={{ uri: item }} style={styles.thumbImage} />
            ))}
          </ScrollView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Visual & Tema Hijau Soft (Soft Green Mint) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1fcf6', paddingTop: 40 }, // Latar hijau sangat soft pastel
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e5f38', marginBottom: 20, textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 24,
    alignItems: 'center', width: '88%',
    elevation: 4, shadowColor: '#2ed573', shadowOpacity: 0.1, shadowRadius: 10,
    marginBottom: 25, borderWidth: 1, borderColor: '#e1f7ec'
  },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 130, height: 130, borderRadius: 65, marginBottom: 16, borderWidth: 2, borderColor: '#a7f3d0' },
  avatarKosong: {
    backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#2ed573', borderStyle: 'dashed',
  },
  btnHapus: {
    position: 'absolute', right: 2, top: 2, backgroundColor: '#ff6b6b',
    width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff'
  },
  btnHapusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  inputNama: {
    fontSize: 20, fontWeight: 'bold', color: '#1e5f38',
    borderBottomWidth: 1, borderBottomColor: '#a7f3d0', width: '85%', paddingVertical: 6,
  },
  divider: { width: '100%', height: 1, backgroundColor: '#f0fdf4', marginVertical: 15 },
  btnMain: {
    backgroundColor: '#2ed573', borderRadius: 12, // Hijau mint cerah utama
    paddingVertical: 13, paddingHorizontal: 20, marginTop: 12, width: '90%',
  },
  btnMainText: { color: '#fff', fontWeight: 'bold', fontSize: 15, textAlign: 'center' },
  btnSub: {
    backgroundColor: '#e1f7ec', borderRadius: 12, // Hijau soft pastel sekunder
    paddingVertical: 13, paddingHorizontal: 20, marginTop: 12, width: '90%',
    borderWidth: 1, borderColor: '#a7f3d0'
  },
  btnSubText: { color: '#1e5f38', fontWeight: 'bold', fontSize: 15, textAlign: 'center' },
  infoBox: { marginTop: 15, alignItems: 'center', backgroundColor: '#f0fdf4', padding: 12, borderRadius: 12, width: '90%', borderWidth: 1, borderColor: '#e1f7ec' },
  txtLokasiNama: { fontSize: 14, fontWeight: 'bold', color: '#1e5f38', marginBottom: 4, textAlign: 'center' },
  koordinat: { fontSize: 12, color: '#569471', fontWeight: '600' },
  btnMaps: { marginTop: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#2ed573', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  btnMapsText: { color: '#2ed573', fontSize: 12, fontWeight: 'bold' },
  cuacaBox: { marginTop: 10, backgroundColor: '#eafaf1', padding: 10, borderRadius: 10, width: '90%', alignItems: 'center', borderWidth: 1, borderColor: '#d1f5e1' },
  txtCuaca: { fontSize: 14, fontWeight: 'bold', color: '#1e5f38' },
  txtCuacaSub: { fontSize: 11, color: '#569471' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e5f38', alignSelf: 'flex-start', marginLeft: '7%', marginBottom: 10, marginTop: 10 },
  scrollHorizontalStyle: { paddingLeft: '6%', width: '100%', flexDirection: 'row' },
  thumbImage: { width: 85, height: 85, borderRadius: 12, marginRight: 12, borderWidth: 1.5, borderColor: '#a7f3d0' },
  txtEmpty: { fontSize: 13, color: '#88a895', fontStyle: 'italic', marginLeft: '7%', alignSelf: 'flex-start' },
  
  primingContainer: { flex: 1, backgroundColor: '#1e5f38', justifyContent: 'center', alignItems: 'center' }, // Deep green background
  primingBox: { backgroundColor: '#fff', width: '85%', padding: 30, borderRadius: 24, alignItems: 'center', elevation: 10 },
  primingEmoji: { fontSize: 50, marginBottom: 15 },
  primingTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e5f38', textAlign: 'center', marginBottom: 12 },
  primingDesc: { fontSize: 14, color: '#569471', textAlign: 'center', lineHeight: 20, marginBottom: 25 },
  primingBtn: { backgroundColor: '#2ed573', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 12, width: '100%' },
  primingBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }
});