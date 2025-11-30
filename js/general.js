let translations = {};
let currentLang = "es";
let isReloading = false;

// Cargar archivo JSON del idioma
function loadLanguage(lang, forceReload = false) {

    // Evita recarga infinita si no existe el archivo
    if (isReloading && forceReload) return;

    isReloading = forceReload;

    const url =
        `/lang/${lang}.json` +
        (forceReload ? `?reload=${Math.floor(Math.random() * 10000)}` : "");

    return $.getJSON(url)
        .done(function (data) {
            translations = data;
            currentLang = lang;
            localStorage.setItem("language", lang);
            isReloading = false;
            applyTranslations();
        })
        .fail(function () {
            console.error(`❌ No se pudo cargar el archivo de idioma: ${url}`);
        });
}

// Aplicar textos traducidos a los elementos con data-i18n
function applyTranslations() {
    $("[data-i18n]").each(function () {
        const key = $(this).data("i18n");

        if (translations[key]) {
            $(this).text(translations[key]);
        } else {
            console.warn(`⚠ No existe la key '${key}' en ${currentLang}.json`);
            
            // Fuerza recarga UNA sola vez
            if (!isReloading) loadLanguage(currentLang, true);
        }
    });
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
        const savedLang = localStorage.getItem("language") || "es";
        $("#languageSelector").val(savedLang);

        $(document).on("change", "#languageSelector", function () {
            loadLanguage($(this).val());
        });

        loadLanguage(savedLang);
    });

    $("#footer").load(base + "footer.html");
});