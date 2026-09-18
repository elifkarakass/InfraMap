/**
 * InfraMap — Altyapı Proje Haritası
 * ----------------------------------
 * Tam ekran Leaflet haritası üzerine yerleştirilmiş cam efektli (glass)
 * panellerle çalışan tek sayfalık uygulama. Üst menüdeki 4 sekme
 * (Ana Sayfa / Projeler / Analiz / Raporlar) sayfa yenilenmeden,
 * client-side olarak birbirine geçer.
 */

// ---------------------------------------------------------------------------
// Kategori renkleri (APWA yeraltı altyapı işaretleme kuralına yakındır)
// ---------------------------------------------------------------------------
const COLORS = {
    yol: "#ffad32",
    icme_suyu: "#258cff",
    kanalizasyon: "#8c5be8",
    atiksu: "#ef5350",
    cbs_fotogrametri: "#20bd88",
};

// ---------------------------------------------------------------------------
// Çeviriler (EN / TR)
// ---------------------------------------------------------------------------
const I18N = {
    tr: {
        home: "Ana Sayfa", projects: "Projeler", analysis: "Analiz", reports: "Raporlar",
        newProject: "Yeni Proje", overview: "PROJE ÖZETİ", welcome: "Hoş Geldiniz 👋",
        welcomeText: "Altyapı projelerinizi doğrudan harita üzerinde yönetin, analiz edin ve takip edin.",
        total: "Toplam Proje", ongoing: "Devam Eden", planned: "Planlanan", completed: "Tamamlanan",
        portfolio: "PORTFÖY", allProjects: "Tüm Projeler",
        search: "Proje veya ilçe ara...", allTypes: "Tüm tipler", allStatuses: "Tüm durumlar",
        projectTypes: "Proje Tipleri", mapHint: "\u201cYeni Proje\u201dye tıklayın, ardından haritada konum seçin.",
        projectRecord: "PROJE KAYDI", projectName: "Proje adı", projectType: "Proje tipi", status: "Durum",
        district: "İlçe / Bölge", description: "Açıklama", latitude: "Enlem", longitude: "Boylam",
        delete: "Projeyi Sil", cancel: "İptal", save: "Kaydet", newTitle: "Yeni Proje", editTitle: "Projeyi Düzenle",
        empty: "Filtreye uyan proje bulunamadı.", clickMap: "Haritada proje konumuna tıklayın",
        saved: "Proje oluşturuldu", updated: "Proje güncellendi", deleted: "Proje silindi",
        confirm: "Bu projeyi silmek istediğinize emin misiniz?", loadError: "Veriler yüklenemedi",
        saveError: "Kaydetme başarısız", deleteError: "Silme başarısız",
        colName: "Proje", colType: "Tip", colStatus: "Durum", colDistrict: "İlçe",
        byType: "TİPE GÖRE DAĞILIM", byStatus: "DURUMA GÖRE DAĞILIM",
        reportsIntro: "Tüm projelerin tipe ve duruma göre özeti.",
        downloadCsv: "CSV İndir", print: "Yazdır",
    },
    en: {
        home: "Home", projects: "Projects", analysis: "Analysis", reports: "Reports",
        newProject: "New Project", overview: "PROJECT OVERVIEW", welcome: "Welcome 👋",
        welcomeText: "Manage, analyze and track your infrastructure projects directly on the map.",
        total: "Total Projects", ongoing: "Ongoing", planned: "Planned", completed: "Completed",
        portfolio: "PORTFOLIO", allProjects: "All Projects",
        search: "Search project or district...", allTypes: "All types", allStatuses: "All statuses",
        projectTypes: "Project Types", mapHint: "Click \u201cNew Project\u201d, then choose a location on the map.",
        projectRecord: "PROJECT RECORD", projectName: "Project name", projectType: "Project type", status: "Status",
        district: "District / Region", description: "Description", latitude: "Latitude", longitude: "Longitude",
        delete: "Delete Project", cancel: "Cancel", save: "Save", newTitle: "New Project", editTitle: "Edit Project",
        empty: "No projects match your filters.", clickMap: "Click a location on the map",
        saved: "Project saved", updated: "Project updated", deleted: "Project deleted",
        confirm: "Delete this project?", loadError: "Could not load data",
        saveError: "Could not save", deleteError: "Could not delete",
        colName: "Project", colType: "Type", colStatus: "Status", colDistrict: "District",
        byType: "BY TYPE", byStatus: "BY STATUS",
        reportsIntro: "Summary of all projects by type and status.",
        downloadCsv: "Download CSV", print: "Print",
    },
};

