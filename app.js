import * as pdfjsLib from "./vendor/pdf.min.mjs";

const PDF_URL = "assets/paediatric-protocols-5th-edition.pdf";

const sections = [
  { id: 1, title: "General Paediatrics", chapters: [1, 2] },
  { id: 2, title: "Developmental Paediatrics", chapters: [3, 4, 5, 6] },
  { id: 3, title: "Adolescent Paediatrics", chapters: [7] },
  { id: 4, title: "Palliative Care", chapters: [8] },
  { id: 5, title: "Intensive Care", chapters: [9, 10, 11, 12] },
  { id: 6, title: "Neonatology", chapters: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30] },
  { id: 7, title: "Respiratory", chapters: [31, 32, 33, 34, 35, 36, 37] },
  { id: 8, title: "Cardiology", chapters: [38, 39, 40, 41, 42, 43, 44, 45] },
  { id: 9, title: "Neurology", chapters: [46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57] },
  { id: 10, title: "Endocrinology", chapters: [58, 59, 60, 61, 62, 63] },
  { id: 11, title: "Nephrology", chapters: [64, 65, 66, 67, 68, 69, 70, 71, 72, 73] },
  { id: 12, title: "Haematology Oncology", chapters: [74, 75, 76, 77, 78, 79] },
  { id: 13, title: "Gastroenterology", chapters: [80, 81, 82, 83, 84, 85, 86] },
  { id: 14, title: "Infectious Disease", chapters: [87, 88, 89, 90, 91, 92, 93, 94] },
  { id: 15, title: "Dermatology", chapters: [95, 96, 97, 98, 99] },
  { id: 16, title: "Genetic and Metabolic", chapters: [100, 101, 102] },
  { id: 17, title: "Paediatric Surgery", chapters: [103, 104, 105, 106, 107, 108, 109, 110] },
  { id: 18, title: "Rheumatology", chapters: [111, 112] },
  { id: 19, title: "Poison and Toxins", chapters: [113, 114] },
  { id: 20, title: "Child Psychiatry", chapters: [115] },
  { id: 21, title: "Paediatric Emergency", chapters: [116, 117, 118] },
  { id: 22, title: "Practical Procedures", chapters: [119] },
];

