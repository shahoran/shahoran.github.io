let CHARACTERS = {};
let currentChar = null;
let currentCharCode = null;
let epiCounters = {};
let activeRow = null;

/* =========================
   UTILIDADES
========================= */


function slug(text) {
    return text
        .toLowerCase()
        .normalize("NFD")                 // separa acentos
        .replace(/[\u0300-\u036f]/g, "")  // elimina acentos
        .replace(/[^a-z0-9_-]+/g, "")       // elimina TODO excepto letras y números
}
const moveBlock = ($el, dir) => {
    if (dir === "up") $el.prev().before($el);
    else $el.next().after($el);
};

/* =========================
   CARGA BASE
========================= */

(async () => {
    CHARACTERS = await $.getJSON("/chaos/data/characters.json");
    loadNeutralsData();
    loadPartnersData();

})();


let activeCardIndex = null;


function attachImageToCard(blob, index) {
    const $card = $(`.card-name[data-index="${index}"]`).closest(".card");
    const input = $card.find(".card-img")[0];
    const thumb = $card.find(".card-thumb");

    if (!input || !blob) return;

    let cardName = $card.find(".card-name").val().trim() || "___";
    const charPrefix = slug(currentChar?.name || "char");

    const fileName = `${charPrefix}_${slug(cardName)}.png`;
    const file = new File([blob], fileName, { type: blob.type });

    // cargar en input
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;

    // preview carta
    const reader = new FileReader();
    reader.onload = e => {
        const dataUrl = e.target.result;

        thumb.attr("src", dataUrl);
        $card.attr("data-runtime-img", dataUrl);

        // invalida imagen antigua
        $card.attr("data-existing-img", "");

        // 🔥 SYNC epifanías
        syncCardToEpiphanies(index);
    };
    reader.readAsDataURL(blob);

    thumb.next(".card-drop").addClass("border-success");
}
function resolveCardImage(img) {
    if (!img) return "";

    // base64
    if (img.startsWith("data:")) return img;

    // blob url
    if (img.startsWith("blob:")) return img;

    if (img.startsWith("/chaos/img/cards/")) return img;
    // archivo del servidor
    return `/chaos/img/cards/${img}`;
}
function getCardImage(index) {
    const $card = $(`.card-name[data-index="${index}"]`).closest(".card");

    // 1️⃣ imagen nueva cargada (runtime)
    const runtimeImg = $card.attr("data-runtime-img");
    if (runtimeImg) return runtimeImg;

    // 2️⃣ imagen existente del JSON
    const existingImg = $card.attr("data-existing-img");
    if (existingImg) return `/chaos/img/cards/${existingImg}`;

    // 3️⃣ nada
    return "";
}
$(document).on("click", ".card-drop", function () {
    $(this).closest(".card").find(".card-img").click();
});
$(document).on("focus", ".card-name, .card-type, .card-img", function () {
    activeCardIndex = $(this).data("index");
});

$(document).on("paste", function (e) {
    if (!activeCardIndex) return;

    const items = e.originalEvent.clipboardData.items;

    for (const item of items) {
        if (item.type.startsWith("image/")) {
            const blob = item.getAsFile();
            attachImageToCard(blob, activeCardIndex);
            e.preventDefault();
            break;
        }
    }
});
// Load character by code (TAB)
$("#charCode").on("keydown", function (e) {
    if (e.key === "Tab") {
        e.preventDefault();
        cargarpersonaje($(this).val().trim());
    }
});

function resetEditor() {
    currentChar = null;
    currentCharCode = null;
    epiCounters = {};
    activeRow = null;

    $("#cards").empty();
    $("#partner-list").empty();
    $("#epicards").empty();
    $("#char-name").text("");
    $("#epiOutput").text("");
    $("#salida").text("");
    $("#neutral-list").empty();
    $("#removal-list").empty();
    $("#removal-select").empty();
    createCards();
    renderBaseEpiphanyCards();
}
async function cargarpersonaje(personaje) {
    const code = personaje;
    if (!code) return;

    // Siempre limpiar primero
    resetEditor();

    try {
        // 1️⃣ Cargar JSON del personaje
        currentChar = await $.getJSON(`/chaos/data/characters/${code}.json`);
        currentCharCode = code;

        // 2️⃣ Cargar datos de cartas
        loadExistingCards();

        // 3️⃣ Sincronizar cartas → epifanías
        [4, 5, 6, 7, 8].forEach(syncCardToEpiphanies);
        $("#char-name").val(currentChar.name);

        // 4️⃣ Cargar epifanías guardadas
        loadExistingEpiphanies();
        loadExistingNeutrals();
        initRemovalSelect(currentChar.cards);
        loadExistingRemovals();
        loadExistingPartners();
    } catch (e) {
        // ❌ No existe → personaje nuevo
        currentChar = {
            name: "",
            cards: []
        };
        $("#char-name").val("");
        currentCharCode = code;
    }
}

