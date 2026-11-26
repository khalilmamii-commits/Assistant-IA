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
  { label: "Reformuler", mode: "texte",
    consigne: "Reformule ce texte pour le rendre plus clair et plus fluide. Garde le sens, le niveau de détail et le registre." },
  { label: "Corriger", mode: "texte",
    consigne: "Corrige l'orthographe, la grammaire, la ponctuation et la typographie de ce texte. Ne change ni le style ni le contenu." },
  { label: "Plus concis", mode: "texte",
    consigne: "Rends ce texte plus concis (environ un tiers plus court) sans perdre d'information importante." },
  { label: "Style rapport", mode: "texte",
    consigne: "Réécris ce texte dans le style d'un rapport d'études technique : neutre, précis, impersonnel, avec le vocabulaire professionnel du métier." },
  { label: "Développer", mode: "texte",
    consigne: "Développe ce texte avec des transitions et une rédaction plus complète. N'invente aucun chiffre, aucune norme, aucune référence ni aucun fait absent du texte : si une précision manque, écris [à compléter]." },
  { label: "Résumer", mode: "texte",
    consigne: "Résume ce texte en quelques phrases. Utilise des tirets si une liste est plus lisible." },
  { label: "Expliquer", mode: "explication",
    consigne: "Explique ce texte simplement : de quoi il s'agit, le sens des termes techniques et les points à retenir." },
  { label: "Traduire (EN)", mode: "texte",
    consigne: "Traduis ce texte en anglais professionnel." },
];

/* ---------------------------------------------------------------------
   2. RÉGLAGES PAR DÉFAUT (modifiables ensuite dans ⚙)
--------------------------------------------------------------------- */
const DEFAULTS = {
  provider: "lmstudio",                 // "lmstudio" ou "claude"
  lmsUrl: "http://localhost:1234/v1",   // adresse du serveur LM Studio
  lmsModel: "",                         // vide = modèle chargé dans LM Studio
  apiKey: "",                           // clé API Anthropic (moteur Claude)
  model: "claude-sonnet-5-5",           // modèle Claude
  context: "Je suis ingénieur routier / VRD. Mes documents sont des rapports d'études techniques (AVP, PRO, DCE), des notes et des mémoires techniques.",
  saved: false,
};
const MAX_TOKENS_CLAUDE = 8192;   // longueur maximale d'une réponse Claude
const MAX_SOURCE_CHARS = 200000;  // au-delà, le texte est tronqué
const STORAGE_KEY = "assistant-ia-word.settings";
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

const $ = (id) => document.getElementById(id);
const els = {
  main: $("main"), settings: $("settings"), chat: $("chat"), actions: $("actions"),
  preview: $("selection-preview"), manual: $("manual-text"), wholeDoc: $("whole-doc"),
  prompt: $("prompt"), send: $("btn-send"), banner: $("browser-banner"), toast: $("toast"),
  badge: $("engine-badge"),
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
    b.addEventListener("click", () => runAction(a));
    els.actions.appendChild(b);
  });

  $("btn-settings").addEventListener("click", openSettings);
  $("btn-cancel").addEventListener("click", closeSettings);
  $("btn-save").addEventListener("click", saveSettings);
  $("btn-new").addEventListener("click", newConversation);
  $("btn-test").addEventListener("click", testLMStudio);
  $("btn-manifest").addEventListener("click", downloadManifest);
  els.provider.addEventListener("change", showProviderFields);
  els.send.addEventListener("click", () => (controller ? stopGeneration() : sendPrompt()));
  els.prompt.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!controller) sendPrompt(); }
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
    // Bouton "Télécharger le manifeste" quand la page est en ligne (https)
    if (location.protocol === "https:") $("btn-manifest").hidden = false;
  }

  updateBadge();
  if (!settings.saved) openSettings();
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
    c.textContent = text.length.toLocaleString("fr-FR") + " caractères";
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
async function runAction(action) {
  if (controller) return;
  const source = await safeGetSource();
  if (source === null) return;
  if (!source) {
    toast(IN_WORD ? "Sélectionnez d'abord du texte dans Word." : "Collez d'abord un texte.");
    return;
  }
  newConversation(); // une action rapide démarre une conversation neuve
  lastSentSource = source;
  await ask(buildMessage(action.consigne, source), action.label, source.length, action.mode);
}