const chapters = [
  [1, "Normal Values in Children", 18, 2],
  [2, "Childhood Immunisations", 25, 9],
  [3, "Developmental Milestones in Normal Children", 46, 30],
  [4, "Global Developmental Delay", 52, 36],
  [5, "Communication Disorders and Sensory Impairment", 54, 38],
  [6, "Specific Learning Disorder", 58, 42],
  [7, "The H.E.A.D.S.S. Assessment", 64, 48],
  [8, "End of Life Care in Children", 68, 52],
  [9, "Paediatric Fluid and Electrolyte Guidelines", 76, 60],
  [10, "Acute Gastroenteritis", 88, 72],
  [11, "Sepsis and Septic Shock", 96, 80],
  [12, "Hypotension in Children", 101, 85],
  [13, "Principles of Transport of the Sick Newborn", 104, 88],
  [14, "General Pointers of Care for Infants in NICU", 110, 94],
  [15, "The Preterm Infant", 116, 100],
  [16, "Enteral Feeding in Preterm and High-risk Infants", 121, 105],
  [17, "Parenteral Nutrition for Newborns", 125, 109],
  [18, "Neonatal Hypoglycemia", 128, 112],
  [19, "Neonatal Sepsis", 134, 118],
  [20, "Neonatal Encephalopathy and Hypothermia Therapy", 138, 122],
  [21, "Neonatal Jaundice", 146, 130],
  [22, "Exchange Transfusion", 156, 140],
  [23, "Vascular Spasm and Thrombosis", 159, 143],
  [24, "Patent Ductus Arteriosus in the Preterm", 166, 150],
  [25, "Persistent Pulmonary Hypertension of the Newborn", 170, 154],
  [26, "Ophthalmia Neonatorum", 173, 157],
  [27, "Perinatally Acquired Varicella and Postnatal exposure to Varicella infection", 175, 159],
  [28, "Management of Perinatal Hepatitis B Virus (HBV) transmission (Exposed Infants)", 177, 161],
  [29, "Bronchopulmonary Dysplasia", 180, 164],
  [30, "Non-invasive Ventilation in Preterm Infants", 183, 167],
  [31, "Asthma", 186, 170],
  [32, "Acute Bronchiolitis", 204, 188],
  [33, "Viral Croup", 208, 192],
  [34, "Pneumonia", 211, 195],
  [35, "Empyema Thoracis in Children", 218, 202],
  [36, "Sleep Disordered Breathing", 223, 207],
  [37, "Chronic Wet Cough and Bronchiectasis", 230, 214],
  [38, "Paediatric Electrocardiography (ECG)", 240, 224],
  [39, "Critical Congenital Heart Disease", 245, 229],
  [40, "Hypercyanotic Spell", 248, 232],
  [41, "Heart Failure", 249, 233],
  [42, "Rheumatic Heart Disease", 253, 237],
  [43, "Infective Endocarditis", 256, 240],
  [44, "Kawasaki Disease", 263, 247],
  [45, "Paediatric Arrhythmias", 267, 251],
  [46, "Neonatal Seizures", 274, 258],
  [47, "Status Epilepticus: Management of Convulsive Status Eilepticus", 280, 264],
  [48, "Epilepsy", 291, 275],
  [49, "Febrile Seizures", 294, 278],
  [50, "Meningitis", 296, 280],
  [51, "Autoimmune Encephalitis (AE)", 300, 284],
  [52, "Status Dystonicus(SD)", 303, 287],
  [53, "Acquired Demyelinating Syndromes (ADS)", 307, 291],
  [54, "Acute Flaccid Paralysis", 309, 293],
  [55, "Approach to the Child with Altered Consciousness", 313, 297],
  [56, "Childhood Stroke", 316, 300],
  [57, "Infection-Triggered Encephalopathy Syndromes", 320, 304],
  [58, "Approach to Short Stature", 324, 308],
  [59, "Congenital Hypothyroidism", 328, 312],
  [60, "Diabetes Mellitus", 335, 319],
  [61, "Diabetic Ketoacidosis and Hyperglycemic Hyperosmolar State", 345, 329],
  [62, "Disorders of Sexual Development", 353, 337],
  [63, "Congenital Adrenal Hyperplasia (CAH)", 359, 343],
  [64, "Acute Glomerulonephritis", 364, 348],
  [65, "Nephrotic Syndrome", 370, 354],
  [66, "Acute Kidney Injury (AKI)", 379, 363],
  [67, "Acute Dialysis", 383, 367],
  [68, "Neurogenic Bladder", 390, 374],
  [69, "Urinary Tract Infection and Vesicoureteric Reflux", 396, 380],
  [70, "Perinatal Urinary Tract Dilatation", 402, 386],
  [71, "Hypertension (HTN) in Children", 407, 391],
  [72, "Chronic Kidney Disease (CKD) in Children", 413, 397],
  [73, "Congenital anomalies kidney and urinary tract (CAKUT)", 418, 402],
  [74, "Approach to a Child with Anaemia", 422, 406],
  [75, "Thalassaemia", 428, 412],
  [76, "Immune Thrombocytopaenia", 435, 419],
  [77, "Haemophilia", 438, 422],
  [78, "Oncology Emergencies", 443, 427],
  [79, "Acute Lymphoblastic Leukaemia", 449, 433],
  [80, "Approach to Severely Malnourished Children", 454, 438],
  [81, "Gastro-Oesophageal Reflux Disease (GORD)", 459, 443],
  [82, "Chronic Diarrhoea", 463, 447],
  [83, "Functional Constipation (FC) in Children", 471, 455],
  [84, "Prolonged Jaundice and Neonatal Cholestasis", 479, 463],
  [85, "Evaluation and Management of Children with Liver Disease", 491, 475],
  [86, "Approach to Gastrointestinal Bleeding", 510, 494],
  [87, "Paediatric HIV", 514, 498],
  [88, "Malaria", 525, 509],
  [89, "Tuberculosis", 530, 514],
  [90, "BCG Lymphadenitis", 537, 521],
  [91, "Dengue Viral Infections", 540, 524],
  [92, "Diphtheria", 554, 538],
  [93, "Congenital Syphilis", 557, 541],
  [94, "Paediatric COVID-19", 559, 543],
  [95, "Atopic Dermatitis", 566, 550],
  [96, "Common Cutaneous Infections", 571, 555],
  [97, "Infantile Haemangiomas (IH)", 577, 561],
  [98, "Scabies", 580, 564],
  [99, "Stevens-Johnson Syndrome", 584, 568],
  [100, "Diagnosis and Management of Inborn Errors of Metabolism", 588, 572],
  [101, "Common Genetic Syndromes in Paediatrics", 620, 604],
  [102, "Investigating Children Suspected of Having a Condition with Genetic Basis", 641, 625],
  [103, "Appendicitis", 648, 632],
  [104, "Vomiting in the Neonate and Child", 651, 635],
  [105, "Intussusception", 657, 641],
  [106, "Inguinal Hernias and Hydrocoele", 660, 644],
  [107, "Undescended Testis", 662, 646],
  [108, "The Acute Scrotum", 663, 647],
  [109, "Penile Conditions", 667, 651],
  [110, "Neonatal Surgery", 669, 653],
  [111, "Juvenile Idiopathic Arthritis (JIA)", 682, 666],
  [112, "Systemic Lupus Erythematosus", 689, 673],
  [113, "Snake Related Injuries & Envenomation", 700, 684],
  [114, "Common Poisons", 709, 693],
  [115, "Children & Young People's Mental Health", 746, 730],
  [116, "Anaphylaxis", 752, 736],
  [117, "Recognition and Assessment of Pain", 756, 740],
  [118, "Sedation and Analgesia for Diagnostic and Therapeutic Procedures", 757, 741],
  [119, "Practical Procedures", 762, 746],
].map(([number, title, pdfPage, printedPage]) => ({ number, title, pdfPage, printedPage }));

