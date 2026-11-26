/* =====================================================================
   ASSISTANT IA POUR WORD — panneau latéral
   Deux moteurs au choix (bouton ⚙) :
     - LM Studio : modèle local sur votre PC, gratuit, rien ne sort du PC
     - Claude    : API Anthropic, en ligne, payant à l'usage
   Aucune modification de ce fichier n'est nécessaire : tout se règle dans ⚙.
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. ACTIONS RAPIDES  —  (optionnel) personnalisez les boutons ici
   ---------------------------------------------------------------------
   Pour ajouter un bouton : copiez une ligne, changez "label" (le texte
   du bouton) et "consigne" (ce qu'on demande à l'IA).
   mode "texte"       → résultat prêt à remplacer la sélection
   mode "explication" → résultat à lire (proposé en commentaire Word)
--------------------------------------------------------------------- */
const ACTIONS = [
  // --- Actions sur le texte ---
  { label: "Reformuler", mode: "texte",
    consigne: "Reformule ce texte pour le rendre plus clair et plus fluide. Garde le sens, le niveau de détail et le registre." },
  { label: "Corriger", mode: "correction", tons: false,
    consigne: "Corrige l'orthographe, la grammaire, la ponctuation, les accords et la typographie française de ce texte (espaces avant ; : ! ?, majuscules accentuées). Ne change ni le style, ni les mots, ni le contenu : modifie uniquement les fautes. Si le texte ne contient aucune faute, réponds uniquement : Phrase correcte." },
  { label: "Plus concis", mode: "texte",
    consigne: "Rends ce texte plus concis (environ un tiers plus court) sans perdre d'information importante." },
  { label: "Développer", mode: "texte",
    consigne: "Développe ce texte avec des transitions et une rédaction plus complète. N'invente aucun chiffre, aucune norme, aucune référence ni aucun fait absent du texte : si une précision manque, écris [à compléter]." },
  { label: "Résumer", mode: "texte",
    consigne: "Résume ce texte en quelques phrases. Utilise des tirets si une liste est plus lisible." },
  { label: "Expliquer", mode: "explication",
    consigne: "Explique ce texte simplement : de quoi il s'agit, le sens des termes techniques et les points à retenir." },
  { label: "Traduire (EN)", mode: "texte",
    consigne: "Traduis ce texte en anglais professionnel." },

  // --- Styles de document ---
  { label: "Rapport d'étude", mode: "texte", groupe: "style",
    consigne: "Réécris ce texte dans le style d'un rapport d'étude (diagnostic, AVP, PRO) : neutre, impersonnel et argumenté. Présente l'existant, analyse, puis conclut." },
  { label: "Notice explicative", mode: "texte", groupe: "style",
    consigne: "Réécris ce texte dans le style d'une notice explicative : descriptive et concise. Explique ce qui est prévu (dispositions, matériaux, fonctionnement), sans argumenter." },
  { label: "Appel d'offres", mode: "texte", groupe: "style",
    consigne: "Réécris ce texte dans le style d'une réponse à un appel d'offres (mémoire technique) : précis, engagé et vérifiable. Mets en avant la méthodologie, les moyens et les engagements du candidat, avec des formulations comme « Nous proposons… », « Notre équipe assurera… », « Le candidat s'engage à… »." },
  { label: "Mail", mode: "texte", groupe: "style",
    consigne: "Transforme ce texte en e-mail professionnel : courtois, clair et structuré (formule d'appel, objet en une phrase, demande ou information, formule de politesse)." },
  { label: "Compte rendu", mode: "texte", groupe: "style",
    consigne: "Réécris ce texte sous forme de compte rendu : factuel et structuré, avec l'objet, les participants s'ils sont mentionnés, les points abordés, les décisions prises et les actions à mener (qui, quoi, quand). N'invente aucun participant, aucune date ni aucune décision : écris [à compléter] si une information manque." },
  { label: "Présentation", mode: "texte", groupe: "style",
    consigne: "Réécris ce texte dans le style d'une présentation PowerPoint : phrases courtes et percutantes, centrées sur les mots-clés, prêtes à être collées dans une diapositive. Ne crée pas de diapositives complètes : transforme seulement ce texte." },
];

/* ---------------------------------------------------------------------
   TONS À COCHER — s'appliquent à toutes les actions sauf « Corriger »
--------------------------------------------------------------------- */
const TONS = [
  { label: "Formel",       consigne: "registre soutenu, vouvoiement, phrases complètes" },
  { label: "Informel",     consigne: "ton direct et simple, tout en restant professionnel" },
  { label: "Familier",     consigne: "ton oral et détendu" },
  { label: "Informatif",   consigne: "factuel, centré sur l'information utile" },
  { label: "Neutre",       consigne: "aucun jugement ni émotion" },
  { label: "Optimiste",    consigne: "rassurant, met en avant les points positifs et les solutions" },
  { label: "Pessimiste",   consigne: "met en avant les risques, les limites et les points de vigilance" },
  { label: "Prudent",      consigne: "formulations nuancées, réserves explicites (« sous réserve de… », « il conviendra de vérifier… »)" },
  { label: "Persuasif",    consigne: "argumente pour convaincre un maître d'ouvrage ou un jury" },
  { label: "Synthétique",  consigne: "va à l'essentiel, phrases courtes" },
  { label: "Pédagogique",  consigne: "explique simplement, définit les termes techniques" },
];

/* Tons contraires : quand l'un est coché, les autres sont grisés */
const TONS_EXCLUSIFS = [
  ["Formel", "Informel", "Familier"],
  ["Optimiste", "Pessimiste"],
  ["Synthétique", "Pédagogique"],
  ["Neutre", "Optimiste"], ["Neutre", "Pessimiste"], ["Neutre", "Persuasif"],
];
function tonsIncompatibles(label) {
  const out = new Set();
  TONS_EXCLUSIFS.forEach((g) => { if (g.includes(label)) g.forEach((x) => x !== label && out.add(x)); });
  return out;
}

/* Choix uniques (un seul à la fois, cliquer à nouveau pour désélectionner) */
const FORMES = [
  { label: "Puces",        consigne: "présente le résultat sous forme de liste à tirets, une idée par ligne" },
  { label: "Texte rédigé", consigne: "rédige en paragraphes continus, sans liste à puces" },
  { label: "Mixte",        consigne: "combine une courte introduction rédigée, une liste à tirets pour les points clés, puis une phrase de conclusion" },
];
const LONGUEURS = [
  { label: "Plus court", consigne: "nettement plus court que le texte d'origine" },
  { label: "Identique",  consigne: "longueur proche de celle du texte d'origine" },
  { label: "Plus long",  consigne: "plus développé que le texte d'origine, sans inventer de faits" },
];
const DESTINATAIRES = [
  { label: "Maître d'ouvrage",   consigne: "un maître d'ouvrage : clair, orienté décisions, coûts, délais et risques" },
  { label: "Élus",               consigne: "des élus : accessible, orienté enjeux pour le territoire et les usagers, peu de jargon" },
  { label: "Grand public",       consigne: "le grand public : simple, sans jargon, termes techniques expliqués" },
  { label: "Collègue technique", consigne: "un collègue ingénieur : technique, précis, vocabulaire du métier" },
];


