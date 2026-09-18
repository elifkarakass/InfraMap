"""
Altyapi Proje Takip Haritasi
----------------------------
Yol, icme suyu, kanalizasyon ve atiksu gibi altyapi projelerini
harita uzerinde takip etmeye yarayan basit bir Flask + SQLite uygulamasi.

Calistirmak icin:
    pip install -r requirements.txt
    python app.py
Sonra tarayicidan http://127.0.0.1:5000 adresine git.
"""

from flask import Flask, jsonify, request, render_template, g
import sqlite3
import os
from datetime import datetime

app = Flask(__name__)

DB_PATH = os.path.join(os.path.dirname(__file__), "projeler.db")

# Izin verilen proje tipleri ve durumlari (frontend'deki secim kutulariyla eslesir)
PROJE_TIPLERI = ["yol", "icme_suyu", "kanalizasyon", "atiksu", "cbs_fotogrametri"]
PROJE_DURUMLARI = ["planlama", "devam_ediyor", "tamamlandi"]

# Ekranda gosterilecek okunur etiketler (veritabanindaki ham deger degismez)
TIP_ETIKETLERI = {
    "yol": "Yol",
    "icme_suyu": "İçme Suyu",
    "kanalizasyon": "Kanalizasyon",
    "atiksu": "Atıksu",
    "cbs_fotogrametri": "CBS / Fotogrametri",
}
DURUM_ETIKETLERI = {
    "planlama": "Planlama",
    "devam_ediyor": "Devam Ediyor",
    "tamamlandi": "Tamamlandı",
}


# Veritabani yardimcilari

def get_db():
    """Her istek icin tek bir sqlite3 baglantisi acar (Flask'in 'g' objesi ile)."""
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(exception=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """Veritabani ve tablo yoksa olusturur, ornek veri ekler."""
    is_new = not os.path.exists(DB_PATH)
    db = sqlite3.connect(DB_PATH)
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS projeler (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ad TEXT NOT NULL,
            tip TEXT NOT NULL,
            durum TEXT NOT NULL DEFAULT 'planlama',
            enlem REAL NOT NULL,
            boylam REAL NOT NULL,
            aciklama TEXT,
            ilce TEXT,
            olusturma_tarihi TEXT NOT NULL
        )
        """
    )
    db.commit()

    if is_new:
        seed_ornek_veri(db)

    db.close()


def seed_ornek_veri(db):
    """Ilk kurulumda gorulecek bos ekran olmasin diye birkac ornek proje ekler."""
    ornekler = [
        ("Merkez Mahalle Yol Yenileme", "yol", "devam_ediyor", 51.1079, 17.0385,
         "Asfalt yenileme ve kaldirim duzenlemesi", "Sroda Slaska"),
        ("Kuzey Hatti Icme Suyu Sebekesi", "icme_suyu", "planlama", 51.1500, 17.0000,
         "Yeni icme suyu hatti dosemesi", "Wroclaw"),
        ("Guney Bolgesi Kanalizasyon", "kanalizasyon", "tamamlandi", 51.0800, 17.0700,
         "Kanalizasyon hatti yenileme ve baglanti calismasi", "Wroclaw"),
        ("Sanayi Bolgesi Atiksu Aritma", "atiksu", "devam_ediyor", 51.0950, 16.9800,
         "Atiksu toplama hatti ve pompa istasyonu", "Wroclaw"),
        ("Drone ile Arazi Modelleme", "cbs_fotogrametri", "devam_ediyor", 51.1200, 17.0500,
         "Fotogrametrik ucus ve 3B arazi modeli cikarma", "Wroclaw"),
    ]
    for ad, tip, durum, enlem, boylam, aciklama, ilce in ornekler:
        db.execute(
            """INSERT INTO projeler (ad, tip, durum, enlem, boylam, aciklama, ilce, olusturma_tarihi)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (ad, tip, durum, enlem, boylam, aciklama, ilce, datetime.utcnow().isoformat()),
        )
    db.commit()


def row_to_dict(row):
    return {
        "id": row["id"],
        "ad": row["ad"],
        "tip": row["tip"],
        "durum": row["durum"],
        "enlem": row["enlem"],
        "boylam": row["boylam"],
        "aciklama": row["aciklama"],
        "ilce": row["ilce"],
        "olusturma_tarihi": row["olusturma_tarihi"],
    }


# Sayfa route'u

@app.route("/")
def index():
    return render_template(
        "index.html",
        tipler=PROJE_TIPLERI,
        durumlar=PROJE_DURUMLARI,
        tip_etiketleri=TIP_ETIKETLERI,
        durum_etiketleri=DURUM_ETIKETLERI,
    )


# API: Projeler (CRUD)