Object.assign(I18N.tr, { satellite: 'Uydu', street: 'Harita', terrain: 'Arazi', mapArea: 'Harita görünümü', details: 'Detayları görüntüle →' });
Object.assign(I18N.en, { satellite: 'Satellite', street: 'Map', terrain: 'Terrain', mapArea: 'Map view', details: 'View details →' });
const SYMBOLS = { yol: '↔', icme_suyu: '◈', kanalizasyon: '≋', atiksu: '♧', cbs_fotogrametri: '⌘' };
let baseLayers, activeBase, labelsLayer, initialFit = false;
Object.assign(I18N.en, { navigation: 'Main navigation', fit: 'Show all projects', toggleLegend: 'Toggle project legend', basemap: 'Map basemap', close: 'Close' });
Object.assign(I18N.tr, { navigation: 'Ana menü', fit: 'Tüm projeleri göster', toggleLegend: 'Lejantı aç veya kapat', basemap: 'Harita altlığı', close: 'Kapat' });
const TYPE = {
    tr: { yol: "Yol", icme_suyu: "İçme Suyu", kanalizasyon: "Kanalizasyon", atiksu: "Atıksu", cbs_fotogrametri: "CBS / Fotogrametri" },
    en: { yol: "Road", icme_suyu: "Drinking Water", kanalizasyon: "Sewerage", atiksu: "Wastewater", cbs_fotogrametri: "GIS / Photogrammetry" },
};

const STATUS = {
    tr: { planlama: "Planlama", devam_ediyor: "Devam Ediyor", tamamlandi: "Tamamlandı" },
    en: { planlama: "Planning", devam_ediyor: "Ongoing", tamamlandi: "Completed" },
};

// ---------------------------------------------------------------------------
// Uygulama durumu
// ---------------------------------------------------------------------------
// Versioned preference starts the English-first interface on existing installations too.
let lang = localStorage.getItem("inframap-language-v2") === "tr" ? "tr" : "en";
let currentTab = "home";

let harita, markerKatmani;
let markerlar = {};
let yeniProjeModu = false;

let sonProjelerHome = [];   // Ana Sayfa sekmesindeki (ve haritadaki) proje listesi
let sonProjelerTablo = [];  // Projeler sekmesindeki tablo listesi
let sonIstatistik = null;   // /api/istatistikler cevabı (Analiz + Raporlar için)

let grafikTip, grafikDurum; // Chart.js örnekleri

const t = (key) => I18N[lang][key] || key;

// ---------------------------------------------------------------------------
// Dil değişimi
// ---------------------------------------------------------------------------
function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
    document.querySelectorAll('[data-i18n-title]').forEach(el => el.title = t(el.dataset.i18nTitle));

    document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => (el.placeholder = t(el.dataset.i18nPlaceholder)));
    document.getElementById("lang-toggle").textContent = lang === "tr" ? "EN" : "TR";

    ["filtre-tip", "filtre-tip-2"].forEach((id) => {
        document.querySelectorAll(`#${id} option`).forEach((o) => {
            if (o.value) o.textContent = TYPE[lang][o.value] || o.value;
        });
    });
    ["filtre-durum", "filtre-durum-2"].forEach((id) => {
        document.querySelectorAll(`#${id} option`).forEach((o) => {
            if (o.value) o.textContent = STATUS[lang][o.value] || o.value;
        });
    });
    document.querySelectorAll("#form-tip option").forEach((o) => (o.textContent = TYPE[lang][o.value] || o.value));
    document.querySelectorAll("#form-durum option").forEach((o) => (o.textContent = STATUS[lang][o.value] || o.value));

    lejantiCiz();
    listeyiCiz(sonProjelerHome);
    tabloyuCiz(sonProjelerTablo);
    markerlariCiz(sonProjelerHome);
    if (sonIstatistik) {
        raporuCiz(sonIstatistik);
        if (currentTab === "analysis") grafikleriCiz(sonIstatistik);
    }
}