const chapterByNumber = new Map(chapters.map((chapter) => [chapter.number, chapter]));
const relatedFiles = [
  { chapter: 10, title: "AGE checklist", href: "assets/related/ch10-age-checklist.pdf" },
  { chapter: 11, title: "Sepsis flow", href: "assets/related/ch11-sepsis-flow.pdf" },
  { chapter: 11, title: "PEWS", href: "assets/related/ch11-pews.pdf" },
  { chapter: 11, title: "PEWS+ charts", href: "assets/related/ch11-pews-plus-charts.pdf" },
  { chapter: 21, title: "NNJ flow", href: "assets/related/ch21-nnj-flow.pdf" },
  { chapter: 21, title: "NNJ checklist", href: "assets/related/ch21-nnj-checklist.pdf" },
  { chapter: 30, title: "NIV form", href: "assets/related/ch30-respiratory-support-niv-form.pdf" },
  { chapter: 31, title: "Asthma order set", href: "assets/related/ch31-asthma-order-set.pdf" },
  { chapter: 47, title: "Seizure order set", href: "assets/related/ch47-paediatric-seizure-order-set.pdf" },
  { chapter: 47, title: "Ca/Mg seizure tool", href: "assets/related/ch47-ca-mg-seizure-decision-tool.pdf" },
  { chapter: 48, title: "Seizure Ix policy", href: "assets/related/ch48-seizure-investigation-policy.pdf" },
  { chapter: 48, title: "Seizure poster", href: "assets/related/ch48-seizure-education-poster.png" },
  { chapter: 55, title: "Mild TBI pathway", href: "assets/related/ch55-mild-tbi-pathway.pdf" },
  { chapter: 55, title: "VP shunt pathway", href: "assets/related/ch55-vp-shunt-pathway.pdf" },
  { chapter: 61, title: "DKA calculator", href: "assets/related/ch61-dka-calculator.pdf" },
  { chapter: 94, title: "COVID screening", href: "assets/related/ch94-covid-pre-admission-screening.pdf" },
  { chapter: 94, title: "COVID annex", href: "assets/related/ch94-covid-management-annex.pdf" },
  { chapter: 106, title: "Inguinal hernia", href: "assets/related/ch106-inguinal-hernia-pathway.pdf" },
  { chapter: 114, title: "Toxicology pathway", href: "assets/related/ch114-toxicology-management-pathway.pdf" },
  { chapter: 117, title: "Skala kesakitan", href: "assets/related/ch117-skala-kesakitan.pdf" },
  { chapter: 117, title: "Analgesic ladder", href: "assets/related/ch117-acute-pain-analgesic-ladder.pdf" },
  { chapter: 117, title: "Pain ruler", href: "assets/related/ch117-pain-scale-ruler-template.pdf" },
  { chapter: 117, title: "5th vital sign", href: "assets/related/ch117-pain-as-5th-vital-sign.pdf" },
  { chapter: 118, title: "PSA PED", href: "assets/related/ch118-psa-ped.pdf" },
  { chapter: 118, title: "PSA HTA memo", href: "assets/related/ch118-psa-hta-memo.pdf" },
  { chapter: 119, title: "Foreign body", href: "assets/related/ch119-foreign-body-inhalation-pathway.pdf" },
  { chapter: 119, title: "Button battery", href: "assets/related/ch119-button-battery-pathway.pdf" },
  { chapter: 119, title: "Coin ingestion", href: "assets/related/ch119-coin-ingestion-pathway.pdf" },
  { chapter: 119, title: "Burn pathway", href: "assets/related/ch119-burn-pathway.pdf" },
];
const relatedFilesByChapter = new Map();
relatedFiles.forEach((file) => {
  const chapterFiles = relatedFilesByChapter.get(file.chapter) || [];
  chapterFiles.push(file);
  relatedFilesByChapter.set(file.chapter, chapterFiles);
});
const sectionByChapter = new Map();
sections.forEach((section) => {
  section.chapters.forEach((chapterNumber) => sectionByChapter.set(chapterNumber, section));
});