/* ---------------------------------------------------------------------
   2. RÉGLAGES PAR DÉFAUT (modifiables ensuite dans ⚙)
--------------------------------------------------------------------- */
const DEFAULTS = {
  provider: "lmstudio",                 // "lmstudio" ou "claude"
  lmsUrl: "http://localhost:1234/v1",   // adresse du serveur LM Studio
  lmsModel: "",                         // vide = modèle chargé dans LM Studio
  rules: "",                            // règles perso, une par ligne
  protectedTerms: "",                   // termes à ne jamais modifier, un par ligne
  apiKey: "",                           // clé API Anthropic (moteur Claude)
  model: "claude-sonnet-5-5",           // modèle Claude
  context: "Je suis ingénieur routier / VRD. Mes documents sont des rapports d'études techniques (AVP, PRO, DCE), des notes et des mémoires techniques.",
  saved: false,
};
const MAX_TOKENS_CLAUDE = 8192;   // longueur maximale d'une réponse Claude
const MAX_SOURCE_CHARS = 200000;  // au-delà, le texte est tronqué
const STORAGE_KEY = "assistant-ia-word.settings";
const OPTIONS_KEY = "assistant-ia-word.options";
const HISTORY_KEY = "assistant-ia-word.historique";
const HISTORY_MAX = 30;
const FAV_KEY = "assistant-ia-word.favoris";
const DOCS_KEY = "assistant-ia-word.documents";
const LIBS = {
  pdf: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js",
  pdfWorker: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js",
  docx: "https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js",
};
const PLACEHOLDER_URL = "https://VOTRE-PSEUDO.github.io/assistant-ia-word";

/* ---------------------------------------------------------------------
   3. ÉTAT
--------------------------------------------------------------------- */
let IN_WORD = false;
let settings = loadSettings();
let history = [];            // conversation envoyée à l'IA
let lastSentSource = null;   // pour ne pas renvoyer le même texte à chaque relance
let controller = null;       // permet d'arrêter une réponse en cours
let autoModelCache = {};     // modèle LM Studio détecté automatiquement
let started = false;
let options = loadOptions();     // { tons: [], forme, longueur, destinataire }
let selectedAction = null;       // action choisie, lancée par le bouton bleu
let frozenSource = null;         // texte figé quand « Suivre la sélection » est désactivé
let browseIndex = -1;            // -1 = conversation en cours ; sinon position dans l'historique
let docs = loadDocs();           // documents de référence

const $ = (id) => document.getElementById(id);
const els = {
  main: $("main"), settings: $("settings"), chat: $("chat"), actions: $("actions"),
  preview: $("selection-preview"), manual: $("manual-text"), wholeDoc: $("whole-doc"),
  prompt: $("prompt"), send: $("btn-send"), banner: $("browser-banner"), toast: $("toast"),
  badge: $("engine-badge"), styles: $("styles"), tons: $("tons"),
  forme: $("opt-forme"), longueur: $("opt-longueur"), destinataire: $("opt-destinataire"),
  optionsSummary: $("options-summary"), selPill: $("sel-pill"), twoVersions: $("two-versions"),
  rules: $("set-rules"), protectedTerms: $("set-protected"),
  historyPanel: $("history-panel"), historyList: $("history-list"),
  docsPanel: $("docs-panel"), docsList: $("docs-list"), docsStatus: $("docs-status"), docsInput: $("docs-input"),
  docsCount: $("docs-count"), useDocs: $("use-docs"), useDocsWrap: $("use-docs-wrap"),
  favList: $("fav-list"), favForm: $("fav-form"), favName: $("fav-name"),
  follow: $("follow-sel"), navBar: $("nav-bar"), navPos: $("nav-pos"), browse: $("browse"),
  provider: $("set-provider"), cfgLms: $("cfg-lmstudio"), cfgClaude: $("cfg-claude"),
  lmsUrl: $("set-lms-url"), lmsModel: $("set-lms-model"), testResult: $("test-result"),
  key: $("set-key"), model: $("set-model"), context: $("set-context"),
};

/* ---------------------------------------------------------------------
   4. DÉMARRAGE
--------------------------------------------------------------------- */
function start(inWord) {
  if (started) return;
  started = true;
  IN_WORD = inWord;

  ACTIONS.forEach((a) => {
    const b = document.createElement("button");
    b.className = "action";
    b.textContent = a.label;
    b.title = a.consigne;
    b.addEventListener("click", () => selectAction(selectedAction === a ? null : a));
    a.button = b;
    (a.groupe === "style" ? els.styles : els.actions).appendChild(b);
  });
  renderOptions();
  $("btn-options-clear").addEventListener("click", () => {
    options = { tons: [], forme: "", longueur: "", destinataire: "" };
    saveOptions(); renderOptions();
  });
  els.selPill.addEventListener("click", () => selectAction(null));
  $("btn-history").addEventListener("click", openHistory);
  $("btn-history-close").addEventListener("click", closePanels);
  $("btn-docs").addEventListener("click", () => { renderDocs(); showPanel(els.docsPanel); });
  $("btn-docs-close").addEventListener("click", closePanels);
  $("btn-docs-clear").addEventListener("click", () => { docs = []; saveDocs(); renderDocs(); });
  els.docsInput.addEventListener("change", () => { addDocuments([...els.docsInput.files]); els.docsInput.value = ""; });
  const drop = $("drop-zone");
  drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
  drop.addEventListener("dragleave", () => drop.classList.remove("over"));
  drop.addEventListener("drop", (e) => { e.preventDefault(); drop.classList.remove("over"); addDocuments([...e.dataTransfer.files]); });
  $("btn-fav-add").addEventListener("click", () => { els.favForm.hidden = false; els.favName.value = ""; els.favName.focus(); });
  $("btn-fav-cancel").addEventListener("click", () => (els.favForm.hidden = true));
  $("btn-fav-ok").addEventListener("click", saveFavorite);
  els.favName.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); saveFavorite(); } });
  $("btn-export").addEventListener("click", exportSettings);
  $("btn-import").addEventListener("click", () => $("import-file").click());
  $("import-file").addEventListener("change", importSettings);
  $("btn-copy-source").addEventListener("click", async () => {
    const t = await safeGetSource();
    if (t) { await copyText(t); toast("Texte de départ copié ✓"); } else toast("Aucun texte à copier.");
  });
  els.follow.addEventListener("change", async () => {
    frozenSource = null;
    if (!els.follow.checked) frozenSource = await readWord();
    refreshPreview();
  });
  $("nav-prev").addEventListener("click", () => navigate(+1));
  $("nav-next").addEventListener("click", () => navigate(-1));
  renderFavorites();
  updateDocsBadge();
  updateNav();
  $("btn-history-clear").addEventListener("click", () => {
    try { localStorage.removeItem(HISTORY_KEY); } catch (_) {}
    renderHistory(); exitBrowse();
  });

  $("btn-settings").addEventListener("click", openSettings);
  $("btn-cancel").addEventListener("click", closeSettings);
  $("btn-save").addEventListener("click", saveSettings);
  $("btn-new").addEventListener("click", newConversation);
  $("btn-test").addEventListener("click", testLMStudio);
  $("btn-manifest").addEventListener("click", downloadManifest);
  els.provider.addEventListener("change", showProviderFields);
  els.send.addEventListener("click", () => (controller ? stopGeneration() : launch()));
  els.prompt.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!controller) launch(); }
  });
  els.wholeDoc.addEventListener("change", refreshPreview);

  if (IN_WORD) {
    Office.context.document.addHandlerAsync(
      Office.EventType.DocumentSelectionChanged,
      debounce(refreshPreview, 300)
    );
    refreshPreview();
  } else {
    // Mode test dans un navigateur classique
    els.banner.hidden = false;
    els.preview.hidden = true;
    els.manual.hidden = false;
    els.wholeDoc.parentElement.hidden = true;
    $("follow-wrap").hidden = true;
    // Bouton "Télécharger le manifeste" quand la page est en ligne (https)
    if (location.protocol === "https:") $("btn-manifest").hidden = false;
  }

  updateBadge();
  if (!settings.saved) openSettings();
}

/* Un seul panneau (paramètres, historique, documents) affiché à la fois */
function showPanel(panel) {
  [els.settings, els.historyPanel, els.docsPanel].forEach((p) => (p.hidden = p !== panel));
  els.main.hidden = true;
}
function closePanels() {
  [els.settings, els.historyPanel, els.docsPanel].forEach((p) => (p.hidden = true));
  els.main.hidden = false;
}