// ---------------------------------------------------------------------------
// Harita kurulumu
// ---------------------------------------------------------------------------
function haritayiBaslat() {
    harita = L.map("harita", { zoomControl: false }).setView([51.1079, 17.0385], 11);
    L.control.zoom({ position: "bottomright" }).addTo(harita);

    baseLayers = {
        satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles © Esri' }),
        street: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' }),
        terrain: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles © Esri, USGS, NOAA' })
    };
    labelsLayer = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Labels © Esri' });
    activeBase = baseLayers.satellite;
    activeBase.addTo(harita); labelsLayer.addTo(harita);
    L.control.scale({ position: 'bottomright', imperial: false }).addTo(harita);
    harita.on('moveend', () => { const c = harita.getCenter(); document.getElementById('map-coordinates').textContent = c.lat.toFixed(4) + '° / ' + c.lng.toFixed(4) + '°'; });
    harita.fire('moveend');

    markerKatmani = L.layerGroup().addTo(harita);

    harita.on("click", (e) => {
        if (yeniProjeModu) {
            yeniProjeModu = false;
            document.getElementById("harita").style.cursor = "";
            formuAc(null, e.latlng);
        }
    });
}

function markerIkonuOlustur(tip) {
    return L.divIcon({
        className: "custom-marker",
        html: `<div class="marker-pin" style="background:${COLORS[tip] || "#64748b"}"><span>${SYMBOLS[tip] || "•"}</span></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 39],
        popupAnchor: [0, -25],
    });
}

// ---------------------------------------------------------------------------
// Lejant (harita sağ üst)
// ---------------------------------------------------------------------------
function lejantiCiz() {
    const el = document.getElementById("legend-list");
    if (!el) return;
    el.innerHTML = Object.keys(TYPE[lang])
        .map((tip) => `<li><span class="legend-dot" style="background:${COLORS[tip]}"></span>${TYPE[lang][tip]}</li>`)
        .join("");
}

// ---------------------------------------------------------------------------
// API çağrıları
// ---------------------------------------------------------------------------
function filtreDegerleriniOku(sonEk) {
    const tip = document.getElementById(`filtre-tip${sonEk}`).value;
    const durum = document.getElementById(`filtre-durum${sonEk}`).value;
    const q = document.getElementById(`filtre-ara${sonEk}`).value;
    return { tip, durum, q };
}

async function projeleriGetir(sonEk = "") {
    const { tip, durum, q } = filtreDegerleriniOku(sonEk);
    const params = new URLSearchParams();
    if (tip) params.set("tip", tip);
    if (durum) params.set("durum", durum);
    if (q) params.set("q", q);

    const yanit = await fetch(`/api/projeler?${params.toString()}`);
    return await yanit.json();
}

async function istatistikleriGetir() {
    const yanit = await fetch("/api/istatistikler");
    return await yanit.json();
}

async function projeKaydet(proje) {
    const duzenlemeMi = Boolean(proje.id);
    const url = duzenlemeMi ? `/api/projeler/${proje.id}` : "/api/projeler";
    const metod = duzenlemeMi ? "PUT" : "POST";

    const yanit = await fetch(url, {
        method: metod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proje),
    });

    if (!yanit.ok) throw new Error(t("saveError"));
    return await yanit.json();
}

async function projeSil(id) {
    const yanit = await fetch(`/api/projeler/${id}`, { method: "DELETE" });
    if (!yanit.ok) throw new Error(t("deleteError"));
    return await yanit.json();
}

// ---------------------------------------------------------------------------
// Harita üzerindeki marker'lar (her zaman Ana Sayfa filtresini yansıtır)
// ---------------------------------------------------------------------------
function markerlariCiz(projeler) {
    if (!markerKatmani) return;
    markerKatmani.clearLayers();
    markerlar = {};

    projeler.forEach((proje) => {
        const marker = L.marker([proje.enlem, proje.boylam], { icon: markerIkonuOlustur(proje.tip) })
            .bindPopup(popupIcerigiOlustur(proje))
            .addTo(markerKatmani);
        marker.on("dblclick", () => formuAc(proje));
        marker.on("popupopen", () => marker.getPopup().getElement().querySelector(".popup-edit").onclick = () => formuAc(proje));
        markerlar[proje.id] = marker;
    });
}

function popupIcerigiOlustur(proje) {
    return `
        <div class="popup-title">${kacir(proje.ad)}</div>
        <div class="popup-meta">
            <b style="color:${COLORS[proje.tip]}">${kacir(TYPE[lang][proje.tip] || proje.tip)}</b>
            · ${STATUS[lang][proje.durum] || proje.durum}
            ${proje.ilce ? `<br>${kacir(proje.ilce)}` : ""}
            ${proje.aciklama ? `<br>${kacir(proje.aciklama)}` : ""}
        </div><button class="popup-edit text-link">${t("details")}</button>`;
}

// ---------------------------------------------------------------------------
// Ana Sayfa sekmesi: proje listesi
// ---------------------------------------------------------------------------
function listeyiCiz(projeler) {
    sonProjelerHome = projeler || [];
    const el = document.getElementById("proje-listesi");
    if (!el) return;

    document.getElementById("proje-sayisi").textContent = sonProjelerHome.length;

    if (!sonProjelerHome.length) {
        el.innerHTML = `<p style="font-size:11px;color:#91a2ac">${t("empty")}</p>`;
        return;
    }

    el.innerHTML = sonProjelerHome
        .map(
            (p) => `
            <div class="project-item" role="button" tabindex="0" data-id="${p.id}">
                <div class="project-top">
                    <span class="list-pin" style="--pin:${COLORS[p.tip]}">${SYMBOLS[p.tip]}</span>
                    <span class="project-name">${kacir(p.ad)}</span>
                    <span class="status status--${p.durum}">${STATUS[lang][p.durum] || p.durum}</span>
                </div>
                <div class="project-meta">${TYPE[lang][p.tip] || p.tip}${p.ilce ? " · " + kacir(p.ilce) : ""}</div>
            </div>`
        )
        .join("");

    el.querySelectorAll(".project-item").forEach((row) => {
        row.onclick = () => {
            const marker = markerlar[Number(row.dataset.id)];
            if (marker) {
                harita.setView(marker.getLatLng(), 14, { animate: false });
                harita.panBy(window.innerWidth <= 650 ? [0, window.innerHeight * .16] : [-190, 0], { animate: false });
                marker.openPopup();
                document.querySelectorAll(".project-item").forEach(el => el.classList.toggle("selected", el === row));
            }
        };
    });
}

// ---------------------------------------------------------------------------
// Projeler sekmesi: tablo görünümü
// ---------------------------------------------------------------------------
function tabloyuCiz(projeler) {
    sonProjelerTablo = projeler || [];
    const el = document.getElementById("proje-tablosu");
    if (!el) return;

    document.getElementById("proje-sayisi-2").textContent = sonProjelerTablo.length;

    if (!sonProjelerTablo.length) {
        el.innerHTML = `<p style="font-size:11px;color:#91a2ac;padding:10px 6px;">${t("empty")}</p>`;
        return;
    }

    el.innerHTML = sonProjelerTablo
        .map(
            (p) => `
            <div class="table-row" role="button" tabindex="0" data-id="${p.id}">
                <span class="project-name">
                    <span class="pin-dot" style="background:${COLORS[p.tip]}"></span>
                    ${kacir(p.ad)}
                </span>
                <span class="type-text">${kacir(TYPE[lang][p.tip] || p.tip)}</span>
                <span class="status status--${p.durum}">${STATUS[lang][p.durum] || p.durum}</span>
                <span class="district-text">${kacir(p.ilce || "—")}</span>
            </div>`
        )
        .join("");

    el.querySelectorAll(".table-row").forEach((row) => {
        row.onclick = () => {
            const proje = sonProjelerTablo.find((p) => p.id === Number(row.dataset.id));
            if (proje) formuAc(proje);
        };
    });
}

// ---------------------------------------------------------------------------
// Ana Sayfa sekmesi: üst özet sayıları
// ---------------------------------------------------------------------------
function statlariGuncelle(istatistik) {
    document.getElementById("stat-toplam").textContent = istatistik.toplam_proje;
    const durumMap = Object.fromEntries(istatistik.durum_dagilimi.map((r) => [r.durum, r.adet]));
    document.getElementById("stat-devam").textContent = durumMap.devam_ediyor || 0;
    document.getElementById("stat-planlama").textContent = durumMap.planlama || 0;
    document.getElementById("stat-tamamlandi").textContent = durumMap.tamamlandi || 0;
}

// ---------------------------------------------------------------------------
// Analiz sekmesi: Chart.js grafikleri
// ---------------------------------------------------------------------------
function grafikleriCiz(istatistik) {
    const tipCanvas = document.getElementById("grafik-tip");
    const durumCanvas = document.getElementById("grafik-durum");
    if (!tipCanvas || !durumCanvas) return;

    const tipEtiketleri = istatistik.tip_dagilimi.map((r) => TYPE[lang][r.tip] || r.tip);
    const tipAdetleri = istatistik.tip_dagilimi.map((r) => r.adet);
    const tipRenkleri = istatistik.tip_dagilimi.map((r) => COLORS[r.tip] || "#64748b");

    const durumEtiketleri = istatistik.durum_dagilimi.map((r) => STATUS[lang][r.durum] || r.durum);
    const durumAdetleri = istatistik.durum_dagilimi.map((r) => r.adet);

    if (grafikTip) grafikTip.destroy();
    if (grafikDurum) grafikDurum.destroy();

    const eksenStili = { color: "#aab9c2", font: { family: "Inter", size: 10 } };
    const izgaraStili = { color: "rgba(255,255,255,0.08)" };

    grafikTip = new Chart(tipCanvas, {
        type: "bar",
        data: { labels: tipEtiketleri, datasets: [{ data: tipAdetleri, backgroundColor: tipRenkleri, borderRadius: 3, maxBarThickness: 18 }] },
        options: {
            indexAxis: "y",
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, ticks: { precision: 0, ...eksenStili }, grid: izgaraStili },
                y: { ticks: eksenStili, grid: { display: false } },
            },
        },
    });

    grafikDurum = new Chart(durumCanvas, {
        type: "bar",
        data: { labels: durumEtiketleri, datasets: [{ data: durumAdetleri, backgroundColor: "#2492ff", borderRadius: 3, maxBarThickness: 30 }] },
        options: {
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0, ...eksenStili }, grid: izgaraStili },
                x: { ticks: eksenStili, grid: { display: false } },
            },
        },
    });
}

// ---------------------------------------------------------------------------
// Raporlar sekmesi: tip/duruma göre özet + CSV/yazdır
// ---------------------------------------------------------------------------
function raporuCiz(istatistik) {
    const el = document.getElementById("rapor-ozet");
    if (!el) return;

    const tipSatirlari = istatistik.tip_dagilimi
        .map(
            (r) => `
            <div class="report-row">
                <span class="report-row__label">
                    <span class="legend-dot" style="background:${COLORS[r.tip]}"></span>
                    ${TYPE[lang][r.tip] || r.tip}
                </span>
                <span class="report-row__count">${r.adet}</span>
            </div>`
        )
        .join("");

    const durumSatirlari = istatistik.durum_dagilimi
        .map(
            (r) => `
            <div class="report-row">
                <span class="report-row__label">${STATUS[lang][r.durum] || r.durum}</span>
                <span class="report-row__count">${r.adet}</span>
            </div>`
        )
        .join("");

    el.innerHTML = `
        <div>
            <div class="report-group__title">${t("byType")}</div>
            ${tipSatirlari}
        </div>
        <div>
            <div class="report-group__title">${t("byStatus")}</div>
            ${durumSatirlari}
        </div>`;
}

async function csvIndir() {
    // Rapor daima TÜM projeleri kapsar (filtreden bağımsız), bu yüzden
    // dışa aktarmadan önce filtresiz tam listeyi ayrıca çekiyoruz.
    const yanit = await fetch("/api/projeler");
    const projeler = await yanit.json();

    const basliklar = ["id", "ad", "tip", "durum", "ilce", "enlem", "boylam", "aciklama"];
    const satirlar = projeler.map((p) => basliklar.map((k) => csvAlaniKacir(p[k])).join(","));
    const csv = [basliklar.join(","), ...satirlar].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "altyapi-projeleri.csv";
    a.click();
    URL.revokeObjectURL(url);
}

function csvAlaniKacir(deger) {
    const metin = String(deger ?? "");
    return /[",\n]/.test(metin) ? `"${metin.replace(/"/g, '""')}"` : metin;
}

