// === IMPORTS ===
import { personaeCharacters as originalCharacters } from "./database/personaeCharacters.js";
import { portraitsMapPersonae as portraitsMap } from "./database/portraitsMapPersonae.js";
import { personas } from "./database/persona.js";

// === CONSTANTES ===
const validOpus = {
  P3: ["P3", "P3P", "P3FES"],
  P4: ["P4", "P4G", "P4AU", "P4D"],
  P5: ["P5", "P5R", "P5S", "P5T"]
};

let activeFilters = ["P3", "P4", "P5"];
let filteredCharacters = [];
let target = null;
let attempts = 0;
const maxAttempts = 3;
let gameOver = false;
let lastFiveTargets = [];

let victoryBox, victoryImage, victoryText;
let textbar, guessBtn, resetBtn, giveUpBtn, giveUpCounter, wrongList, personaImg;

// === INIT GLOBAL ===
document.addEventListener("DOMContentLoaded", () => {
  // Elements
  textbar = document.getElementById("textbar");
  personaImg = document.getElementById("personaImage");
  guessBtn = document.getElementById("guessButton");
  resetBtn = document.getElementById("resetButton");
  giveUpBtn = document.getElementById("giveUpButton");
  giveUpCounter = document.getElementById("giveUpCounter");
  wrongList = document.getElementById("wrongGuessList");

  victoryBox = document.getElementById("victoryBox");
  victoryImage = document.getElementById("victoryImage");
  victoryText = document.getElementById("victoryText");

  // ✅ Restore filters from localStorage
  const storedFilters = localStorage.getItem("personaeActiveFilters");
  if (storedFilters) {
    try {
      const parsed = JSON.parse(storedFilters);
      if (Array.isArray(parsed)) activeFilters = parsed;
    } catch (e) {
      console.warn("⚠️ Error reading stored filters:", e);
    }
  }

  setupRulesModal();
  setupFilterButtons(); // applique visuellement les bons filtres
  applyDarkModeStyles();

  guessBtn.addEventListener("click", handleGuess);
  resetBtn.addEventListener("click", resetGame);
  giveUpBtn.addEventListener("click", giveUp);

  initializeAutocomplete(textbar, personas.sort((a, b) => a.localeCompare(b)));

  // Restore session
  const stored = localStorage.getItem("personaeTarget");
  const storedAttempts = parseInt(localStorage.getItem("personaeAttempts")) || 0;
  const storedGameOver = localStorage.getItem("personaeGameOver") === "true";

  if (stored) {
    try {
      target = JSON.parse(stored);
      filteredCharacters = getFilteredCharacters();
      attempts = storedAttempts;
      giveUpCounter.textContent = `(${attempts} / ${maxAttempts})`;

      personaImg.src = `./database/img/${target.image}.webp`;
      personaImg.alt = target.persona;

      if (attempts >= maxAttempts) {
        giveUpBtn.disabled = false;
        giveUpCounter.classList.add("activated");
      }

      if (storedGameOver) {
        const force = localStorage.getItem("personaeForceReveal") === "true";
        showVictory(force, force ? null : (Array.isArray(target.user) ? target.user[0] : target.user));
      }

    } catch (e) {
      resetGame();
    }
  } else {
    resetGame();
  }
});


// === UTILS ===
function getFilteredCharacters() {
  const accepted = activeFilters.flatMap(o => validOpus[o]);
  return originalCharacters.filter(c => {
    const op = Array.isArray(c.opus) ? c.opus : [c.opus];
    return op.some(o => accepted.includes(o));
  });
}

function pickCharacter() {
  filteredCharacters = getFilteredCharacters();
  const pool = filteredCharacters.filter(c => !lastFiveTargets.includes(c.persona));
  const choices = pool.length > 0 ? pool : [...filteredCharacters];

  target = choices[Math.floor(Math.random() * choices.length)];
  lastFiveTargets.push(target.persona);
  if (lastFiveTargets.length > 5) lastFiveTargets.shift();

  personaImg.src = `./database/img/${target.image}.webp`;
  personaImg.alt = target.persona;

  localStorage.setItem("personaeTarget", JSON.stringify(target));
  localStorage.setItem("personaeAttempts", attempts);
  localStorage.setItem("personaeGameOver", "false");
}