if (typeof Office !== "undefined" && Office.onReady) {
  Office.onReady((info) => start(info.host === Office.HostType.Word));
  setTimeout(() => start(false), 8000); // sécurité si Office ne répond pas
} else {
  start(false);
}

/* ---------------------------------------------------------------------
   5. LECTURE DU DOCUMENT WORD
--------------------------------------------------------------------- */
async function getSourceText() {
  if (!IN_WORD) return els.manual.value.trim();
  if (!els.wholeDoc.checked && !els.follow.checked && frozenSource !== null) return frozenSource;
  return readWord();
}

async function readWord() {
  return Word.run(async (ctx) => {
    const target = els.wholeDoc.checked ? ctx.document.body : ctx.document.getSelection();
    target.load("text");
    await ctx.sync();
    return (target.text || "").trim();
  });
}

async function refreshPreview() {
  if (!IN_WORD) return;
  try {
    const text = await getSourceText();
    if (!text) {
      els.preview.className = "preview empty";
      els.preview.textContent = els.wholeDoc.checked ? "Le document est vide." : "Sélectionnez du texte dans Word…";
      return;
    }
    els.preview.className = "preview";
    els.preview.textContent = els.wholeDoc.checked ? "Tout le document" : text.slice(0, 280) + (text.length > 280 ? "…" : "");
    const c = document.createElement("span");
    c.className = "count";
    const fige = !els.wholeDoc.checked && !els.follow.checked ? " · 🔒 figé" : "";
    c.textContent = countWords(text).toLocaleString("fr-FR") + " mots · " + text.length.toLocaleString("fr-FR") + " caractères" + fige;
    els.preview.appendChild(c);
  } catch (e) {
    console.error(e);
  }
}

/* ---------------------------------------------------------------------
   6. ÉCRITURE DANS LE DOCUMENT WORD
--------------------------------------------------------------------- */
async function wordReplace(text) {
  await Word.run(async (ctx) => {
    ctx.document.getSelection().insertText(text, "Replace");
    await ctx.sync();
  });
}

async function wordInsertAfter(text) {
  await Word.run(async (ctx) => {
    const lastParagraph = ctx.document.getSelection().paragraphs.getLast();
    lastParagraph.insertParagraph(text, "After");
    await ctx.sync();
  });
}

async function wordComment(text) {
  if (!Office.context.requirements.isSetSupported("WordApi", "1.4")) {
    throw new Error("Cette version de Word ne permet pas d'ajouter des commentaires depuis un complément.");
  }
  await Word.run(async (ctx) => {
    ctx.document.getSelection().insertComment(text);
    await ctx.sync();
  });
}

/* ---------------------------------------------------------------------
   7. ACTIONS ET CONVERSATION
--------------------------------------------------------------------- */
// Bouton bleu : lance l'action choisie, ou la consigne libre
async function launch() {
  if (controller) return;
  if (browseIndex >= 0) exitBrowse();
  const extra = els.prompt.value.trim();
  if (selectedAction) {
    const action = selectedAction;
    const ok = await runAction(action, extra);
    if (ok) { els.prompt.value = ""; selectAction(null); }
  } else if (extra) {
    await sendPrompt(extra);
  } else {
    toast("Choisissez une action, ou écrivez une consigne.");
  }
}

function selectAction(action) {
  selectedAction = action;
  ACTIONS.forEach((a) => a.button.classList.toggle("selected", a === action));
  els.selPill.hidden = !action;
  els.selPill.textContent = action ? "Action : " + action.label + "  ✕" : "";
  els.send.classList.toggle("ready", !!action);
}

async function runAction(action, extra) {
  const source = await safeGetSource();
  if (source === null) return false;
  if (!source) {
    toast(IN_WORD ? "Sélectionnez d'abord du texte dans Word." : "Collez d'abord un texte dans « Texte ciblé ».");
    return false;
  }
  newConversation(); // une action démarre une conversation neuve
  lastSentSource = source;
  const avecOptions = action.tons !== false;
  let consigne = action.consigne;
  if (extra) consigne += "\n\nConsigne complémentaire de l'utilisateur : " + extra;
  if (avecOptions) consigne += optionsConsigne();
  const ref = action.mode === "correction" ? null : docsContext(source + " " + (extra || ""));
  const resume = avecOptions ? optionsResume() : "";
  const label = action.label + (resume ? " · " + resume : "") + (extra ? "\n« " + extra + " »" : "") + (ref ? "\n📄 " + ref.label : "");
  await ask((ref ? ref.text : "") + buildMessage(consigne, source), label, source.length, action.mode, source, action.label);
  return true;
}

async function sendPrompt(question) {
  const source = await safeGetSource();
  if (source === null) return;
  // On joint le texte ciblé seulement s'il a changé depuis le dernier envoi
  const attach = source && source !== lastSentSource;
  if (attach) lastSentSource = source;
  els.prompt.value = "";
  const consigne = question + optionsConsigne();
  const ref = docsContext(question + " " + (attach ? source : ""));
  const content = (ref ? ref.text : "") + (attach ? buildMessage(consigne, source) : consigne);
  await ask(content, question + (ref ? "\n📄 " + ref.label : ""), attach ? source.length : 0, "texte", attach ? source : lastSentSource, "Question");
}

function buildMessage(consigne, source) {
  if (source.length > MAX_SOURCE_CHARS) {
    source = source.slice(0, MAX_SOURCE_CHARS);
    toast("Texte très long : seuls les " + MAX_SOURCE_CHARS.toLocaleString("fr-FR") + " premiers caractères sont envoyés.");
  }
  return consigne + "\n\nTexte :\n<<<\n" + source + "\n>>>";
}

async function safeGetSource() {
  try {
    return await getSourceText();
  } catch (e) {
    showError("Impossible de lire le document : " + e.message);
    return null;
  }
}

function newConversation() {
  stopGeneration();
  if (browseIndex >= 0) exitBrowse();
  history = [];
  lastSentSource = null;
  els.chat.innerHTML = "";
}

async function ask(content, displayLabel, attachedChars, mode, source, historyLabel) {
  if (settings.provider === "claude" && !settings.apiKey) {
    openSettings();
    toast("Ajoutez d'abord votre clé API Claude.");
    return;
  }

  addUserBubble(displayLabel, attachedChars);
  history.push({ role: "user", content });
  const versions = els.twoVersions.checked ? 2 : 1;
  const call = settings.provider === "claude" ? callClaude : callLMStudio;
  let firstAnswer = null;
  setBusy(true);

  for (let v = 1; v <= versions; v++) {
    const bubble = addAssistantBubble(versions > 1 ? "Version " + v : "");
    controller = new AbortController();
    let raw = "";
    let stop = false;
    try {
      // La 2e version est générée avec plus de créativité pour être différente
      await call(history, (chunk) => {
        raw += chunk;
        bubble.body.textContent = withoutThinking(raw) || "Réflexion…";
        scrollToBottom();
      }, controller.signal, v === 1 ? 0.4 : 0.9);
      const answer = cleanText(withoutThinking(raw));
      if (!answer) throw new Error("Le modèle n'a renvoyé aucun texte.");
      if (firstAnswer === null) firstAnswer = answer;
      showAnswer(bubble, answer, mode, source);
      saveToHistory(historyLabel || "Résultat", answer, mode, source);
    } catch (e) {
      const partial = cleanText(withoutThinking(raw));
      if (e.name === "AbortError") {
        bubble.body.textContent = partial + (partial ? "\n\n" : "") + "[Réponse interrompue]";
        if (partial) {
          if (firstAnswer === null) firstAnswer = partial;
          addTools(bubble, partial, mode);
        }
      } else {
        bubble.root.remove();
        showError(e.message);
      }
      stop = true;
    } finally {
      bubble.body.classList.remove("streaming");
    }
    if (stop) break;
  }

  if (firstAnswer !== null) history.push({ role: "assistant", content: firstAnswer });
  else history.pop();
  setBusy(false);
  scrollToBottom();
}