// ---------------------------------------------------------------------------
// Sekme geçişi
// ---------------------------------------------------------------------------
function sekmeyiAc(tab) {
    currentTab = tab;
    document.body.dataset.tab = tab;

    document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.add("hidden"));
    document.getElementById(`tab-${tab}`).classList.remove("hidden");

    document.querySelectorAll("nav a[data-tab]").forEach((link) => {
        link.classList.toggle("active", link.dataset.tab === tab);
    });

    // Harita bağlamı yalnızca Ana Sayfa / Projeler sekmelerinde anlamlı
    const legend = document.getElementById("legend-panel");
    const not_ = document.getElementById("map-note");
    const haritaBaglami = tab === "home" || tab === "projects";
    legend.classList.toggle("hidden", !haritaBaglami);
    not_.classList.toggle("hidden", !haritaBaglami);

    // Chart.js, gizliyken oluşturulan canvas'ı doğru boyutlandıramaz;
    // sekme görünür olduğunda grafikleri yeniden çiz.
    if (tab === "analysis" && sonIstatistik) grafikleriCiz(sonIstatistik);
}

// ---------------------------------------------------------------------------
// Tüm verileri tazele
// ---------------------------------------------------------------------------
async function herseyiYenile() {
    try {
        const [projelerHome, projelerTablo, istatistik] = await Promise.all([
            projeleriGetir(""),
            projeleriGetir("-2"),
            istatistikleriGetir(),
        ]);

        sonIstatistik = istatistik;

        markerlariCiz(projelerHome);
        listeyiCiz(projelerHome);
        tabloyuCiz(projelerTablo);
        statlariGuncelle(istatistik);
        if (!initialFit && projelerHome.length) { fitProjects(); initialFit = true; }
        raporuCiz(istatistik);
        if (currentTab === "analysis") grafikleriCiz(istatistik);
    } catch (err) {
        toastGoster(t("loadError"));
    }
}