function toTitleCase(text) {
    return text
        .toLowerCase()
        .split(" ")
        .filter(w => w.length)
        .map(w => w[0].toUpperCase() + w.slice(1))
        .join(" ");
}
function createCards() {
    $("#cards").empty();

    for (let i = 1; i <= 8; i++) {
        $("#cards").append(`
      <div class="card p-2 mb-2">
        <strong style="color:white">Card ${i}</strong>

        <input
          class="form-control mt-1 card-name"
          data-index="${i}"
          placeholder="Card name"
          autocomplete="off"
        >

        <input
          class="form-control mt-1 card-type"
          data-index="${i}"
          placeholder="Type (1=Attack 2=Skill 3=Upgrade)"
          autocomplete="off"
        >

        <input
  type="file"
  class="form-control mt-1 card-img d-none"
  data-index="${i}"
  accept="image/png"
>

<div class="card-preview-img mt-1">
  <img class="card-thumb">
  <div class="card-drop text-center small border rounded mt-1">IMG</div>
</div>
      </div>
    `);
    }
    $("#output").text("esperando...")
    // Focus first card automatically
    $(".card-name").first().focus();
}
function loadExistingCards() {
    if (!currentChar || !currentChar.cards) return;

    currentChar.cards.forEach(card => {
        const index = Number(card.id.replace("c", ""));
        if (!index) return;

        // nombre
        $(`.card-name[data-index="${index}"]`).val(card.name);

        // tipo
        const type =
            card.type === "Attack" ? "1" :
                card.type === "Skill" ? "2" :
                    "3";
        $(`.card-type[data-index="${index}"]`).val(type);

        // imagen preview
        if (card.img) {
            const imgPath = `/chaos/img/cards/${card.img}`;
            const $thumb = $(`.card-name[data-index="${index}"]`)
                .closest(".card")
                .find(".card-thumb");

            $thumb.attr("src", imgPath);
            $thumb.on("error", () => $thumb.attr("src", ""));
            const $cardEl = $(`.card-name[data-index="${index}"]`).closest(".card");

            $cardEl.find(".card-thumb").attr("src", imgPath);
            $cardEl.attr("data-existing-img", card.img)
        }
    });
}
/*------------------------------------------------HTML DE EPIFANIAS ------------------------------------------*/


/* =========================
   CREAR LA PARTE DE EPIFANIAS
========================= */
function renderBaseEpiphanyCards() {
    $("#epicards").empty();
    epiCounters = {};

    ["c4", "c5", "c6", "c7", "c8"].forEach(cardId => {
        epiCounters[cardId] = 1;

        $("#epicards").append(`
<div class="epicard border rounded p-2 mb-3" data-card="${cardId}">
  <div class="card-preview">
    <img class="card-epi-img">
    <div class="card-meta">
      <strong class="card-epi-name">---</strong><br>
      <span class="text-secondary">${cardId}</span>
    </div>

    <div class="mt-2 d-flex justify-content-center gap-1">
      <button class="btn btn-xs btn-secondary add-epi">+ Epiphany</button>
    </div>
    
      <div class="mt-2 d-flex justify-content-center gap-1">
        <button class="btn btn-xs btn-dark move-card" data-dir="up">↑</button>
        <button class="btn btn-xs btn-dark move-card" data-dir="down">↓</button>
      </div>
  </div>

  <div class="epi-panel">
    <div class="epi-list"></div>
  </div>
</div>
`);
    });
}

/* =========================
   RENDER CARTA
========================= */