const state = {
  filter: "contents",
  query: "",
  selected: chapters[0],
  visiblePage: chapters[0].pdfPage,
  bookmarks: readStoredNumbers("paeds-bookmarks"),
  recent: readStoredNumbers("paeds-recent"),
};

const els = {
  sectionList: document.querySelector("#sectionList"),
  searchInput: document.querySelector("#searchInput"),
  statusLine: document.querySelector("#statusLine"),
  tabs: document.querySelectorAll(".quick-tab"),
  viewerPane: document.querySelector(".viewer-pane"),
  backButton: document.querySelector("#backButton"),
  bookmarkButton: document.querySelector("#bookmarkButton"),
  chapterCard: document.querySelector("#chapterCard"),
  chapterMeta: document.querySelector("#chapterMeta"),
  chapterTitle: document.querySelector("#chapterTitle"),
  chapterPageMeta: document.querySelector("#chapterPageMeta"),
  relatedFiles: document.querySelector("#relatedFiles"),
  openPdfLink: document.querySelector("#openPdfLink"),
  previousChapter: document.querySelector("#previousChapter"),
  nextChapter: document.querySelector("#nextChapter"),
  pageBack: document.querySelector("#pageBack"),
  pageForward: document.querySelector("#pageForward"),
  pageLabel: document.querySelector("#pageLabel"),
  canvas: document.querySelector("#pdfCanvas"),
  canvasWrap: document.querySelector("#canvasWrap"),
  loadingPanel: document.querySelector("#loadingPanel"),
  installButton: document.querySelector("#installButton"),
  resourceViewer: document.querySelector("#resourceViewer"),
  resourceBackdrop: document.querySelector("#resourceBackdrop"),
  resourceClose: document.querySelector("#resourceClose"),
  resourceOpen: document.querySelector("#resourceOpen"),
  resourceTitle: document.querySelector("#resourceTitle"),
  resourcePdf: document.querySelector("#resourcePdf"),
  resourceCanvasWrap: document.querySelector("#resourceCanvasWrap"),
  resourceCanvas: document.querySelector("#resourceCanvas"),
  resourceLoading: document.querySelector("#resourceLoading"),
  resourcePrevious: document.querySelector("#resourcePrevious"),
  resourceNext: document.querySelector("#resourceNext"),
  resourcePageLabel: document.querySelector("#resourcePageLabel"),
  resourceImage: document.querySelector("#resourceImage"),
};

let pdfDocument;
let renderTask;
let resourceDocument;
let resourceRenderTask;
let resourcePage = 1;
let resourceCloseTimer;
let deferredInstallPrompt;
let upwardRevealDistance = 0;
let lastCanvasScrollTop = 0;
let lastTouchY = 0;

const UPWARD_REVEAL_THRESHOLD = 140;

pdfjsLib.GlobalWorkerOptions.workerSrc = "./vendor/pdf.worker.min.mjs";

boot();

function boot() {
  renderMenu();
  bindEvents();
  selectChapter(state.selected.number, { openViewer: false });
  registerServiceWorker();
  window.addEventListener("resize", debounce(() => renderPdfPage(state.visiblePage), 180));
}