// ---------------------------------------------------------------------------
// Form / modal yönetimi
// ---------------------------------------------------------------------------
function formuAc(proje, latlng) {
    document.getElementById("proje-formu").reset();
    document.getElementById("modal-baslik").textContent = proje ? t("editTitle") : t("newTitle");

    if (proje) {
        ["id", "ad", "tip", "durum", "ilce", "aciklama", "enlem", "boylam"].forEach((alan) => {
            document.getElementById(`form-${alan}`).value = proje[alan] ?? "";
        });
        document.getElementById("btn-sil").classList.remove("hidden");
    } else {
        document.getElementById("form-id").value = "";
        const konum = latlng || harita.getCenter();
        document.getElementById("form-enlem").value = konum.lat.toFixed(6);
        document.getElementById("form-boylam").value = konum.lng.toFixed(6);
        document.getElementById("btn-sil").classList.add("hidden");
    }

    document.getElementById("modal-overlay").classList.remove("hidden");
}

function formuKapat() {
    document.getElementById("modal-overlay").classList.add("hidden");
}

function kacir(deger) {
    const div = document.createElement("div");
    div.textContent = deger ?? "";
    return div.innerHTML;
}

function toastGoster(mesaj) {
    const el = document.getElementById("toast");
    el.textContent = mesaj;
    el.classList.remove("hidden");
    setTimeout(() => el.classList.add("hidden"), 2200);
}

