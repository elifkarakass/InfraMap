#  InfraMap — Altyapı Proje Takip Haritası

Yol, içme suyu, kanalizasyon, atıksu ve CBS/fotogrametri projelerini tam ekran bir
uydu haritası üzerinde takip etmeye yarayan, cam efektli (glassmorphism) arayüze
sahip bir web uygulaması. Flask + SQLite backend'i ve Leaflet.js tabanlı bir harita
kullanır; İngilizce/Türkçe dil desteği içerir.

## Neden bu proje?

Daha önce Python, SQL, Flask/FastAPI ve Chart.js ile veri analitiği ağırlıklı projeler
geliştirmiştim (fintech funnel analizi, kripto para dashboard'u, hava durumu paneli).
Bu projede aynı yaklaşımı haritalama/CBS tarafına taşıyarak, mühendislik firmalarının
altyapı projelerini konumsal olarak yönetmesine yardımcı olacak bir araç kurguladım.

## Özellikler

-  **Tam ekran uydu haritası** (Leaflet.js + Esri World Imagery) — projeler tip
  bazlı renkli pin'ler olarak gösterilir; renk kodu gerçek yeraltı altyapı işaretleme
  standardından (APWA) esinlenilmiştir
-  **4 sekmeli, işlevsel üst menü**
  - **Ana Sayfa** — özet istatistikler + filtrelenebilir proje listesi
  - **Projeler** — tüm projelerin tablo görünümü (ad, tip, durum, ilçe)
  - **Analiz** — Chart.js ile tipe ve duruma göre proje dağılım grafikleri
  - **Raporlar** — tip/durum bazlı özet, CSV dışa aktarma ve yazdırma
-  **Haritaya tıklayarak proje ekleme** — koordinatlar otomatik doldurulur
-  **Düzenleme / silme** — bir projeye tıklayıp bilgilerini güncelleyebilir veya
  silebilirsin
-  **Filtreleme ve arama** — tipe, duruma veya metne göre projeleri filtrele
-  **EN/TR dil desteği** — sağ üstteki düğmeyle anında dil değişimi
-  **CSV dışa aktarma ve yazdırma** — Raporlar sekmesinden tüm proje listesini
  indirebilir veya yazdırılabilir bir görünüm açabilirsin
-  **REST API** — tüm işlemler `/api/projeler` ve `/api/istatistikler`
  endpoint'leri üzerinden JSON olarak yapılır, frontend'den bağımsız olarak da
  kullanılabilir

## Kullanılan teknolojiler

| Katman     | Teknoloji                              |
|------------|------------------------------------------|
| Backend    | Python, Flask                             |
| Veritabanı | SQLite (ham `sqlite3`, ORM yok)           |
| Frontend   | HTML, CSS (glassmorphism), Vanilla JavaScript |
| Harita     | Leaflet.js + Esri World Imagery (uydu)    |
| Grafik     | Chart.js                                  |
| i18n       | Basit anahtar/değer sözlüğüyle EN/TR çeviri |

## Kurulum ve çalıştırma

```bash
git clone https://github.com/<kullanici-adin>/altyapi-proje-haritasi.git
cd altyapi-proje-haritasi

python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

pip install -r requirements.txt
python app.py
```

Sonra tarayıcıdan `http://127.0.0.1:5000` adresine git. İlk çalıştırmada veritabanı
otomatik oluşturulur ve birkaç örnek proje eklenir.

## Proje yapısı

```
altyapi-proje-haritasi/
├── app.py                 # Flask backend: route'lar, SQLite sorguları, API
├── requirements.txt
├── templates/
│   └── index.html         # Tek sayfalık arayüz (4 sekme, modal, i18n)
└── static/
    ├── css/style.css       # Glassmorphism tema, sekme/tablo/grafik/rapor stilleri
    └── js/app.js           # Harita, sekme geçişi, API, grafik, CSV/yazdırma mantığı
```

## API özeti

| Metod  | Endpoint                  | Açıklama                              |
|--------|----------------------------|----------------------------------------|
| GET    | `/api/projeler`            | Projeleri listeler (`tip`, `durum`, `q` filtreleriyle) |
| GET    | `/api/projeler/<id>`       | Tek bir projeyi getirir                |
| POST   | `/api/projeler`            | Yeni proje ekler                       |
| PUT    | `/api/projeler/<id>`       | Projeyi günceller                      |
| DELETE | `/api/projeler/<id>`       | Projeyi siler                          |
| GET    | `/api/istatistikler`       | Tip/duruma göre proje sayıları (SQL `GROUP BY`) |

## Geliştirme sürecinde yapay zekâ kullanımı

Bu projeyi geliştirirken Claude'u kod yazımı, hata ayıklama ve yapı planlaması
sürecinde aktif olarak kullandım — Flask route yapısı, SQLite sorguları, Leaflet
entegrasyonu ve sekme tabanlı frontend mimarisi konusunda. Üretilen kodu çalıştırıp
test ederek (CRUD işlemleri, filtreler, sekme geçişleri, CSV/yazdırma, hata
durumları) doğruluğunu kendim doğruladım.

## Yol haritası (geliştirilebilir fikirler)

- [ ] Poligon/çizgi (yol güzergahı) desteği, sadece nokta değil
- [ ] Kullanıcı girişi ve yetkilendirme
- [ ] React + TypeScript ile frontend'i yeniden yazma

## Lisans

Bu proje kişisel bir portföy/öğrenme projesidir, MIT lisansı ile paylaşılmıştır.