function showAnswer(bubble, answer, mode, source) {
  if (mode === "correction" && source) {
    showCorrection(bubble, source, answer);
  } else {
    bubble.body.textContent = answer;
    addTools(bubble, answer, mode);
  }
  checkProtectedTerms(bubble, source, answer);
  if (source && !/^(phrase|texte) correct/i.test(answer)) {
    const wc = document.createElement("div");
    wc.className = "wc";
    wc.textContent = "Mots : " + countWords(source) + " → " + countWords(answer);
    bubble.root.insertBefore(wc, bubble.body.nextSibling);
  }
  updateNav();
}

function countWords(t) {
  return ((t || "").match(/[^\s«»"“”'’.,;:!?()\-–—]+/g) || []).length;
}

// Avertit si un terme protégé présent dans le texte d'origine a disparu
function checkProtectedTerms(bubble, source, answer) {
  if (!source || /^(phrase|texte) correct/i.test(answer)) return;
  const missing = protectedList().filter((t) => source.includes(t) && !answer.includes(t));
  if (!missing.length) return;
  const w = document.createElement("div");
  w.className = "warn";
  w.textContent = "⚠ Terme protégé modifié ou absent : " + missing.join(", ") + ". Vérifiez avant d'insérer.";
  bubble.root.insertBefore(w, bubble.body.nextSibling);
}

function protectedList() {
  return (settings.protectedTerms || "").split(/\n|;/).map((t) => t.trim()).filter(Boolean);
}

/* ---------------------------------------------------------------------
   8. CONSIGNES GÉNÉRALES DONNÉES À L'IA
--------------------------------------------------------------------- */
function systemPrompt() {
  const lines = [
    "Tu es un assistant de rédaction intégré dans Microsoft Word, sous forme de panneau latéral. Tu travailles pour un ingénieur routier et VRD qui rédige des rapports d'études (diagnostic, AVP, PRO, DCE), des notices, des documents de marché (CCTP, mémoires techniques) et des e-mails professionnels.",
    "",
    "Règles de réponse :",
    "- Quand on te demande de transformer un texte (reformuler, corriger, développer, résumer, traduire, changer de style), réponds UNIQUEMENT avec le texte final, prêt à être collé dans le document : pas d'introduction, pas de conclusion, pas de guillemets, pas de commentaire.",
    "- Écris en texte brut, sans Markdown : pas de **, pas de #, pas de tableau. Pour une liste, utilise des tirets « - ».",
    "- Garde la langue du texte d'origine, sauf demande de traduction.",
    "- Conserve la structure (paragraphes, listes) sauf si la consigne demande de la changer.",
    "- Pour une explication ou une question, réponds de façon claire, structurée et concise.",
    "",
    "Fiabilité technique :",
    "- N'invente jamais de chiffres, de dimensions, de normes, de références réglementaires, de noms de lieux ni de faits absents du texte.",
    "- Si une précision manque pour rédiger correctement, écris [à compléter] à l'endroit concerné.",
    "- Conserve exactement les valeurs, unités, références et termes techniques du texte d'origine (ex. bordures T2, GNT 0/31.5, EB 10, PR, RN568).",
    "- Utilise le vocabulaire professionnel du métier : chaussée, structure, couche de roulement, assainissement pluvial, dévoiement de réseaux, maîtrise d'ouvrage, maîtrise d'œuvre.",
  ];
  const rules = (settings.rules || "").split("\n").map((r) => r.trim()).filter(Boolean);
  if (rules.length) lines.push("", "Règles personnelles de l'utilisateur (à respecter toujours) :", ...rules.map((r) => "- " + r));
  const prot = protectedList();
  if (prot.length) lines.push("", "Termes à recopier exactement, sans jamais les modifier, traduire ni reformuler : " + prot.join(" ; "));
  if (settings.context) lines.push("", "Contexte de l'utilisateur : " + settings.context);
  return lines.join("\n");
}

// Consignes ajoutées à la demande selon les réglages du texte
function optionsConsigne() {
  const parts = [];
  if (options.tons.length) {
    const choisis = TONS.filter((t) => options.tons.includes(t.label));
    let txt = "Ton (applique-les tous en même temps, sans contredire les règles de fiabilité) :\n" +
      choisis.map((t) => "- " + t.label + " : " + t.consigne).join("\n");
    parts.push(txt);
  }
  const one = (list, val, titre) => {
    const o = list.find((x) => x.label === val);
    if (o) parts.push(titre + " : " + o.consigne + ".");
  };
  one(FORMES, options.forme, "Forme");
  one(LONGUEURS, options.longueur, "Longueur");
  one(DESTINATAIRES, options.destinataire, "Destinataire : adapte le texte pour");
  return parts.length ? "\n\n" + parts.join("\n\n") : "";
}

function optionsResume() {
  return options.tons.concat([options.forme, options.longueur, options.destinataire].filter(Boolean)).join(", ");
}

/* ---------------------------------------------------------------------
   9. MOTEUR LM STUDIO (serveur local, format OpenAI)
--------------------------------------------------------------------- */
function lmsBase(raw) {
  let u = (raw || settings.lmsUrl || DEFAULTS.lmsUrl).trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(u)) u = "http://" + u;
  if (!/\/v1$/i.test(u)) u += "/v1";
  return u;
}

// Adresse d'un autre PC du réseau (192.168.x.x…) : on le signale au navigateur
function networkOptions(url) {
  try {
    const h = new URL(url).hostname;
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)) return { targetAddressSpace: "local" };
  } catch (_) {}
  return {};
}

function lmsUnreachable(base) {
  return "Impossible de joindre LM Studio à l'adresse " + base + ".\n" +
    "Vérifiez dans LM Studio, onglet Developer :\n" +
    "1. le serveur est démarré (Status : Running) ;\n" +
    "2. l'option « Enable CORS » est activée ;\n" +
    "3. un modèle est chargé.\n" +
    "Si une fenêtre demande l'accès au réseau local, cliquez sur Autoriser.\n" +
    "Dans Word sur le web, cette connexion est bloquée : utilisez Word installé sur le PC.";
}

async function listLMStudioModels(base) {
  let res;
  try {
    res = await fetch(base + "/models", Object.assign({ method: "GET" }, networkOptions(base)));
  } catch (_) {
    throw new Error(lmsUnreachable(base));
  }
  if (!res.ok) throw new Error("LM Studio a répondu par une erreur " + res.status + ".");
  const data = await res.json();
  return (data.data || []).map((m) => m.id).filter((id) => !/embed/i.test(id));
}

async function callLMStudio(messages, onText, signal, temperature) {
  const base = lmsBase();
  let model = settings.lmsModel;
  if (!model) {
    if (!autoModelCache[base]) {
      const models = await listLMStudioModels(base);
      if (!models.length) throw new Error("Aucun modèle trouvé dans LM Studio. Téléchargez et chargez un modèle, puis réessayez.");
      autoModelCache[base] = models[0];
    }
    model = autoModelCache[base];
  }

  let res;
  try {
    res = await fetch(base + "/chat/completions", Object.assign({
      method: "POST",
      signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: systemPrompt() }].concat(messages.slice(-20)),
        temperature: temperature || 0.4,
        stream: true,
      }),
    }, networkOptions(base)));
  } catch (e) {
    if (e.name === "AbortError") throw e;
    throw new Error(lmsUnreachable(base));
  }

  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = typeof j.error === "string" ? j.error : (j.error && j.error.message) || "";
    } catch (_) {}
    if (/context|token/i.test(detail)) {
      throw new Error("Texte trop long pour le modèle. Dans LM Studio, rechargez le modèle avec une « Context Length » plus grande (ex. 16384), ou sélectionnez un passage plus court.\n(" + detail + ")");
    }
    if (/model/i.test(detail) || res.status === 404) {
      autoModelCache = {};
      throw new Error("Modèle introuvable dans LM Studio. Dans ⚙, cliquez « Tester la connexion » puis choisissez un modèle de la liste.\n(" + detail + ")");
    }
    throw new Error("LM Studio a renvoyé une erreur " + res.status + (detail ? " : " + detail : "."));
  }

  await readEventStream(res, (evt) => {
    if (evt.error) throw new Error(typeof evt.error === "string" ? evt.error : evt.error.message || "Erreur LM Studio.");
    const delta = evt.choices && evt.choices[0] && evt.choices[0].delta;
    if (delta && delta.content) onText(delta.content);
  });
}