function loadExistingEpiphanies() {
    if (!currentChar || !currentChar.epiphanies) return;

    currentChar.epiphanies.forEach(epiBlock => {
        const cardId = epiBlock.cardId;
        const $card = $(`.epicard[data-card="${cardId}"]`);
        if (!$card.length) return;

        epiCounters[cardId] = 1;

        epiBlock.options.forEach((opt, i) => {
            const idx = epiCounters[cardId]++;

            const diff = opt.img
                ?.replace(/^.*_epi_.*?_/, "")
                ?.replace(".png", "") || "";

            const $row = $(`
<div class="epi-card epi-row" data-idx="${idx}">
  <div class="epi-preview">
    <img class="epi-thumb">
    <div class="epi-drop border rounded">IMG</div>
    <input type="file" class="epi-img d-none" accept="image/png">
  </div>

  <div class="epi-form">
    <input class="form-control epi-diff" placeholder="diff">

    <textarea
        class="form-control epi-note mt-1"
        rows="2"
        placeholder="epiphany note"></textarea>

    <input type="number" class="form-control epi-copies" value="0" min="0">

    <label class="small">
      <input type="checkbox" class="epi-best"> best
    </label>

    <div class="d-flex justify-content-between">
      <button class="btn btn-xs btn-dark move-epi" data-dir="up">←</button>
      <button class="btn btn-xs btn-dark move-epi" data-dir="down">→</button>
      <button class="btn btn-xs btn-danger remove-epi">✕</button>
    </div>
  </div>
</div>
`);

            // valores
            $row.find(".epi-diff").val(diff);
            $row.find(".epi-best").prop("checked", !!opt.best);

            // preview imagen
            if (opt.img) {
                const imgPath = `/chaos/img/epiphanies/${opt.img}`;
                const $img = $row.find(".epi-thumb");

                $img.attr("src", imgPath);
                $img.on("error", () => $img.attr("src", ""));
                $row.find(".epi-drop").addClass("border-success");
            }

            // copias
            const copyBlock = currentChar.copy
                ?.find(c => c.cardId === cardId)
                ?.options
                ?.find(c => c.epiphanyId === opt.id);

            if (copyBlock) {
                $row.find(".epi-copies").val(copyBlock.copies);
                $row.find(".epi-best").prop("checked", copyBlock.best);
            }

            $card.find(".epi-list").append($row);
        });
    });
}

/* =========================
   AÑADIR EPIFANÍA
========================= */
function syncCardToEpiphanies(index) {
    const cardId = "c" + index;
    const $epiCard = $(`.epicard[data-card="${cardId}"]`);
    if (!$epiCard.length) return;

    const name = $(`.card-name[data-index="${index}"]`).val();
    $epiCard.find(".card-epi-name").text(name || "---");

    $epiCard.find(".card-epi-img").attr("src", getCardImage(index));
}
$(document).on("input", ".card-name", function () {
    initRemovalSelect(currentChar.cards);
    syncCardToEpiphanies($(this).data("index"));
});

$(document).on("change", ".card-img", function () {
    syncCardToEpiphanies($(this).data("index"));
});
$(document).on("click", ".add-epi", function () {   
    const $card = $(this).closest(".epicard");
    const cardId = $card.data("card");
    const idx = epiCounters[cardId]++;

    $card.find(".epi-list").append(`
  <div class="epi-card epi-row" data-idx="${idx}">

    <!-- PREVIEW -->
    <div class="epi-preview">
      <img class="epi-thumb">
      <div class="epi-drop border rounded">IMG</div>
      <input type="file" class="epi-img d-none" accept="image/png">
    </div>

    <!-- FORM -->
    <div class="epi-form">
      <input class="form-control epi-diff" placeholder="diff">

        <textarea
            class="form-control epi-note mt-1"
            rows="2"
            placeholder="epiphany note"></textarea>

      <input type="number" class="form-control epi-copies" value="0" min="0">

      <label class="small">
        <input type="checkbox" class="epi-best"> best
      </label>

      <div class="d-flex justify-content-between">
        <button class="btn btn-xs btn-dark move-epi" data-dir="up">←</button>
        <button class="btn btn-xs btn-dark move-epi" data-dir="down">→</button>
        <button class="btn btn-xs btn-danger remove-epi">✕</button>
      </div>
    </div>

  </div>
`);
});

/* =========================
   ORDEN + ELIMINAR
========================= */

$(document).on("click", ".move-card", function () {
    moveBlock($(this).closest(".epicard"), $(this).data("dir"));
});

$(document).on("click", ".move-epi", function () {
    moveBlock($(this).closest(".epi-row"), $(this).data("dir"));
});

$(document).on("click", ".remove-epi", function () {
    $(this).closest(".epi-row").remove();
});

/* =========================
   FOCO + CTRL V
========================= */

