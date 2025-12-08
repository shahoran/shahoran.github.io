let translations = {};
let currentLang = "es";
let hasReloaded = false;
function getDailyCacheKey() {
    const today = new Date();
    return today.toISOString().slice(0, 10); // "2025-12-07"
}
function getDailyURL(path) {
    return `${path}?v=${getDailyCacheKey()}`;
}
let random=getDailyCacheKey();
// Cargar archivo JSON del idioma
function loadLanguage(lang, forceReload = false) {
    if(forceReload){
        random=Math.floor(Math.random() * 10000);
    }
    const url =
        `/lang/${lang}.json?v=${random}`;
    return $.getJSON(url)
        .done(function (data) {
            translations = data;
            currentLang = lang;
            localStorage.setItem("language", lang);
            applyTranslations();
        })
        .fail(function () {
            console.error(`❌ No se pudo cargar el archivo de idioma: ${url}`);
        });
}

function t(key) {
    if(translations[key]){
        return translations[key]
    }else{
        loadLanguage(currentLang, true);
        return translations[key]
    }
}
// Aplicar textos traducidos a los elementos con data-i18n
function applyTranslations() {
    let missing = false;

    $("[data-i18n]").each(function () {
        const key = $(this).data("i18n");

        if (translations[key]) {
            $(this).text(translations[key]);
        } else {
            console.warn(`⚠ No existe la key '${key}' en ${currentLang}.json`);
            missing = true;
        }
    });

    // Si falta una key y NO hemos recargado antes, recargar solo 1 vez
    if (missing && !hasReloaded) {
        hasReloaded = true;
        loadLanguage(currentLang, true);
    }
}
function getBasePath() {
    const path = window.location.pathname;
    const depth = path.split("/").length - 2; // detecta cuántas carpetas hay

    if (depth <= 0) return ""; // estás en la raíz

    return "../".repeat(depth); // sube carpetas según sea necesario
}
$(document).ready(function () {

    const base = getBasePath();

    $("#header").load(base + "header.html", function () {

        // Código de idioma
        const savedLang = localStorage.getItem("language") || "en";
        $("#languageSelector").val(savedLang);

        $(document).on("change", "#languageSelector", function () {
            loadLanguage($(this).val());
        });

        loadLanguage(savedLang);
    });

    $("#footer").load(base + "footer.html");
});