async function testLMStudio() {
  const box = els.testResult;
  box.hidden = false;
  box.className = "test-result";
  box.textContent = "Connexion en cours…";
  const base = lmsBase(els.lmsUrl.value);
  try {
    const models = await listLMStudioModels(base);
    const current = els.lmsModel.value;
    els.lmsModel.innerHTML = "";
    const auto = new Option("Automatique (modèle chargé dans LM Studio)", "");
    els.lmsModel.add(auto);
    models.forEach((id) => els.lmsModel.add(new Option(id, id)));
    if (current && models.includes(current)) els.lmsModel.value = current;
    autoModelCache = {};
    box.className = "test-result ok";
    box.textContent = models.length
      ? "✓ Connecté à LM Studio. " + models.length + " modèle(s) trouvé(s). Cliquez sur Enregistrer."
      : "✓ Serveur joint, mais aucun modèle n'est disponible. Chargez un modèle dans LM Studio.";
  } catch (e) {
    box.className = "test-result ko";
    box.textContent = "✗ " + e.message;
  }
}

/* ---------------------------------------------------------------------
   10. MOTEUR CLAUDE (API Anthropic)
--------------------------------------------------------------------- */
async function callClaude(messages, onText, signal) { // (la variété vient du modèle)
  let res;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": settings.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: settings.model || DEFAULTS.model,
        max_tokens: MAX_TOKENS_CLAUDE,
        system: systemPrompt(),
        messages: messages.slice(-20),
        stream: true,
      }),
    });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    throw new Error("Connexion impossible à l'API Claude. Vérifiez votre connexion internet (ou le pare-feu de l'entreprise).");
  }

  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json()).error?.message || ""; } catch (_) {}
    const messagesErreur = {
      400: "Requête refusée : " + detail,
      401: "Clé API invalide. Vérifiez-la dans les paramètres (⚙).",
      403: "Accès refusé : " + detail,
      404: "Modèle introuvable. Vérifiez le nom du modèle dans les paramètres (⚙).",
      429: "Trop de demandes ou crédit épuisé. Patientez un instant ou vérifiez votre crédit sur console.anthropic.com.",
      529: "Le service est surchargé. Réessayez dans quelques secondes.",
    };
    throw new Error(messagesErreur[res.status] || "Erreur " + res.status + " : " + detail);
  }

  await readEventStream(res, (evt) => {
    if (evt.type === "content_block_delta" && evt.delta && evt.delta.type === "text_delta") onText(evt.delta.text);
    else if (evt.type === "error") throw new Error(evt.error?.message || "Erreur pendant la réponse.");
  });
}

/* ---------------------------------------------------------------------
   11. LECTURE D'UNE RÉPONSE EN FLUX (commun aux deux moteurs)
--------------------------------------------------------------------- */
async function readEventStream(res, onEvent) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const handle = (line) => {
    if (!line.startsWith("data:")) return;
    const data = line.slice(5).trim();
    if (!data || data === "[DONE]") return;
    let evt;
    try { evt = JSON.parse(data); } catch (_) { return; }
    onEvent(evt);
  };
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();
    lines.forEach((l) => handle(l.replace(/\r$/, "")));
  }
  if (buffer) handle(buffer.replace(/\r$/, ""));
}

function stopGeneration() {
  if (controller) controller.abort();
}

/* ---------------------------------------------------------------------
   12. AFFICHAGE
--------------------------------------------------------------------- */
function addUserBubble(label, attachedChars) {
  const d = document.createElement("div");
  d.className = "msg user";
  d.textContent = label;
  if (attachedChars) {
    const s = document.createElement("span");
    s.className = "attach";
    s.textContent = "📎 " + attachedChars.toLocaleString("fr-FR") + " caractères joints";
    d.appendChild(s);
  }
  els.chat.appendChild(d);
  scrollToBottom();
}

function addAssistantBubble(title) {
  const root = document.createElement("div");
  root.className = "msg assistant";
  if (title) {
    const t = document.createElement("div");
    t.className = "version-title";
    t.textContent = title;
    root.appendChild(t);
  }
  const body = document.createElement("div");
  body.className = "body streaming";
  root.appendChild(body);
  els.chat.appendChild(root);
  scrollToBottom();
  return { root, body };
}

function addTools(bubble, text, mode) {
  const bar = document.createElement("div");
  bar.className = "msg-tools";
  const add = (label, fn, main) => {
    const b = document.createElement("button");
    b.className = "tool" + (main ? " main-tool" : "");
    b.textContent = label;
    b.addEventListener("click", async () => {
      try { await fn(); } catch (e) { showError(e.message); }
    });
    bar.appendChild(b);
  };
  if (IN_WORD) {
    if (mode === "explication") {
      add("En commentaire", async () => { await wordComment(text); toast("Commentaire ajouté ✓"); }, true);
      add("Insérer après", async () => { await wordInsertAfter(text); toast("Texte inséré ✓"); });
    } else {
      add("Remplacer la sélection", async () => { await wordReplace(text); toast("Sélection remplacée ✓"); }, true);
      add("Insérer après", async () => { await wordInsertAfter(text); toast("Texte inséré ✓"); });
      add("En commentaire", async () => { await wordComment(text); toast("Commentaire ajouté ✓"); });
    }
  }
  add("Copier", async () => { await copyText(text); toast("Copié ✓"); }, !IN_WORD);
  bubble.root.appendChild(bar);
}

function showError(message) {
  const d = document.createElement("div");
  d.className = "msg error";
  d.textContent = "⚠ " + message;
  els.chat.appendChild(d);
  scrollToBottom();
}

function setBusy(busy) {
  els.send.textContent = busy ? "■" : "➤";
  els.send.title = busy ? "Arrêter" : "Envoyer";
  els.send.classList.toggle("stop", busy);
  document.querySelectorAll(".action, .chip, .nav-btn").forEach((b) => (b.disabled = busy));
  if (!busy) { controller = null; renderOptions(); renderFavorites(); updateNav(); }
}

function updateBadge() {
  els.badge.textContent = settings.provider === "claude" ? "Claude" : "LM Studio";
}

function scrollToBottom() {
  els.main.scrollTop = els.main.scrollHeight;
}

let toastTimer;
function toast(msg) {
  els.toast.textContent = msg;
  els.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (els.toast.hidden = true), 2600);
}

/* ---------------------------------------------------------------------
   13. PARAMÈTRES (enregistrés sur cet ordinateur uniquement)
--------------------------------------------------------------------- */
function loadSettings() {
  try {
    return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
  } catch (_) {
    return Object.assign({}, DEFAULTS);
  }
}

function showProviderFields() {
  const isClaude = els.provider.value === "claude";
  els.cfgClaude.hidden = !isClaude;
  els.cfgLms.hidden = isClaude;
}

