
const IMAGES_PATH = '/chaos/img/pjsbanner/';   // ajusta según tu estructura
const DETAIL_PAGE = '/chaos/character.html';    // pagina de detalle que recibirá ?id=ID
const JSON_URL = '/chaos/data/characters.json'; // o '/characters.json' según donde lo pongas

function getDailyCacheKey() {
    const today = new Date();
    return today.toISOString().slice(0, 10); // "2025-12-07"
}
function getDailyURL(path) {
    return `${path}?v=${getDailyCacheKey()}`;
}

$(async function () {

  const PATH_CHARACTERS = getDailyURL("/chaos/data/characters.json");
  const PATH_CLASSES = getDailyURL("/chaos/data/class.json");
  const PATH_ELEMENTS = getDailyURL("/chaos/data/attribute.json");
  const PATH_FACTIONS = getDailyURL("/chaos/data/affiliation.json");

  const IMAGES_PATH = "/chaos/img/pjsbanner/";
  const ICONS_PATH = "/chaos/img/icons/";
  const DETAIL_PAGE = "/chaos/character.html";

  let CHARACTERS = {};
  let CLASSES = {};
  let ELEMENTS = {};
  let FACTIONS = {};

  // Filtros activos (arrays)
  const FILTERS = {
    q: "",
    class: [],
    element: [],
    faction: [],
    rarity: []
  };

  // ------------------ LOAD JSON ---------------------
  function getDailyCacheKey() {
    const today = new Date();
    return today.toISOString().slice(0, 10); // "2025-12-07"
  }
  function getDailyURL(path) {
    return `${path}?v=${getDailyCacheKey()}`;
  }

  async function loadAllJSON() {
    const urlChar = getDailyURL(PATH_CHARACTERS);
    const urlClass = getDailyURL(PATH_CLASSES);
    const urlElem = getDailyURL(PATH_ELEMENTS);
    const urlFactions = getDailyURL(PATH_FACTIONS);

    CHARACTERS = await $.getJSON(urlChar);
    CLASSES = await $.getJSON(urlClass);
    ELEMENTS = await $.getJSON(urlElem);
    FACTIONS = await $.getJSON(urlFactions);
  }

  // ------------------ RENDER FILTERS ---------------------
  function renderCheckboxes(container, data) {
    $(container).empty();
    for (const key in data) {
      $(container).append(`
        <label>
          <input type="checkbox" value="${key}">
          <img src="${ICONS_PATH + data[key].icon}">
          ${data[key].name}
        </label>
      `);
    }
  }

  // ------------------ APPLY FILTERS ---------------------
  function matchesFilters(ch) {

    // Buscador
    if (FILTERS.q) {
      const q = FILTERS.q.toLowerCase();
      const total = ch.name.toLowerCase();
      if (!total.includes(q)) return false;
    }

    // Clases
    if (FILTERS.class.length > 0 && !FILTERS.class.includes(ch.class)) return false;

    // Elementos
    if (FILTERS.element.length > 0 && !FILTERS.element.includes(ch.element)) return false;

    // Facciones
    if (FILTERS.faction.length > 0 && !FILTERS.faction.includes(ch.faction)) return false;

    // Rareza
    if (FILTERS.rarity.length > 0 && !FILTERS.rarity.includes(String(ch.rarity))) return false;

    return true;
  }

  // ------------------ RENDER CARDS ---------------------
  function renderCards() {

    const $container = $("#cards-container").empty();
    const arr = Object.values(CHARACTERS);

    const visibles = arr.filter(matchesFilters);

    if (visibles.length === 0) {
      $("#no-results").removeClass("d-none");
    } else {
      $("#no-results").addClass("d-none");
    }

    visibles.forEach(c => {
      const img = IMAGES_PATH + c.img;

      $container.append(`
  <div class="col-4 col-md-2 col-lg-2">
    <div class="character-card">

      <div class="character-icons">
        <img src="${ICONS_PATH + c.class}.png">
        <img src="${ICONS_PATH + c.element}.png">
      </div>

      <a href="${DETAIL_PAGE}?id=${c.id}">
        <img class="character-img" src="${img}" alt="${c.name}">
      </a>

      <div class="character-info">
        <a class="character-name" href="${DETAIL_PAGE}?id=${c.id}">
          ${c.name}
        </a>

        <span>${c.rarity}★</span>
      </div>
    </div>
  </div>
`);
    });
  }

  // ------------------ EVENT HANDLERS ---------------------
  function setupEvents() {

    // Búsqueda
    $("#search-input").on("input", function () {
      FILTERS.q = $(this).val();
      renderCards();
    });

    // Filtros múltiples generados dinámicamente
    $("#filter-class, #filter-element, #filter-faction").on("change", "input[type=checkbox]", function () {
      const id = $(this).closest(".filter-multiselect").attr("id");

      FILTERS[id.replace("filter-", "")] =
        Array.from($(this).closest(".filter-multiselect").find("input:checked"))
          .map(e => $(e).val());

      renderCards();
    });

    // Rareza
    $("#filter-rarity input").on("change", function () {
      FILTERS.rarity =
        $("#filter-rarity input:checked").map(function () { return this.value }).get();
      renderCards();
    });

    // Limpiar
    $("#clear-filters").on("click", function () {
      FILTERS.q = "";
      FILTERS.class = [];
      FILTERS.element = [];
      FILTERS.faction = [];
      FILTERS.rarity = [];

      $("input[type=checkbox]").prop("checked", false);
      $("#search-input").val("");

      renderCards();
    });
  }

  // ------------------ INIT ---------------------
  await loadAllJSON();

  renderCheckboxes("#filter-class", CLASSES);
  renderCheckboxes("#filter-element", ELEMENTS);
  renderCheckboxes("#filter-faction", FACTIONS);

  setupEvents();
  renderCards();

});