async function sendPrompt() {
  const question = els.prompt.value.trim();
  if (!question) return;
  const source = await safeGetSource();
  if (source === null) return;
  // On joint le texte ciblé seulement s'il a changé depuis le dernier envoi
  const attach = source && source !== lastSentSource;
  if (attach) lastSentSource = source;
  els.prompt.value = "";
  await ask(attach ? buildMessage(question, source) : question, question, attach ? source.length : 0, "texte");
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
  history = [];
  lastSentSource = null;
  els.chat.innerHTML = "";
}

async function ask(content, displayLabel, attachedChars, mode) {
  if (settings.provider === "claude" && !settings.apiKey) {
    openSettings();
    toast("Ajoutez d'abord votre clé API Claude.");
    return;
  }

  addUserBubble(displayLabel, attachedChars);
  history.push({ role: "user", content });

  const bubble = addAssistantBubble();
  setBusy(true);
  controller = new AbortController();
  let raw = "";
  try {
    const call = settings.provider === "claude" ? callClaude : callLMStudio;
    await call(history, (chunk) => {
      raw += chunk;
      bubble.body.textContent = withoutThinking(raw) || "Réflexion…";
      scrollToBottom();
    }, controller.signal);
    const answer = cleanText(withoutThinking(raw));
    if (!answer) throw new Error("Le modèle n'a renvoyé aucun texte.");
    bubble.body.textContent = answer;
    history.push({ role: "assistant", content: answer });
    addTools(bubble, answer, mode);
  } catch (e) {
    const partial = cleanText(withoutThinking(raw));
    if (e.name === "AbortError") {
      bubble.body.textContent = partial + (partial ? "\n\n" : "") + "[Réponse interrompue]";
      if (partial) {
        history.push({ role: "assistant", content: partial });
        addTools(bubble, partial, mode);
      } else {
        history.pop();
      }
    } else {
      bubble.root.remove();
      history.pop();
      showError(e.message);
    }
  } finally {
    bubble.body.classList.remove("streaming");
    setBusy(false);
    scrollToBottom();
  }
}

/* ---------------------------------------------------------------------
   8. CONSIGNES GÉNÉRALES DONNÉES À L'IA
--------------------------------------------------------------------- */
function systemPrompt() {
  const lines = [
    "Tu es un assistant d'écriture intégré dans Microsoft Word, sous forme de panneau latéral.",
    "Règles :",
    "- Quand on te demande de transformer un texte (reformuler, corriger, résumer, traduire…), réponds UNIQUEMENT avec le texte final, prêt à être inséré dans le document : pas d'introduction, pas de guillemets, pas de commentaire avant ou après.",
    "- Conserve la langue du texte d'origine, sauf demande de traduction.",
    "- Écris en texte brut, sans Markdown (pas de **, pas de #, pas de tableaux). Pour une liste, utilise des tirets « - ».",
    "- Pour une explication ou une question, réponds de façon claire, structurée et concise.",
    "- N'invente jamais de chiffres, de normes, de références ni de faits.",
  ];
  if (settings.context) lines.push("", "Contexte de l'utilisateur : " + settings.context);
  return lines.join("\n");
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

async function callLMStudio(messages, onText, signal) {
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
        temperature: 0.4,
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
async function callClaude(messages, onText, signal) {
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

function addAssistantBubble() {
  const root = document.createElement("div");
  root.className = "msg assistant";
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
  els.actions.querySelectorAll("button").forEach((b) => (b.disabled = busy));
  if (!busy) controller = null;
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
  els.testResult.hidden = true;
  showProviderFields();
  els.settings.hidden = false;
  els.main.hidden = true;
}

function closeSettings() {
  els.settings.hidden = true;
  els.main.hidden = false;
}

function saveSettings() {
  settings = {
    provider: els.provider.value,
    lmsUrl: els.lmsUrl.value.trim() || DEFAULTS.lmsUrl,
    lmsModel: els.lmsModel.value,
    apiKey: els.key.value.trim(),
    model: els.model.value.trim() || DEFAULTS.model,
    context: els.context.value.trim(),
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