// === AUTOCOMPLETE ===
function initializeAutocomplete(input, personasList) {
  let currentFocus = -1;

  input.addEventListener("input", function () {
    closeList();
    const val = this.value.trim();
    if (!val) return;

    const list = document.createElement("DIV");
    list.setAttribute("id", "autocomplete-list");
    list.setAttribute("class", "autocomplete-items");
    this.parentNode.appendChild(list);

    const lowerVal = val.toLowerCase();
    const matches = [];

for (let i = 0; i < personasList.length; i++) {
  const displayName = personasList[i];
  const lowerName = displayName.toLowerCase();
  const lowerVal = val.toLowerCase();

  const [firstName = "", lastName = ""] = displayName.toLowerCase().split(" ");

  const character = originalCharacters.find(c => {
    const users = Array.isArray(c.user) ? c.user : [c.user];
    return users.some(u => u.toLowerCase() === displayName.toLowerCase());
  });

  if (!character || character._guessed) continue;

  const accepted = activeFilters.flatMap(o => validOpus[o]);
  const opus = Array.isArray(character.opus) ? character.opus : [character.opus];
  if (!opus.some(op => accepted.includes(op))) continue;

  // Si le prénom commence par ce que tape l'utilisateur → priorité
  if (firstName.startsWith(lowerVal)) {
    matches.unshift(displayName); // on met en haut
  } else if (lastName.startsWith(lowerVal) || lowerName.includes(lowerVal)) {
    matches.push(displayName); // on met en bas
  }
}


    matches.forEach(nom => {
      const imageName = portraitsMap[nom] || nom.split(" ")[0];
      const portraitName = encodeURIComponent(imageName);

      const option = document.createElement("DIV");
      option.className = "list-options";
      option.innerHTML = `
        <img src="../database/portraits/${portraitName}.webp" alt="${nom}">
        <span class="codename">${nom}</span>
        <input type='hidden' value='${nom}'>
      `;

      option.addEventListener("click", function () {
        input.value = this.querySelector("input").value;
        handleGuess();
        closeList();
      });

      list.appendChild(option);
    });

    currentFocus = -1;
  });

  input.addEventListener("keydown", function (e) {
    const items = document.querySelectorAll("#autocomplete-list .list-options");
    if (!items.length) return;

    if (e.key === "ArrowDown") {
      currentFocus++;
      updateActive(items);
    } else if (e.key === "ArrowUp") {
      currentFocus--;
      updateActive(items);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (currentFocus > -1) items[currentFocus].click();
      else items[0]?.click();
    }
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest("#autocomplete-list") && e.target !== input) {
      closeList();
    }
  });

  function updateActive(items) {
    items.forEach(i => i.classList.remove("autocomplete-active"));
    if (currentFocus >= items.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = items.length - 1;
    items[currentFocus].classList.add("autocomplete-active");
    items[currentFocus].scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function closeList() {
    const lists = document.getElementsByClassName("autocomplete-items");
    for (let i = 0; i < lists.length; i++) {
      lists[i].parentNode.removeChild(lists[i]);
    }
  }
}

// === SHOW WIN / LOSE ===
function showVictory(force = false, name = null) {
  gameOver = true;
  textbar.disabled = true;
  guessBtn.disabled = true;
  giveUpBtn.disabled = true;

  const portraitName = encodeURIComponent(portraitsMap[name] || name.split(" ")[0]);
  victoryImage.src = `../database/portraits/${portraitName}.webp`;
  victoryImage.alt = name;

  if (force) {
victoryText.innerHTML = `❌ Too bad!&nbsp;<span class="user-name">${target.user}</span>'s Persona was&nbsp;<span class="persona-name">${target.persona}</span>.`;
    victoryText.className = "victory-message failure-text";
  } else {
victoryText.innerHTML = `✅ Good Guess!&nbsp;<span class="persona-name">${target.persona}</span>&nbsp;is the Persona of&nbsp;<span class="user-name">${name}</span>!`;
    victoryText.className = "victory-message success-text";
    showConfettiExplosion();
  }
setTimeout(() => {
  victoryBox.scrollIntoView({ behavior: "smooth", block: "center" });
}, 500);

  victoryBox.style.display = "block";
  
revealNextLink({
  prevHref: "../silhouetteMode/silhouette.html",
  nextHref: "../musicsMode/musics.html"
});

  localStorage.setItem("personaeGameOver", "true");
}

function showWrong(name) {
  const imageName = portraitsMap[name] || name.split(" ")[0];
  const div = document.createElement("div");
  div.className = "wrong-mini";
  const img = document.createElement("img");
  img.src = `../database/portraits/${imageName}.webp`;
  img.alt = name;
  div.appendChild(img);
  wrongList.appendChild(div);
  setTimeout(() => div.classList.add("shake"), 50);
}

// === GAME LOGIC ===
function handleGuess() {

  
  if (gameOver) return;
  const guess = textbar.value.trim();
  if (!guess) return;
  attempts++;
  localStorage.setItem("personaeAttempts", attempts);

  giveUpCounter.textContent = `(${attempts} / ${maxAttempts})`;

  if (attempts >= maxAttempts) {
    giveUpBtn.disabled = false;
    giveUpCounter.classList.add("activated");
  }

  const users = Array.isArray(target.user) ? target.user : [target.user];
  const found = users.some(u => u.toLowerCase() === guess.toLowerCase());

  if (found) showVictory(false, guess);
  else showWrong(guess);

  textbar.value = "";
  // Empêche ce personnage de réapparaître dans l'autocomplétion
const guessedCharacter = originalCharacters.find(c => {
  const users = Array.isArray(c.user) ? c.user : [c.user];
  return users.some(u => u.toLowerCase() === guess.toLowerCase());
});
if (guessedCharacter) guessedCharacter._guessed = true;

  textbar.dispatchEvent(new Event("input"));
}

function giveUp() {
  if (attempts < maxAttempts || gameOver) return;

  // Marque le jeu comme terminé
  gameOver = true;

  // Enregistre l'état de fin dans le localStorage
  localStorage.setItem("personaeGameOver", "true");
  localStorage.setItem("personaeForceReveal", "true");

  // Affiche la box de victoire (comme défaite)
  showVictory(true, Array.isArray(target.user) ? target.user[0] : target.user);
}



function resetGame() {
  localStorage.removeItem("personaeTarget");
localStorage.removeItem("personaeAttempts");
localStorage.removeItem("personaeGameOver");
localStorage.removeItem("personaeForceReveal");

  const nav = document.getElementById("modeNavigationContainer");
  if (nav) nav.style.display = "none";

  gameOver = false;
  attempts = 0;
  giveUpCounter.textContent = `(0 / ${maxAttempts})`;
  giveUpCounter.classList.remove("activated");
  giveUpBtn.disabled = true;
  textbar.disabled = false;
  guessBtn.disabled = false;
  wrongList.innerHTML = "";
  textbar.value = "";

  victoryBox.style.display = "none";
  victoryText.innerHTML = "";
  victoryImage.src = "";

  originalCharacters.forEach(c => c._guessed = false);

  // ✅ NE PAS re-piocher un perso si on en a déjà un en mémoire
  const stored = localStorage.getItem("personaeTarget");
  if (stored) {
    try {
      target = JSON.parse(stored);
      personaImg.src = `./database/img/${target.image}.webp`;
      personaImg.alt = target.persona;
      return;
    } catch (e) {
      console.warn("⚠️ Erreur en rechargeant le personnage : ", e);
    }
  }

  // Si rien dans le localStorage ou échec → on pioche un nouveau
  pickCharacter();
}


// === UI SETUP ===
function setupFilterButtons() {
  const btns = document.querySelectorAll(".filter-btn");

  // ✅ Met à jour visuellement les boutons selon les filtres actifs
  btns.forEach(btn => {
    const val = btn.dataset.opus;
    if (activeFilters.includes(val)) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // ✅ Gestion du clic
  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      const val = btn.dataset.opus;
      btn.classList.toggle("active");

      if (btn.classList.contains("active")) {
        if (!activeFilters.includes(val)) activeFilters.push(val);
      } else {
        activeFilters = activeFilters.filter(o => o !== val);
      }

      // ✅ Sauvegarde du filtre actif
      localStorage.setItem("personaeActiveFilters", JSON.stringify(activeFilters));
      resetGame();
    });
  });
}