function bindEvents() {
  els.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderMenu();
  });

  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.filter = tab.dataset.filter;
      els.tabs.forEach((item) => item.classList.toggle("is-active", item === tab));
      renderMenu();
    });
  });

  els.backButton.addEventListener("click", () => {
    els.viewerPane.classList.remove("is-open", "controls-hidden");
  });
  els.bookmarkButton.addEventListener("click", toggleBookmark);
  els.previousChapter.addEventListener("click", () => stepChapter(-1));
  els.nextChapter.addEventListener("click", () => stepChapter(1));
  els.pageBack.addEventListener("click", () => showPdfPage(state.visiblePage - 1));
  els.pageForward.addEventListener("click", () => showPdfPage(state.visiblePage + 1));

  els.canvasWrap.addEventListener("pointerdown", hideViewerControls, { passive: true });
  els.canvasWrap.addEventListener("wheel", handlePdfWheel, { passive: true });
  els.canvasWrap.addEventListener("scroll", handlePdfScroll, { passive: true });
  els.canvasWrap.addEventListener("touchstart", handlePdfTouchStart, { passive: true });
  els.canvasWrap.addEventListener("touchmove", handlePdfTouchMove, { passive: true });
  els.resourceClose.addEventListener("click", closeRelatedFile);
  els.resourceBackdrop.addEventListener("click", closeRelatedFile);
  els.resourcePrevious.addEventListener("click", () => showRelatedPage(resourcePage - 1));
  els.resourceNext.addEventListener("click", () => showRelatedPage(resourcePage + 1));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.resourceViewer.hidden) closeRelatedFile();
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    els.installButton.hidden = false;
  });

  els.installButton.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    els.installButton.hidden = true;
  });
}

function renderMenu() {
  const filtered = getFilteredChapters();
  const filteredNumbers = new Set(filtered.map((chapter) => chapter.number));

  els.statusLine.textContent = getStatusText(filtered.length);
  els.sectionList.innerHTML = "";

  if (!filtered.length) {
    els.sectionList.append(emptyState("No matching protocol found."));
    setMotionOrder();
    return;
  }

  if (state.filter !== "contents" || state.query) {
    const group = makeSectionGroup({ title: getFilterTitle(), id: 0 }, filtered, true);
    els.sectionList.append(group);
    setMotionOrder();
    return;
  }

  sections.forEach((section) => {
    const sectionChapters = section.chapters.map((number) => chapterByNumber.get(number)).filter((chapter) => filteredNumbers.has(chapter.number));
    if (sectionChapters.length) els.sectionList.append(makeSectionGroup(section, sectionChapters));
  });
  setMotionOrder();
}

function makeSectionGroup(section, sectionChapters, forceOpen = false) {
  const group = document.createElement("article");
  group.className = "section-group";
  group.style.setProperty("--section-accent", getSectionAccent(section.id));

  const toggle = document.createElement("button");
  toggle.className = "section-toggle";
  toggle.type = "button";
  const relatedCount = sectionChapters.reduce((total, chapter) => total + (relatedFilesByChapter.get(chapter.number)?.length || 0), 0);
  const sectionLabel = section.id ? `Section ${section.id}` : getFilterTitle();
  const firstChapter = sectionChapters[0];
  const previewText = firstChapter ? `Starts with Ch. ${firstChapter.number}: ${firstChapter.title}` : "No protocols";
  toggle.innerHTML = `
    <span class="section-copy">
      <span class="section-kicker">${sectionLabel} - ${sectionChapters.length} protocol${sectionChapters.length === 1 ? "" : "s"}</span>
      <span class="section-title">${section.title}</span>
      <span class="section-meta">${previewText}</span>
    </span>
    ${relatedCount ? `<span class="section-badge">${relatedCount} file${relatedCount === 1 ? "" : "s"}</span>` : ""}
    <svg class="chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
  `;

  const list = document.createElement("div");
  list.className = "chapter-list";
  sectionChapters.forEach((chapter) => list.append(makeChapterRow(chapter)));

  const shouldOpen = forceOpen || sectionChapters.some((chapter) => chapter.number === state.selected?.number);
  setSectionOpen(group, toggle, shouldOpen);
  toggle.addEventListener("click", () => {
    setSectionOpen(group, toggle, !group.classList.contains("is-open"));
  });

  group.append(toggle, list);
  return group;
}