function openSettings() {
  els.provider.value = settings.provider;
  els.lmsUrl.value = settings.lmsUrl;
  if (settings.lmsModel && ![...els.lmsModel.options].some((o) => o.value === settings.lmsModel)) {
    els.lmsModel.add(new Option(settings.lmsModel, settings.lmsModel));
  }
  els.lmsModel.value = settings.lmsModel;
  els.key.value = settings.apiKey;
  els.model.value = settings.model;
  els.context.value = settings.context;
  els.rules.value = settings.rules || "";
  els.protectedTerms.value = settings.protectedTerms || "";
  els.testResult.hidden = true;
  showProviderFields();
  showPanel(els.settings);
}

function closeSettings() {
  closePanels();
}

function saveSettings() {
  settings = {
    provider: els.provider.value,
    lmsUrl: els.lmsUrl.value.trim() || DEFAULTS.lmsUrl,
    lmsModel: els.lmsModel.value,
    apiKey: els.key.value.trim(),
    model: els.model.value.trim() || DEFAULTS.model,
    context: els.context.value.trim(),
    rules: els.rules.value.trim(),
    protectedTerms: els.protectedTerms.value.trim(),
    saved: true,
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (_) {}
  autoModelCache = {};
  updateBadge();
  closeSettings();
  toast("Paramètres enregistrés ✓");
}

/* ---------------------------------------------------------------------
   14. MANIFESTE AUTOMATIQUE
   Depuis la page en ligne (mode test), génère manifest.xml avec la bonne
   adresse : aucune modification manuelle du manifeste n'est nécessaire.
--------------------------------------------------------------------- */
async function downloadManifest() {
  try {
    const here = location.origin + location.pathname.replace(/\/[^/]*$/, "");
    const res = await fetch("manifest.xml", { cache: "no-store" });
    if (!res.ok) throw new Error("manifest.xml introuvable à côté de cette page.");
    const xml = (await res.text()).split(PLACEHOLDER_URL).join(here);
    const url = URL.createObjectURL(new Blob([xml], { type: "application/xml" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "manifest.xml";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast("manifest.xml téléchargé ✓");
  } catch (e) {
    showError("Téléchargement du manifeste impossible : " + e.message);
  }
}

/* ---------------------------------------------------------------------
   TONS : affichage et mémorisation
--------------------------------------------------------------------- */
function loadOptions() {
  const d = { tons: [], forme: "", longueur: "", destinataire: "" };
  try { return sanitizeOptions(Object.assign(d, JSON.parse(localStorage.getItem(OPTIONS_KEY) || "{}"))); } catch (_) { return d; }
}

// Retire les tons contraires (garde le premier coché)
function sanitizeOptions(o) {
  const kept = [];
  (o.tons || []).forEach((t) => {
    if (TONS.some((x) => x.label === t) && !kept.some((k) => tonsIncompatibles(k).has(t))) kept.push(t);
  });
  return { tons: kept, forme: o.forme || "", longueur: o.longueur || "", destinataire: o.destinataire || "" };
}
function saveOptions() {
  try { localStorage.setItem(OPTIONS_KEY, JSON.stringify(options)); } catch (_) {}
}

function chip(label, on, title, onClick, disabled) {
  const b = document.createElement("button");
  b.className = "chip" + (on ? " on" : "");
  b.textContent = (on ? "✓ " : "") + label;
  b.title = title;
  b.disabled = !!disabled;
  b.setAttribute("aria-pressed", on);
  b.addEventListener("click", onClick);
  return b;
}

function renderOptions() {
  // Tons : plusieurs choix
  els.tons.innerHTML = "";
  TONS.forEach((t) => {
    const on = options.tons.includes(t.label);
    const bloquant = options.tons.find((x) => tonsIncompatibles(x).has(t.label));
    const titre = bloquant ? "Incompatible avec « " + bloquant + " »" : t.consigne;
    els.tons.appendChild(chip(t.label, on, titre, () => {
      options.tons = on ? options.tons.filter((x) => x !== t.label) : options.tons.concat(t.label);
      saveOptions(); renderOptions();
    }, !!bloquant || !!controller));
  });
  // Forme, longueur, destinataire : un seul choix
  [["forme", FORMES, els.forme], ["longueur", LONGUEURS, els.longueur], ["destinataire", DESTINATAIRES, els.destinataire]]
    .forEach(([key, list, box]) => {
      box.innerHTML = "";
      list.forEach((o) => {
        const on = options[key] === o.label;
        box.appendChild(chip(o.label, on, o.consigne, () => {
          options[key] = on ? "" : o.label;
          saveOptions(); renderOptions();
        }, !!controller));
      });
    });
  const r = optionsResume();
  els.optionsSummary.textContent = r ? "· " + r : "· aucun";
  $("btn-options-clear").hidden = !r;
}

/* ---------------------------------------------------------------------
   HISTORIQUE des résultats (30 derniers, sur cet ordinateur)
--------------------------------------------------------------------- */
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch (_) { return []; }
}

function saveToHistory(label, answer, mode, source) {
  if (/^(phrase|texte) correct/i.test(answer)) return;
  const list = loadHistory();
  list.unshift({ date: new Date().toISOString(), label, answer, mode, source: (source || "").slice(0, 6000) });
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, HISTORY_MAX))); } catch (_) {}
}

function openHistory() {
  renderHistory();
  showPanel(els.historyPanel);
}

function renderHistory() {
  const list = loadHistory();
  els.historyList.innerHTML = "";
  if (!list.length) {
    els.historyList.innerHTML = '<p class="hint">Aucun résultat pour l\'instant.</p>';
    return;
  }
  list.forEach((h) => {
    const item = document.createElement("div");
    item.className = "hist-item";
    const head = document.createElement("div");
    head.className = "hist-head";
    const d = new Date(h.date);
    head.textContent = h.label + " — " + d.toLocaleDateString("fr-FR") + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const body = document.createElement("div");
    body.className = "hist-body";
    body.textContent = h.answer;
    item.append(head, body);
    item.addEventListener("click", () => {
      if (item.classList.contains("open")) return;
      item.classList.add("open");
      const bubble = { root: item, body };
      addTools(bubble, h.answer, h.mode === "explication" ? "explication" : "texte");
    });
    els.historyList.appendChild(item);
  });
}

/* ---------------------------------------------------------------------
   NAVIGATION ← → : texte de départ et résultat, toujours ensemble
--------------------------------------------------------------------- */
function updateNav() {
  const list = loadHistory();
  els.navBar.hidden = !list.length;
  if (browseIndex >= list.length) browseIndex = list.length - 1;
  $("nav-prev").disabled = !!controller || browseIndex >= list.length - 1;
  $("nav-next").disabled = !!controller || browseIndex < 0;
  els.navPos.textContent = browseIndex < 0
    ? "Résultats précédents (" + list.length + ")"
    : "Résultat " + (list.length - browseIndex) + " / " + list.length;
}

// +1 = plus ancien, -1 = plus récent
function navigate(step) {
  const list = loadHistory();
  const next = browseIndex + step;
  if (next < 0) return exitBrowse();
  if (next >= list.length) return;
  browseIndex = next;
  showBrowse(list[browseIndex]);
  updateNav();
}

function exitBrowse() {
  browseIndex = -1;
  els.browse.hidden = true;
  els.chat.hidden = false;
  updateNav();
}