function setupRulesModal() {
  const modal = document.getElementById("rulesModal");
  const btn = document.getElementById("rulesButton");
  const closeBtn = modal.querySelector(".close");
  btn.addEventListener("click", () => modal.style.display = "block");
  closeBtn.addEventListener("click", () => modal.style.display = "none");
  window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });
}

function applyDarkModeStyles() {
  if (!document.body.classList.contains("darkmode")) return;
  const zone = document.querySelector(".persona-box");
  if (zone) {
    zone.style.backgroundColor = "#222";
    zone.style.border = "3px solid #888";
  }
}

// === CONFETTIS ===
function showConfettiExplosion() {
  const emojiList = ["🎉", "🎊", "✨", "💥", "🌟"];
  const numEmojis = 30;

  for (let i = 0; i < numEmojis; i++) {
    const emoji = document.createElement("span");
    emoji.textContent = emojiList[Math.floor(Math.random() * emojiList.length)];
    emoji.classList.add("confetti-emoji");
    emoji.style.left = Math.random() * 100 + "vw";
    emoji.style.bottom = "0vh";
    emoji.style.setProperty("--x-move", (Math.random() * 100 - 50) + "vw");
    emoji.style.setProperty("--y-move", -(Math.random() * 50 + 30) + "vh");
    emoji.style.setProperty("--rotate", Math.random() * 360 + "deg");
    document.body.appendChild(emoji);
    setTimeout(() => emoji.remove(), 1000);
  }
}

