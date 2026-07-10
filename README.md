# 🌿 NativePower — Pertemuan 13 Praktikum

Aplikasi kartu profil interaktif React Native + Expo yang bertema Soft Mint Green, 
mendemonstrasikan integrasi komponen native (Kamera, Galeri, GPS) dan asinkronus data.

## Fitur
- Input nama pengguna yang interaktif
- [Level 2] Alert Picker untuk memilih sumber foto (Kamera atau Galeri)
- [Level 2] Galeri mini horizontal untuk menampung riwayat jepretan foto
- [Level 2] Intent Redirection untuk membuka titik koordinat langsung di Google Maps
- Membaca GPS internal HP & mendeteksi nama wilayah asli (Reverse Geocoding)
- Integrasi prakiraan cuaca lokal secara real-time dari API Open-Meteo
- Menyimpan data secara permanen di memori HP (AsyncStorage) agar tidak hilang saat aplikasi ditutup
- Layar edukasi privasi awal (Priming Screen) & penanganan penolakan izin yang ramah (Graceful Denial)

## Fitur Native yang Dipakai
- Expo Image Picker (`expo-image-picker`) -> Kamera & Galeri Foto
- Expo Location (`expo-location`) -> Hardware GPS Internal HP

## Tech Stack & Konsep yang Dipakai
- React Native (Expo SDK 54) + JavaScript (ES6+)
- useState (State management), useEffect (Auto-load data persistent)
- AsyncStorage (Data persistence) & Fetch API (Asynchronous HTTP Request)
- Alert & Linking Intent untuk membuka Google Maps & menu Settings HP

## Cara Menjalankan
1. npm install
2. npx expo start -c
3. Scan QR dengan Expo Go

## Link
- Expo Snack: https://snack.expo.dev/@jepin/501b47

## Screenshot

![Dialog Izin](screenshots/permission.png)
![Hasil Foto & Lokasi Sukses](screenshots/success.png)
![Penanganan Penolakan](screenshots/denied.png)

## Author
Jeviens Paradisa Finie Adena - 243303621213 - Universitas Prima Indonesia