function showBrowse(h) {
  els.chat.hidden = true;
  els.browse.hidden = false;
  els.browse.innerHTML = "";
  const d = new Date(h.date);
  const head = document.createElement("div");
  head.className = "hist-head";
  head.textContent = h.label + " — " + d.toLocaleDateString("fr-FR") + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const src = document.createElement("div");
  src.className = "msg source-view";
  const st = document.createElement("div");
  st.className = "version-title";
  st.textContent = "Texte de départ";
  const sb = document.createElement("div");
  sb.className = "body";
  sb.textContent = h.source || "(non enregistré)";
  const sbar = document.createElement("div");
  sbar.className = "msg-tools";
  const cp = document.createElement("button");
  cp.className = "tool";
  cp.textContent = "Copier";
  cp.addEventListener("click", async () => { await copyText(h.source || ""); toast("Texte de départ copié ✓"); });
  sbar.appendChild(cp);
  src.append(st, sb, sbar);

  const res = document.createElement("div");
  res.className = "msg assistant";
  const rt = document.createElement("div");
  rt.className = "version-title";
  rt.textContent = "Résultat";
  const rb = document.createElement("div");
  rb.className = "body";
  rb.textContent = h.answer;
  res.append(rt, rb);
  if (h.source) {
    const wc = document.createElement("div");
    wc.className = "wc";
    wc.textContent = "Mots : " + countWords(h.source) + " → " + countWords(h.answer);
    res.appendChild(wc);
  }
  addTools({ root: res, body: rb }, h.answer, h.mode === "explication" ? "explication" : "texte");
  els.browse.append(head, src, res);
}

/* ---------------------------------------------------------------------
   FAVORIS : sauvegarde de l'action + des réglages du texte
--------------------------------------------------------------------- */
function loadFavorites() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch (_) { return []; }
}
function storeFavorites(list) {
  try { localStorage.setItem(FAV_KEY, JSON.stringify(list)); } catch (_) {}
}

function saveFavorite() {
  const name = els.favName.value.trim();
  if (!name) { toast("Donnez un nom au favori."); return; }
  const list = loadFavorites().filter((f) => f.name !== name);
  list.push({ name, action: selectedAction ? selectedAction.label : "", options: JSON.parse(JSON.stringify(options)) });
  storeFavorites(list);
  els.favForm.hidden = true;
  renderFavorites();
  toast("Favori « " + name + " » enregistré ✓");
}

function applyFavorite(f) {
  options = sanitizeOptions(f.options || {});
  saveOptions();
  renderOptions();
  selectAction(ACTIONS.find((a) => a.label === f.action) || null);
  toast("Favori « " + f.name + " » activé — appuyez sur ➤");
}

function renderFavorites() {
  const list = loadFavorites();
  els.favList.innerHTML = "";
  if (!list.length) {
    els.favList.innerHTML = '<span class="muted">Aucun favori. Choisissez une action et des réglages, puis « Enregistrer ».</span>';
    return;
  }
  list.forEach((f) => {
    const wrap = document.createElement("span");
    wrap.className = "fav";
    const details = [f.action].concat(sanitizeOptions(f.options || {}).tons, [(f.options || {}).forme, (f.options || {}).longueur, (f.options || {}).destinataire]).filter(Boolean).join(", ");
    const b = chip("★ " + f.name, false, details || "Réglages vides", () => applyFavorite(f), !!controller);
    const del = document.createElement("button");
    del.className = "fav-del";
    del.textContent = "✕";
    del.title = "Supprimer ce favori";
    del.addEventListener("click", () => { storeFavorites(loadFavorites().filter((x) => x.name !== f.name)); renderFavorites(); });
    wrap.append(b, del);
    els.favList.appendChild(wrap);
  });
}

/* ---------------------------------------------------------------------
   EXPORT / IMPORT des réglages (sans la clé API)
--------------------------------------------------------------------- */
async function exportSettings() {
  const data = {
    app: "assistant-ia-word", version: 1,
    settings: Object.assign({}, settings, { apiKey: "" }),
    options, favoris: loadFavorites(),
  };
  const json = JSON.stringify(data, null, 2);
  try {
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url; a.download = "assistant-ia-reglages.json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch (_) {}
  await copyText(json);
  toast("Réglages exportés (fichier téléchargé et copié) ✓");
}

async function importSettings(e) {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== "assistant-ia-word") throw new Error("ce fichier ne vient pas de l'Assistant IA");
    const keepKey = settings.apiKey;
    settings = Object.assign({}, DEFAULTS, data.settings || {}, { apiKey: keepKey, saved: true });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (_) {}
    if (data.options) { options = sanitizeOptions(data.options); saveOptions(); }
    if (Array.isArray(data.favoris)) storeFavorites(data.favoris);
    renderOptions(); renderFavorites(); updateBadge(); openSettings();
    toast("Réglages importés ✓");
  } catch (err) {
    toast("Import impossible : " + err.message);
  }
}

/* ---------------------------------------------------------------------
   DOCUMENTS DE RÉFÉRENCE : extraction du texte et recherche des passages
--------------------------------------------------------------------- */
function loadDocs() {
  try { return JSON.parse(localStorage.getItem(DOCS_KEY) || "[]"); } catch (_) { return []; }
}
function saveDocs() {
  try { localStorage.setItem(DOCS_KEY, JSON.stringify(docs)); }
  catch (_) { toast("Documents trop volumineux pour être gardés après fermeture : ils restent disponibles pour cette séance."); }
  updateDocsBadge();
}

function updateDocsBadge() {
  const actifs = docs.filter((d) => d.use).length;
  els.docsCount.hidden = !docs.length;
  els.docsCount.textContent = actifs;
  els.useDocsWrap.hidden = !actifs;
  els.useDocsWrap.lastChild.textContent = " 📄 Documents (" + actifs + ")";
}

function loadScript(url) {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src="' + url + '"]')) return resolve();
    const sc = document.createElement("script");
    sc.src = url;
    sc.onload = resolve;
    sc.onerror = () => reject(new Error("bibliothèque de lecture introuvable (connexion internet ?)"));
    document.head.appendChild(sc);
  });
}

// Découpe un texte en morceaux d'environ 1 200 caractères, sans couper les paragraphes si possible
function chunkText(text, label) {
  const paras = text.split(/\n\s*\n|\n/).map((p) => p.trim()).filter(Boolean);
  const out = [];
  let cur = "";
  const push = () => { if (cur.trim()) out.push({ label, text: cur.trim() }); cur = ""; };
  paras.forEach((p) => {
    if (cur.length + p.length > 1200) push();
    if (p.length > 1600) { for (let i = 0; i < p.length; i += 1200) out.push({ label, text: p.slice(i, i + 1200) }); }
    else cur += p + "\n";
  });
  push();
  return out;
}

async function extractDocument(file) {
  const name = file.name;
  const ext = name.split(".").pop().toLowerCase();
  if (ext === "txt" || ext === "md") {
    return chunkText(await file.text(), "");
  }
  if (ext === "docx") {
    await loadScript(LIBS.docx);
    const r = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    const chunks = chunkText(r.value, "");
    chunks.forEach((c, i) => (c.label = "partie " + (i + 1)));
    return chunks;
  }
  if (ext === "pdf") {
    await loadScript(LIBS.pdf);
    const pdfjs = window.pdfjsLib;
    pdfjs.GlobalWorkerOptions.workerSrc = LIBS.pdfWorker;
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const chunks = [];
    for (let n = 1; n <= pdf.numPages; n++) {
      els.docsStatus.textContent = "Lecture de « " + name + " » : page " + n + " / " + pdf.numPages + "…";
      const page = await pdf.getPage(n);
      const content = await page.getTextContent();
      let txt = "";
      content.items.forEach((it) => { txt += it.str + (it.hasEOL ? "\n" : " "); });
      chunkText(txt, "p. " + n).forEach((c) => chunks.push(c));
    }
    if (chunks.reduce((s, c) => s + c.text.length, 0) < pdf.numPages * 30) {
      throw new Error("ce PDF semble scanné (image sans texte lisible)");
    }
    return chunks;
  }
  throw new Error("format non pris en charge (PDF, .docx, .txt ou .md uniquement)");
}

async function addDocuments(files) {
  for (const file of files) {
    els.docsStatus.textContent = "Lecture de « " + file.name + " »…";
    try {
      const chunks = await extractDocument(file);
      if (!chunks.length) throw new Error("aucun texte trouvé");
      docs = docs.filter((d) => d.name !== file.name);
      docs.push({ name: file.name, chunks, chars: chunks.reduce((s, c) => s + c.text.length, 0), use: true });
      saveDocs();
      els.docsStatus.textContent = "✓ « " + file.name + " » ajouté.";
    } catch (e) {
      els.docsStatus.textContent = "✗ « " + file.name + " » : " + e.message + ".";
    }
    renderDocs();
  }
}