function makeChapterRow(chapter) {
  const row = document.createElement("button");
  row.className = "chapter-row";
  row.type = "button";
  row.classList.toggle("is-selected", chapter.number === state.selected?.number);
  row.innerHTML = `
    <span class="chapter-number">${chapter.number}</span>
    <span>
      <span class="chapter-name">${chapter.title}</span>
      <span class="chapter-page">PDF page ${chapter.pdfPage} - protocol page ${chapter.printedPage}</span>
    </span>
    <svg class="chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
  `;
  row.addEventListener("click", () => selectChapter(chapter.number));
  return row;
}

function setSectionOpen(group, toggle, isOpen) {
  group.classList.toggle("is-open", isOpen);
  toggle.setAttribute("aria-expanded", String(isOpen));
}

function getSectionAccent(sectionId) {
  const accents = ["#00b8c4", "#2f90a8", "#7d5ba6", "#17877b", "#8b6f47", "#007d88"];
  return accents[Math.abs(sectionId || 0) % accents.length];
}

function getFilteredChapters() {
  let list = chapters;
  if (state.filter === "bookmarks") {
    list = state.bookmarks.map((number) => chapterByNumber.get(number)).filter(Boolean);
  }
  if (state.filter === "recent") {
    list = state.recent.map((number) => chapterByNumber.get(number)).filter(Boolean);
  }
  if (!state.query) return list;

  return list.filter((chapter) => {
    const section = sectionByChapter.get(chapter.number);
    const haystack = `${chapter.number} ${chapter.title} ${section?.title ?? ""}`.toLowerCase();
    return haystack.includes(state.query);
  });
}

function selectChapter(number, options = { openViewer: true }) {
  const chapter = chapterByNumber.get(number);
  if (!chapter) return;

  state.selected = chapter;
  state.visiblePage = chapter.pdfPage;
  rememberRecent(number);
  updateChapterPanel();
  renderMenu();
  showPdfPage(chapter.pdfPage, { revealCard: true });
  if (options.openViewer) els.viewerPane.classList.add("is-open");
  revealViewerControls();
}

function updateChapterPanel() {
  const chapter = state.selected;
  const section = sectionByChapter.get(chapter.number);
  els.chapterMeta.textContent = `Section ${section.id} - ${section.title}`;
  els.chapterTitle.textContent = `Ch. ${chapter.number}: ${chapter.title}`;
  els.chapterPageMeta.textContent = `PDF ${chapter.pdfPage} - Protocol ${chapter.printedPage}`;
  els.openPdfLink.href = `${PDF_URL}#page=${chapter.pdfPage}`;
  els.bookmarkButton.classList.toggle("is-active", state.bookmarks.includes(chapter.number));
  els.previousChapter.disabled = chapter.number === 1;
  els.nextChapter.disabled = chapter.number === chapters.length;
  renderRelatedFiles(chapter.number);
}