@app.route("/api/projeler", methods=["GET"])
def api_projeler_listele():
    """Opsiyonel tip / durum / arama filtreleriyle proje listesini dondurur."""
    tip = request.args.get("tip")
    durum = request.args.get("durum")
    arama = request.args.get("q")

    sorgu = "SELECT * FROM projeler WHERE 1=1"
    parametreler = []

    if tip and tip in PROJE_TIPLERI:
        sorgu += " AND tip = ?"
        parametreler.append(tip)

    if durum and durum in PROJE_DURUMLARI:
        sorgu += " AND durum = ?"
        parametreler.append(durum)

    if arama:
        sorgu += " AND (ad LIKE ? OR ilce LIKE ?)"
        like_ifadesi = f"%{arama}%"
        parametreler.extend([like_ifadesi, like_ifadesi])

    sorgu += " ORDER BY olusturma_tarihi DESC"

    db = get_db()
    satirlar = db.execute(sorgu, parametreler).fetchall()
    return jsonify([row_to_dict(r) for r in satirlar])


@app.route("/api/projeler/<int:proje_id>", methods=["GET"])
def api_proje_getir(proje_id):
    db = get_db()
    satir = db.execute("SELECT * FROM projeler WHERE id = ?", (proje_id,)).fetchone()
    if satir is None:
        return jsonify({"hata": "Proje bulunamadi"}), 404
    return jsonify(row_to_dict(satir))


@app.route("/api/projeler", methods=["POST"])
def api_proje_ekle():
    veri = request.get_json(force=True) or {}

    zorunlu_alanlar = ["ad", "tip", "enlem", "boylam"]
    eksikler = [alan for alan in zorunlu_alanlar if not veri.get(alan) and veri.get(alan) != 0]
    if eksikler:
        return jsonify({"hata": f"Eksik alanlar: {', '.join(eksikler)}"}), 400

    if veri["tip"] not in PROJE_TIPLERI:
        return jsonify({"hata": "Gecersiz proje tipi"}), 400

    durum = veri.get("durum", "planlama")
    if durum not in PROJE_DURUMLARI:
        return jsonify({"hata": "Gecersiz durum"}), 400

    db = get_db()
    imlec = db.execute(
        """INSERT INTO projeler (ad, tip, durum, enlem, boylam, aciklama, ilce, olusturma_tarihi)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            veri["ad"],
            veri["tip"],
            durum,
            float(veri["enlem"]),
            float(veri["boylam"]),
            veri.get("aciklama", ""),
            veri.get("ilce", ""),
            datetime.utcnow().isoformat(),
        ),
    )
    db.commit()

    yeni_satir = db.execute("SELECT * FROM projeler WHERE id = ?", (imlec.lastrowid,)).fetchone()
    return jsonify(row_to_dict(yeni_satir)), 201


@app.route("/api/projeler/<int:proje_id>", methods=["PUT"])
def api_proje_guncelle(proje_id):
    db = get_db()
    mevcut = db.execute("SELECT * FROM projeler WHERE id = ?", (proje_id,)).fetchone()
    if mevcut is None:
        return jsonify({"hata": "Proje bulunamadi"}), 404

    veri = request.get_json(force=True) or {}

    yeni_tip = veri.get("tip", mevcut["tip"])
    yeni_durum = veri.get("durum", mevcut["durum"])
    if yeni_tip not in PROJE_TIPLERI or yeni_durum not in PROJE_DURUMLARI:
        return jsonify({"hata": "Gecersiz tip veya durum"}), 400

    db.execute(
        """UPDATE projeler
           SET ad = ?, tip = ?, durum = ?, enlem = ?, boylam = ?, aciklama = ?, ilce = ?
           WHERE id = ?""",
        (
            veri.get("ad", mevcut["ad"]),
            yeni_tip,
            yeni_durum,
            float(veri.get("enlem", mevcut["enlem"])),
            float(veri.get("boylam", mevcut["boylam"])),
            veri.get("aciklama", mevcut["aciklama"]),
            veri.get("ilce", mevcut["ilce"]),
            proje_id,
        ),
    )
    db.commit()

    guncel_satir = db.execute("SELECT * FROM projeler WHERE id = ?", (proje_id,)).fetchone()
    return jsonify(row_to_dict(guncel_satir))


@app.route("/api/projeler/<int:proje_id>", methods=["DELETE"])
def api_proje_sil(proje_id):
    db = get_db()
    mevcut = db.execute("SELECT id FROM projeler WHERE id = ?", (proje_id,)).fetchone()
    if mevcut is None:
        return jsonify({"hata": "Proje bulunamadi"}), 404

    db.execute("DELETE FROM projeler WHERE id = ?", (proje_id,))
    db.commit()
    return jsonify({"basari": True})


# API: Istatistikler (SQL GROUP BY kullanimina ornek)

@app.route("/api/istatistikler", methods=["GET"])
def api_istatistikler():
    db = get_db()

    tip_dagilimi = db.execute(
        "SELECT tip, COUNT(*) AS adet FROM projeler GROUP BY tip ORDER BY adet DESC"
    ).fetchall()

    durum_dagilimi = db.execute(
        "SELECT durum, COUNT(*) AS adet FROM projeler GROUP BY durum ORDER BY adet DESC"
    ).fetchall()

    toplam = db.execute("SELECT COUNT(*) AS adet FROM projeler").fetchone()["adet"]

    return jsonify(
        {
            "toplam_proje": toplam,
            "tip_dagilimi": [{"tip": r["tip"], "adet": r["adet"]} for r in tip_dagilimi],
            "durum_dagilimi": [{"durum": r["durum"], "adet": r["adet"]} for r in durum_dagilimi],
        }
    )


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