function renderDocs() {
  els.docsList.innerHTML = "";
  if (!docs.length) {
    els.docsList.innerHTML = '<p class="hint">Aucun document pour l\'instant.</p>';
    return;
  }
  docs.forEach((d) => {
    const item = document.createElement("div");
    item.className = "hist-item doc-item";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = d.use;
    cb.title = "Utiliser ce document";
    cb.addEventListener("change", () => { d.use = cb.checked; saveDocs(); });
    const info = document.createElement("div");
    info.className = "doc-info";
    const pages = d.chunks.filter((c) => /^p\. /.test(c.label)).map((c) => c.label);
    info.innerHTML = "";
    const n = document.createElement("div"); n.className = "doc-name"; n.textContent = d.name;
    const m = document.createElement("div"); m.className = "muted";
    m.textContent = Math.round(d.chars / 1000) + " k caractères" + (pages.length ? " · " + new Set(pages).size + " pages" : "");
    info.append(n, m);
    const del = document.createElement("button");
    del.className = "fav-del";
    del.textContent = "✕";
    del.title = "Retirer";
    del.addEventListener("click", () => { docs = docs.filter((x) => x !== d); saveDocs(); renderDocs(); });
    item.append(cb, info, del);
    els.docsList.appendChild(item);
  });
}

const MOTS_VIDES = new Set("les des une pour par sur dans avec aux est sont qui que quoi dont ces cette son ses leur leurs pas plus mais ont été être fait faire tout tous toute toutes comme elle ils nous vous lui entre selon sans sous vers chez donc ainsi alors aussi bien quel quelle quels quelles".split(" "));
function motsCles(t) {
  return [...new Set(t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !MOTS_VIDES.has(w)))];
}

// Choisit les passages les plus utiles pour la question, dans la limite de la mémoire du modèle
function docsContext(query) {
  if (!els.useDocs.checked) return null;
  const actifs = docs.filter((d) => d.use);
  if (!actifs.length) return null;
  const budget = settings.provider === "claude" ? 60000 : 6000;
  const all = [];
  actifs.forEach((d) => d.chunks.forEach((c) => all.push({ doc: d.name, label: c.label, text: c.text, norm: c.text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") })));
  const keys = motsCles(query);
  const df = {};
  keys.forEach((k) => (df[k] = all.filter((c) => c.norm.includes(k)).length));
  all.forEach((c) => {
    c.score = 0;
    keys.forEach((k) => {
      if (!df[k]) return;
      const occ = c.norm.split(k).length - 1;
      if (occ) c.score += (1 + Math.log(occ)) * Math.log(1 + all.length / df[k]);
    });
  });
  const total = all.reduce((s, c) => s + c.text.length, 0);
  let chosen;
  if (total <= budget) chosen = all;                       // tout tient : on envoie tout
  else {
    chosen = [];
    let used = 0;
    all.filter((c) => c.score > 0).sort((a, b) => b.score - a.score).forEach((c) => {
      if (used + c.text.length <= budget) { chosen.push(c); used += c.text.length; }
    });
    if (!chosen.length) return null;
  }
  const ref = (c) => "[" + c.doc + (c.label ? ", " + c.label : "") + "]";
  const text = "Documents de référence (extraits) :\n\n" +
    chosen.map((c) => ref(c) + "\n" + c.text).join("\n\n") +
    "\n\nAppuie-toi sur ces extraits quand c'est utile et cite la source entre crochets, par exemple " + ref(chosen[0]) +
    ". Si l'information demandée n'y figure pas, dis-le clairement au lieu d'inventer.\n\n---\n\n";
  const nDocs = new Set(chosen.map((c) => c.doc)).size;
  return { text, label: nDocs + " document" + (nDocs > 1 ? "s" : "") + " · " + chosen.length + " extrait" + (chosen.length > 1 ? "s" : "") };
}

/* ---------------------------------------------------------------------
   CORRECTION : « Phrase correcte » ou affichage des fautes corrigées
--------------------------------------------------------------------- */
function showCorrection(bubble, source, answer) {
  const norm = (t) => t.replace(/\s+/g, " ").trim();
  if (/^(phrase|texte) correct(e)?\s*\.?$/i.test(answer.trim()) || norm(answer) === norm(source)) {
    bubble.root.classList.add("ok");
    bubble.body.textContent = "✓ Phrase correcte — aucune faute trouvée.";
    return;
  }
  const parts = diffWords(source, answer);
  bubble.body.textContent = "";
  if (parts) {
    let n = 0, prev = "same";
    parts.forEach((p, k) => {
      const el = p.type === "same" ? document.createTextNode(p.text) : document.createElement(p.type);
      if (p.type !== "same") {
        el.textContent = p.text;
        const afterDel = prev === "del" || (prev === "same" && p.type === "ins" && k >= 2 && parts[k - 1].text === " " && parts[k - 2].type === "del");
        if (p.type === "del" || !afterDel) n++;
      }
      prev = p.type;
      bubble.body.appendChild(el);
    });
    const head = document.createElement("div");
    head.className = "corr-head";
    head.textContent = n + " correction" + (n > 1 ? "s" : "") + " : en rouge barré l'ancien texte, en vert le texte corrigé.";
    bubble.root.insertBefore(head, bubble.body);
  } else {
    bubble.body.textContent = answer; // texte trop long pour comparer mot à mot
  }
  addTools(bubble, answer, "texte");
}

// Comparaison mot à mot (plus longue sous-séquence commune)
function diffWords(a, b) {
  const A = a.split(/(\s+)/), B = b.split(/(\s+)/);
  const n = A.length, m = B.length;
  if (n * m > 4000000) return null;
  const L = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = [];
  const push = (type, text) => {
    const last = out[out.length - 1];
    if (last && last.type === type) last.text += text; else out.push({ type, text });
  };
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { push("same", A[i]); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) { push("del", A[i]); i++; }
    else { push("ins", B[j]); j++; }
  }
  while (i < n) push("del", A[i++]);
  while (j < m) push("ins", B[j++]);
  // Regroupe les modifications voisines : tout l'ancien texte barré, puis tout le nouveau
  const grouped = [];
  let del = "", ins = "", pendingSpace = "";
  const flush = () => {
    if (del) grouped.push({ type: "del", text: del.trim() });
    if (del && ins) grouped.push({ type: "same", text: " " });
    if (ins) grouped.push({ type: "ins", text: ins.trim() });
    del = ins = "";
  };
  out.forEach((p) => {
    if (p.type === "del") { del += pendingSpace + p.text; pendingSpace = ""; }
    else if (p.type === "ins") { ins += (ins ? pendingSpace || " " : "") + p.text; pendingSpace = ""; }
    else if (!p.text.trim() && (del || ins)) { pendingSpace += p.text; }
    else { flush(); grouped.push({ type: "same", text: pendingSpace + p.text }); pendingSpace = ""; }
  });
  flush();
  if (pendingSpace) grouped.push({ type: "same", text: pendingSpace });
  return grouped.filter((p) => p.text);
}

/* ---------------------------------------------------------------------
   15. OUTILS
--------------------------------------------------------------------- */
// Masque la "réflexion" de certains modèles locaux (balises <think>…</think>)
function withoutThinking(t) {
  return t.replace(/<think>[\s\S]*?(<\/think>|$)/g, "").replace(/^\s+/, "");
}

// Retire le Markdown que l'IA ajouterait malgré la consigne
function cleanText(t) {
  return t
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[*•]\s+/gm, "- ")
    .trim();
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (_) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