$(document).on("focus click", ".epi-row *", function () {
    activeRow = $(this).closest(".epi-row");
});

$(document).on("paste", function (e) {
    if (!activeRow || !currentChar) return;

    const item = [...e.originalEvent.clipboardData.items]
        .find(i => i.type.startsWith("image/"));
    if (!item) return;

    const blob = item.getAsFile();
    const input = activeRow.find(".epi-img")[0];

    const file = new File([blob], "paste.png", { type: blob.type });
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;

    const reader = new FileReader();
    reader.onload = e => activeRow.find(".epi-thumb").attr("src", e.target.result);
    reader.readAsDataURL(blob);

    activeRow.find(".epi-drop").addClass("border-success");
    e.preventDefault();
});


/* =========================
   NEUTRALES
========================= */

let NEUTRALS = {};

async function loadNeutralsData() {
    NEUTRALS = await $.getJSON("/chaos/data/neutrals.json");
    initNeutralSelect();
}
// SELECT PARA AGREGAR NEUTRALES
function initNeutralSelect() {
    const $select = $("#neutral-select");

    Object.entries(NEUTRALS)
        .sort((a, b) => a[1].name.localeCompare(b[1].name))
        .forEach(([id, data]) => {
            $select.append(
                `<option value="${id}">${data.name}</option>`
            );
        });
}

// AL SELECCIONAR, AGREGA LA CARTA NEUTRAL
$(document).on("change", "#neutral-select", function () {
    const id = $(this).val();
    if (!id) return;

    if ($("#neutral-list .neutral-card[data-id='" + id + "']").length) {
        this.value = "";
        return;
    }

    $("#neutral-list").append(
        renderNeutralCard(id, NEUTRALS[id])
    );

    this.value = "";
});
function renderNeutralCard(id, data, best = false) {
    return $(`
<div class="neutral-card border rounded p-2 text-center" data-id="${id}">
  <img src="/chaos/img/neutrals/${data.img}" class="mb-1" style="width:64px">
  <div class="small fw-bold">${data.name}</div>

  <label class="small">
    <input type="checkbox" class="neutral-best" ${best ? "checked" : ""}>
    best
  </label>

  <button class="btn btn-xs btn-danger remove-neutral">✕</button>
</div>
`);
}
$("#add-neutral").on("click", function () {
    const used = $("#neutral-list .neutral-card")
        .map((_, el) => $(el).data("id"))
        .get();

    const available = Object.keys(NEUTRALS)
        .filter(id => !used.includes(id));

    if (!available.length) {
        alert("No more neutral cards available");
        return;
    }

    const id = prompt(
        "Neutral ID:\n" + available.join(", ")
    );

    if (!id || !NEUTRALS[id]) return;

    $("#neutral-list").append(
        renderNeutralCard(id, NEUTRALS[id])
    );
});
$(document).on("click", ".remove-neutral", function () {
    $(this).closest(".neutral-card").remove();
});
function loadExistingNeutrals() {
    if (!currentChar?.neutrals) return;

    currentChar.neutrals.forEach(n => {
        if (!NEUTRALS[n.id]) return;

        $("#neutral-list").append(
            renderNeutralCard(n.id, NEUTRALS[n.id], n.best)
        );
    });
}

/* =========================
   REMOVER CARTAS
========================= */

/* =========================
   INIT REMOVAL SELECT
========================= */
function initRemovalSelect() {
    const $select = $("#removal-select");
    $select
        .empty()
        .append(`<option value="">Add character card...</option>`);

    $(".card-name").each(function () {
        const code = $(this).data("index"); // 1..8
        const name = $(this).val().trim();

        if (!name) return;

        $select.append(
            `<option value="c${code}">(c${code}) ${name}</option>`
        );
    });
}

/* =========================
   RENDER REMOVAL CARD
========================= */
function renderRemovalCard(card, best = false) {
    return $(`
<div class="removal-card border rounded p-2 text-center" data-card-id="${card.id}">
  <img src="${resolveCardImage(card.img)}" style="width:64px" class="mb-1">
  <div class="small fw-bold">${card.name}</div>

  <label class="small">
    <input type="checkbox" class="removal-best" ${best ? "checked" : ""}>
    best
  </label>

  <button class="btn btn-xs btn-danger remove-removal">✕</button>
</div>
`);
}