function renderRelatedFiles(chapterNumber) {
  const files = relatedFilesByChapter.get(chapterNumber) || [];
  els.relatedFiles.replaceChildren();

  files.forEach((file) => {
    const button = document.createElement("button");
    button.className = "related-file-link";
    button.type = "button";
    button.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v5h5" /></svg>
      <span>${file.title}</span>
    `;
    button.setAttribute("aria-label", `Open related file: ${file.title}`);
    button.addEventListener("click", () => openRelatedFile(file));
    els.relatedFiles.append(button);
  });
}

function openRelatedFile(file) {
  hideViewerControls();
  els.resourceTitle.textContent = file.title;
  els.resourceOpen.href = file.href;
  window.clearTimeout(resourceCloseTimer);
  els.resourceViewer.hidden = false;
  window.requestAnimationFrame(() => els.resourceViewer.classList.add("is-open"));

  const isImage = /\.(png|jpe?g|webp|gif|svg)$/i.test(file.href);
  els.resourceImage.hidden = !isImage;
  els.resourcePdf.hidden = isImage;
  els.resourceImage.removeAttribute("src");
  clearRelatedPdf();

  if (isImage) {
    els.resourceImage.src = file.href;
    els.resourceImage.alt = file.title;
  } else {
    openRelatedPdf(file.href);
  }
}

function closeRelatedFile() {
  els.resourceViewer.classList.remove("is-open");
  window.clearTimeout(resourceCloseTimer);
  resourceCloseTimer = window.setTimeout(() => {
    els.resourceViewer.hidden = true;
    els.resourceImage.removeAttribute("src");
    clearRelatedPdf();
  }, prefersReducedMotion() ? 1 : 260);
  revealViewerControls();
}

async function openRelatedPdf(href) {
  try {
    els.resourceLoading.hidden = false;
    els.resourcePageLabel.textContent = "Loading...";
    resourceDocument = await pdfjsLib.getDocument(href).promise;
    await showRelatedPage(1);
  } catch (error) {
    console.error(error);
    els.resourceLoading.hidden = false;
    els.resourceLoading.textContent = "Unable to open this related file.";
  }
}

async function showRelatedPage(pageNumber) {
  if (!resourceDocument) return;

  beginPageMotion(els.resourceCanvasWrap);
  resourcePage = Math.min(Math.max(pageNumber, 1), resourceDocument.numPages);
  els.resourcePrevious.disabled = resourcePage <= 1;
  els.resourceNext.disabled = resourcePage >= resourceDocument.numPages;
  els.resourcePageLabel.textContent = `Page ${resourcePage} / ${resourceDocument.numPages}`;
  els.resourceLoading.textContent = "Loading related file...";
  els.resourceLoading.hidden = false;

  try {
    if (resourceRenderTask) resourceRenderTask.cancel();
    const page = await resourceDocument.getPage(resourcePage);
    const baseViewport = page.getViewport({ scale: 1 });
    const width = Math.max(260, els.resourceCanvasWrap.clientWidth - 24);
    const scale = width / baseViewport.width;
    const outputScale = window.devicePixelRatio || 1;
    const viewport = page.getViewport({ scale });
    const context = els.resourceCanvas.getContext("2d");

    els.resourceCanvas.width = Math.floor(viewport.width * outputScale);
    els.resourceCanvas.height = Math.floor(viewport.height * outputScale);
    els.resourceCanvas.style.width = `${Math.floor(viewport.width)}px`;
    els.resourceCanvas.style.height = `${Math.floor(viewport.height)}px`;

    resourceRenderTask = page.render({
      canvasContext: context,
      viewport,
      transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null,
    });
    await resourceRenderTask.promise;
  } catch (error) {
    if (error?.name !== "RenderingCancelledException") {
      console.error(error);
      els.resourceLoading.textContent = "Unable to render this page.";
      return;
    }
  } finally {
    els.resourceLoading.hidden = true;
    els.resourceCanvasWrap.scrollTop = 0;
    endPageMotion(els.resourceCanvasWrap);
  }
}

function clearRelatedPdf() {
  if (resourceRenderTask) resourceRenderTask.cancel();
  resourceRenderTask = null;
  if (resourceDocument) resourceDocument.destroy();
  resourceDocument = null;
  resourcePage = 1;
  els.resourceCanvas.removeAttribute("width");
  els.resourceCanvas.removeAttribute("height");
  els.resourceCanvas.removeAttribute("style");
  els.resourcePrevious.disabled = true;
  els.resourceNext.disabled = true;
  els.resourcePageLabel.textContent = "Page -";
  els.resourceLoading.hidden = true;
  els.resourceLoading.textContent = "Loading related file...";
}

function stepChapter(delta) {
  selectChapter(Math.min(Math.max(state.selected.number + delta, 1), chapters.length));
}

function showPdfPage(pageNumber, options = {}) {
  beginPageMotion(els.canvasWrap);
  state.visiblePage = Math.min(Math.max(pageNumber, 1), 834);
  els.pageBack.disabled = state.visiblePage <= 1;
  els.pageForward.disabled = state.visiblePage >= 834;
  els.pageLabel.textContent = `PDF page ${state.visiblePage} / 834`;
  if (options.revealCard) revealViewerControls();
  else hideViewerControls();
  renderPdfPage(state.visiblePage);
}

function revealViewerControls() {
  els.viewerPane.classList.remove("controls-hidden");
  resetUpwardReveal();
}

function hideViewerControls() {
  if (!els.viewerPane.classList.contains("is-open")) return;
  els.viewerPane.classList.add("controls-hidden");
}

function resetUpwardReveal() {
  upwardRevealDistance = 0;
  lastCanvasScrollTop = els.canvasWrap.scrollTop;
}

function trackUpwardReveal(distance) {
  if (!els.viewerPane.classList.contains("controls-hidden")) return;

  if (distance <= 0) {
    upwardRevealDistance = 0;
    return;
  }

  upwardRevealDistance += distance;
  if (upwardRevealDistance >= UPWARD_REVEAL_THRESHOLD) {
    revealViewerControls();
  }
}

function handlePdfWheel(event) {
  const isHidden = els.viewerPane.classList.contains("controls-hidden");
  if (isHidden) {
    trackUpwardReveal(-event.deltaY);
    return;
  }

  if (event.deltaY > 0) hideViewerControls();
}

function handlePdfScroll() {
  const nextScrollTop = els.canvasWrap.scrollTop;
  const delta = nextScrollTop - lastCanvasScrollTop;
  lastCanvasScrollTop = nextScrollTop;

  if (els.viewerPane.classList.contains("controls-hidden")) {
    trackUpwardReveal(-delta);
    return;
  }

  if (delta > 0) hideViewerControls();
}

function handlePdfTouchStart(event) {
  lastTouchY = event.touches?.[0]?.clientY ?? 0;
  hideViewerControls();
}

function handlePdfTouchMove(event) {
  const nextTouchY = event.touches?.[0]?.clientY ?? lastTouchY;
  const delta = nextTouchY - lastTouchY;
  lastTouchY = nextTouchY;
  trackUpwardReveal(delta);
}

async function renderPdfPage(pageNumber) {
  els.loadingPanel.hidden = false;
  try {
    pdfDocument ||= await pdfjsLib.getDocument(PDF_URL).promise;
    if (renderTask) renderTask.cancel();

    const page = await pdfDocument.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const width = Math.max(260, els.canvasWrap.clientWidth - 20);
    const scale = width / baseViewport.width;
    const outputScale = window.devicePixelRatio || 1;
    const viewport = page.getViewport({ scale });
    const context = els.canvas.getContext("2d");

    els.canvas.width = Math.floor(viewport.width * outputScale);
    els.canvas.height = Math.floor(viewport.height * outputScale);
    els.canvas.style.width = `${Math.floor(viewport.width)}px`;
    els.canvas.style.height = `${Math.floor(viewport.height)}px`;

    renderTask = page.render({
      canvasContext: context,
      viewport,
      transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null,
    });
    await renderTask.promise;
  } catch (error) {
    if (error?.name !== "RenderingCancelledException") {
      console.error(error);
      els.loadingPanel.textContent = "Unable to render this PDF page.";
    }
  } finally {
    els.loadingPanel.hidden = true;
    endPageMotion(els.canvasWrap);
  }
}

function toggleBookmark() {
  const number = state.selected.number;
  state.bookmarks = state.bookmarks.includes(number)
    ? state.bookmarks.filter((item) => item !== number)
    : [number, ...state.bookmarks];
  storeNumbers("paeds-bookmarks", state.bookmarks);
  updateChapterPanel();
  renderMenu();
}

function rememberRecent(number) {
  state.recent = [number, ...state.recent.filter((item) => item !== number)].slice(0, 12);
  storeNumbers("paeds-recent", state.recent);
}

function getStatusText(count) {
  if (state.filter === "bookmarks" && !state.bookmarks.length) return "No bookmarked protocols yet.";
  if (state.filter === "recent" && !state.recent.length) return "Recent protocols appear after you open them.";
  return `${count} protocol${count === 1 ? "" : "s"} shown`;
}

function getFilterTitle() {
  if (state.query) return "Search Results";
  if (state.filter === "bookmarks") return "Bookmarks";
  if (state.filter === "recent") return "Recent";
  return "Contents";
}

function emptyState(message) {
  const node = document.createElement("div");
  node.className = "empty-state";
  node.textContent = message;
  return node;
}

function readStoredNumbers(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]").filter(Number.isFinite);
  } catch {
    return [];
  }
}

function storeNumbers(key, numbers) {
  localStorage.setItem(key, JSON.stringify(numbers));
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}

function setMotionOrder() {
  els.sectionList.querySelectorAll(".section-group, .empty-state").forEach((item, index) => {
    item.style.setProperty("--item-index", Math.min(index, 18));
  });
  els.sectionList.querySelectorAll(".chapter-row").forEach((item, index) => {
    item.style.setProperty("--row-index", Math.min(index, 24));
  });
}

function beginPageMotion(node) {
  node.classList.remove("is-page-turning");
  void node.offsetWidth;
  node.classList.add("is-page-turning");
}

function endPageMotion(node) {
  window.setTimeout(() => node.classList.remove("is-page-turning"), prefersReducedMotion() ? 1 : 120);
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}