// === DEBUG ===
export function debugAllPersonae() {
  console.log("=== DÉBUT DU DEBUG PERSONAE MODE ===");
  const errors = [];
  const usableNames = personas.sort();
  for (const name of usableNames) {
    const result = { nom: name, inMap: false, inUser: false };
    const match = originalCharacters.find(c => {
      const users = Array.isArray(c.user) ? c.user : [c.user];
      return users.some(u => u === name);
    });
    result.inUser = !!match;
    if (!match) errors.push(`❌ ${name} — Absent dans personaeCharacters.js`);
    const imageKey = portraitsMap[name];
    result.inMap = !!imageKey;
    if (!imageKey) errors.push(`❌ ${name} — Manque dans portraitsMapPersonae.js`);
    if (result.inUser && result.inMap) console.log(`✅ OK : ${name}`);
  }
  if (errors.length) console.log(errors.join("\n"));
  else console.log("🎉 Aucune erreur détectée !");
  console.log("=== FIN DU DEBUG ===");
}
debugAllPersonae(); // 

function revealNextLink({ nextHref = "", prevHref = "" } = {}) {
  const nav = document.getElementById("modeNavigationContainer");
  const nextButton = document.getElementById("nextModeButton");
  const prevButton = document.getElementById("prevModeButton");

  if (nextButton && nextHref) {
    nextButton.onclick = () => (location.href = nextHref);
  }

  if (prevButton) {
    if (prevHref) {
      prevButton.style.visibility = "visible";
      prevButton.onclick = () => (location.href = prevHref);
    } else {
      prevButton.style.visibility = "hidden";
      prevButton.onclick = null;
    }
  }

  if (nav) {
    nav.style.display = "flex";
    setTimeout(() => {
      nav.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 1500);
  }
}