/* =========================
   ADD REMOVAL FROM SELECT
========================= */
$(document).on("change", "#removal-select", function () {
    const cardId = $(this).val();
    if (!cardId) return;

    if ($(`#removal-list .removal-card[data-card-id="${cardId}"]`).length) {
        this.value = "";
        return;
    }

    const idx = cardId.replace("c", "");

    const name =
        $(`.card-name[data-index="${idx}"]`).val()?.trim() ||
        currentChar?.cards?.find(c => c.id === cardId)?.name ||
        "";

    const card = {
        id: cardId,
        name,
        img: getCardImage(idx)
    };

    $("#removal-list").append(renderRemovalCard(card));

    this.value = "";
});
/* =========================
   REMOVE REMOVAL CARD
========================= */
$(document).on("click", ".remove-removal", function () {
    $(this).closest(".removal-card").remove();
});

/* =========================
   LOAD EXISTING REMOVALS
========================= */
function loadExistingRemovals() {
    if (!currentChar?.removal) return;

    currentChar.removal.forEach(r => {
        const card = currentChar.cards.find(c => c.id === r.cardId);
        if (!card) return;

        $("#removal-list").append(
            renderRemovalCard(card, r.best)
        );
    });
}

/* =========================
   SERIALIZE REMOVALS
========================= */
function collectRemovals() {
    const removal = [];

    $("#removal-list .removal-card").each(function () {
        removal.push({
            cardId: $(this).data("card-id"),
            best: $(this).find(".removal-best").is(":checked")
        });
    });

    return removal;
}







/* =========================
   TODO LO DE PARTNERS
========================= */
let PARTNERS = {};

async function loadPartnersData() {
    PARTNERS = await $.getJSON("/chaos/data/partners.json");
    initPartnerSelect();
}

// SELECT PARA AGREGAR PARTNERS
function initPartnerSelect() {
    const $select = $("#partner-select");

    Object.entries(PARTNERS)
        .sort((a, b) => a[1].name.localeCompare(b[1].name))
        .forEach(([id, data]) => {
            $select.append(
                `<option value="${id}">${data.name}</option>`
            );
        });
}

// AL SELECCIONAR, AGREGA EL PARTNER
$(document).on("change", "#partner-select", function () {
    const id = $(this).val();
    if (!id) return;

    if ($("#partner-list .partner-card[data-id='" + id + "']").length) {
        this.value = "";
        return;
    }

    $("#partner-list").append(
        renderPartnerCard(id, PARTNERS[id])
    );

    this.value = "";
});

function renderPartnerCard(id, data) {
    return $(`
<div class="partner-card border rounded p-2 text-center" data-id="${id}">
  <img src="/chaos/img/partners/${data.img}" class="mb-1" style="width:64px">
  <div class="small fw-bold">${data.name}</div>

  <button class="btn btn-xs btn-danger remove-partner">✕</button>
</div>
`);
}

// BOTÓN EXTRA (opcional) PARA AGREGAR POR ID
$("#add-partner").on("click", function () {
    const used = $("#partner-list .partner-card")
        .map((_, el) => $(el).data("id"))
        .get();

    const available = Object.keys(PARTNERS)
        .filter(id => !used.includes(id));

    if (!available.length) {
        alert("No more partners available");
        return;
    }

    const id = prompt(
        "Partner ID:\n" + available.join(", ")
    );

    if (!id || !PARTNERS[id]) return;

    $("#partner-list").append(
        renderPartnerCard(id, PARTNERS[id])
    );
});

$(document).on("click", ".remove-partner", function () {
    $(this).closest(".partner-card").remove();
});

// CARGAR PARTNERS EXISTENTES DEL PERSONAJE
function loadExistingPartners() {
    if (!currentChar?.partners) return;

    currentChar.partners.forEach(id => {
        if (!PARTNERS[id]) return;

        $("#partner-list").append(
            renderPartnerCard(id, PARTNERS[id])
        );
    });
}
function collectPartners() {
    return $("#partner-list .partner-card")
        .map((_, el) => $(el).data("id"))
        .get();
}