// ---------------------------------------------------------------------------
// Olay dinleyicileri
// ---------------------------------------------------------------------------
function fitProjects() {
    const ms = Object.values(markerlar);
    if (!ms.length) return;
    const mobile = window.innerWidth <= 650;
    harita.fitBounds(L.featureGroup(ms).getBounds(), { paddingTopLeft: mobile ? [35, 140] : [420, 100], paddingBottomRight: mobile ? [35, window.innerHeight * .52] : [210, 140], maxZoom: 13 });
}
function olaylariBagla() {
    document.getElementById('all-projects').onclick = () => sekmeyiAc('projects');
    document.getElementById('legend-toggle').onclick = (e) => { const list = document.getElementById('legend-list'); list.classList.toggle('hidden'); e.currentTarget.setAttribute('aria-expanded', !list.classList.contains('hidden')); };
    document.querySelectorAll('[data-layer]').forEach(button => button.onclick = () => {
        harita.removeLayer(activeBase); harita.removeLayer(labelsLayer);
        activeBase = baseLayers[button.dataset.layer]; activeBase.addTo(harita);
        if (button.dataset.layer === 'satellite') labelsLayer.addTo(harita);
        document.querySelectorAll('[data-layer]').forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', b === button); });
    });
    document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.project-item, .table-row')) { e.preventDefault(); e.target.click(); } });
    document.querySelectorAll("nav a[data-tab]").forEach((link) => {
        link.addEventListener("click", () => sekmeyiAc(link.dataset.tab));
    });

    document.getElementById("lang-toggle").onclick = () => {
        lang = lang === "tr" ? "en" : "tr";
        localStorage.setItem("inframap-language-v2", lang);
        applyLang();
    };

    document.getElementById("btn-yeni-proje").onclick = () => {
        yeniProjeModu = true;
        document.getElementById("harita").style.cursor = "crosshair";
        if (currentTab !== "home" && currentTab !== "projects") sekmeyiAc("home");
        toastGoster(t("clickMap"));
    };

    document.getElementById("btn-fit").onclick = () => {
        fitProjects();
    };

    ["btn-iptal", "btn-modal-kapat"].forEach((id) => (document.getElementById(id).onclick = formuKapat));
    document.getElementById("modal-overlay").onclick = (e) => {
        if (e.target.id === "modal-overlay") formuKapat();
    };
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") { formuKapat(); yeniProjeModu = false; document.getElementById("harita").style.cursor = ""; }
    });

    document.getElementById("proje-formu").onsubmit = async (e) => {
        e.preventDefault();
        const proje = {
            id: document.getElementById("form-id").value || null,
            ad: document.getElementById("form-ad").value,
            tip: document.getElementById("form-tip").value,
            durum: document.getElementById("form-durum").value,
            ilce: document.getElementById("form-ilce").value,
            aciklama: document.getElementById("form-aciklama").value,
            enlem: document.getElementById("form-enlem").value,
            boylam: document.getElementById("form-boylam").value,
        };
        try {
            await projeKaydet(proje);
            formuKapat();
            await herseyiYenile();
            toastGoster(proje.id ? t("updated") : t("saved"));
        } catch (err) {
            toastGoster(err.message);
        }
    };

    document.getElementById("btn-sil").onclick = async () => {
        const id = document.getElementById("form-id").value;
        if (!id || !confirm(t("confirm"))) return;
        try {
            await projeSil(id);
            formuKapat();
            await herseyiYenile();
            toastGoster(t("deleted"));
        } catch (err) {
            toastGoster(err.message);
        }
    };

    ["filtre-tip", "filtre-durum"].forEach((id) => (document.getElementById(id).onchange = herseyiYenile));
    ["filtre-tip-2", "filtre-durum-2"].forEach((id) => (document.getElementById(id).onchange = herseyiYenile));

    let aramaZamanlayici;
    ["filtre-ara", "filtre-ara-2"].forEach((id) => {
        document.getElementById(id).oninput = () => {
            clearTimeout(aramaZamanlayici);
            aramaZamanlayici = setTimeout(herseyiYenile, 250);
        };
    });

    document.getElementById("btn-csv").onclick = csvIndir;
    document.getElementById("btn-print").onclick = () => window.print();
}

// ---------------------------------------------------------------------------
// Başlangıç
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    haritayiBaslat();
    olaylariBagla();
    applyLang();
    herseyiYenile();
});