/* =========================
   GENERAR JSON
========================= */
function getCharNameSafe() {
    return (
        $("#char-name").val()?.trim() ||
        currentChar?.name ||
        ""
    );
}
$("#btn-save-character").on("click", function () {

    const charNameRaw = getCharNameSafe();
    if (!charNameRaw) {
        alert("Debes ingresar el nombre del personaje");
        return;
    }

    const charName = toTitleCase(charNameRaw);
    const charSlug = slug(charName);

    const cards = [];
    const epiphanies = [];
    const copy = [];
    const formData = new FormData();

    /* =========================
       🃏 CARTAS
       ========================= */

    $(".card-name").each(function () {
        const index = $(this).data("index");
        const nameRaw = $(this).val().trim();
        if (!nameRaw) return;

        const typeInput = $(`.card-type[data-index="${index}"]`).val();
        const imgInput = $(`.card-img[data-index="${index}"]`)[0];

        const type =
            typeInput == "1" ? "Attack" :
                typeInput == "2" ? "Skill" :
                    "Upgrade";

        const cardName = toTitleCase(nameRaw);
        const cardSlug = slug(nameRaw);

        const imgName = `${charSlug}_${cardSlug}.png`;

        if (imgInput && imgInput.files.length) {
            formData.append(
                "img_card",
                imgInput.files[0],
                imgName
            );
        }

        cards.push({
            id: "c" + index,
            name: cardName,
            img: imgName,
            type,
            basic: index <= 3
        });
    });

    /* =========================
       ✨ EPIFANÍAS
       ========================= */

    $(".epicard").each(function () {
        const cardId = $(this).data("card");
        const card = cards.find(c => c.id === cardId);
        if (!card) return;

        const epiOptions = [];
        const copyOptions = [];
        const hide = cardId === "c8";

        $(this).find(".epi-row").each(function (i) {
            const diffRaw = $(this).find(".epi-diff").val();
            const diff = slug(diffRaw);
            if (!diff) return;

            const best = $(this).find(".epi-best").is(":checked");
            const copiesVal = +$(this).find(".epi-copies").val() || 0;
            const imgInput = $(this).find(".epi-img")[0];

            const epiId = `epi_${slug(card.name)}_${i + 1}`;
            const imgName = `${charSlug}_epi_${slug(card.name)}_${diff}.png`;
            const note = `${charSlug}_epi_${slug(card.name)}_${i + 1}`;

            epiOptions.push({
                id: epiId,
                best,
                img: imgName,
                notes:note
            });

            if (copiesVal > 0) {
                copyOptions.push({
                    epiphanyId: epiId,
                    copies: copiesVal,
                    best
                });
            }

            if (imgInput && imgInput.files.length) {
                formData.append(
                    "img_epi",
                    imgInput.files[0],
                    imgName
                );
            }
        });

        if (epiOptions.length) {
            epiphanies.push({ cardId, hide, options: epiOptions });
        }

        if (copyOptions.length) {
            copy.push({ cardId, options: copyOptions });
        }
    });

    
    const notes = {};

    $(".epicard").each(function () {
        const cardId = $(this).data("card");
        const card = cards.find(c => c.id === cardId);
        if (!card) return;

        $(this).find(".epi-row").each(function (i) {
            const diffRaw = $(this).find(".epi-diff").val();
            const diff = slug(diffRaw);
            if (!diff) return;

            const text = $(this).find(".epi-note").val()?.trim();
            if (!text) return;

            const key = `${charSlug}_epi_${slug(card.name)}_${i + 1}`;
            notes[key] = text;
        });
    });

    $("#traduccion").text(JSON.stringify(notes, null, 4));
    /* =========================
       NEUTRALES
       ========================= */
    const neutrals = [];

    $("#neutral-list .neutral-card").each(function () {
        neutrals.push({
            id: $(this).data("id"),
            best: $(this).find(".neutral-best").is(":checked")
        });
    });

    /* =========================
       REMOVE
       ========================= */
    const removal = collectRemovals();


    /* =========================
       REMOVE
       ========================= */
    const partners = collectPartners();
    
    /* =========================
       📦 JSON FINAL
       ========================= */

    const finalJson = {
        ...(currentChar || {}),
        name: charName,
        cards,
        epiphanies,
        copy,
        neutrals,
        removal,
        partners
    };

    /* =========================
       🚀 ENVÍO
       ========================= */

    formData.append("code", currentCharCode || charSlug);
    formData.append("json", JSON.stringify(finalJson));

    $.ajax({
        url: "/save-character",
        method: "POST",
        data: formData,
        processData: false,
        contentType: false,

        success: res => {
            $("#salida").text("Personaje guardado correctamente ✔");
            console.log("Saved", res);
        },

        error: err => {
            console.error(err);
            $("#salida").text("Error al guardar");
        }
    });
});