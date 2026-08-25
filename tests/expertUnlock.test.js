/**
 * expertUnlock.test.js — Porte d'entrée du Mode Expert, côté client.
 *
 * Ce que ce fichier protège (et pourquoi ça n'allait pas de soi) :
 *
 *   1. `expertContext().modeKey` doit être la clé BACKEND ("classic"), pas le
 *      libellé d'affichage. `statsKey`/`hashMode` valent "Classic" en normal et
 *      "ClassicExpert" en Expert : les envoyer à l'API ne matcherait aucun mode,
 *      et le bouton resterait déverrouillé en silence — exactement le genre de
 *      panne qu'aucune erreur ne signale.
 *
 *   2. Le verrou est un affichage OPTIMISTE : hors ligne, non connecté, ou backend
 *      en erreur, le bouton reste cliquable. Ce n'est pas un trou de sécurité —
 *      `api/sessions.php` refuse la session Expert de toute façon — mais il faut
 *      que ce soit un choix testé, pas un effet de bord.
 *
 *   3. Le libellé de condition est construit CÔTÉ CLIENT à partir du type et des
 *      deux nombres. Si le serveur renvoyait la phrase toute faite, elle serait en
 *      anglais pour les 6 langues du site.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  expertContext,
  setupExpertToggle,
  expertConditionLabel,
  resetExpertStatusCache,
} from "../js/gameCore.js";

/** Pose le `<a id="expertToggle">` que les 6 pages de mode contiennent. */
function mountToggle() {
  document.body.innerHTML = `
    <a href="classiqueMode.html?expert=1" id="expertToggle" class="expert-toggle"
       data-i18n="ui.expert_enter">⚡ Expert mode</a>`;
  return document.getElementById("expertToggle");
}

/** Branche le bridge window._personadleApi sur une réponse d'expert-status. */
function stubExpertStatus(expertStatus) {
  window._personadleApi = {
    user: { expertStatus: vi.fn().mockResolvedValue({ expert_status: expertStatus }) },
  };
}

beforeEach(() => {
  resetExpertStatusCache();
  window._personadleApi = undefined;
  window.history.replaceState({}, "", "/classiqueMode.html");
});

afterEach(() => {
  document.body.innerHTML = "";
  window._personadleApi = undefined;
  resetExpertStatusCache();
});

describe("expertContext — clé de mode envoyée au backend", () => {
  it("expose la clé canonique du mode normal, pas le libellé d'affichage", () => {
    const ctx = expertContext({ prefix: "classicExpert", statsKey: "Classic", hashMode: "Classic" });
    expect(ctx.modeKey).toBe("classic");
  });

  it("garde la clé du mode NORMAL même sur une page Expert", () => {
    window.history.replaceState({}, "", "/classiqueMode.html?expert=1");
    const ctx = expertContext({ prefix: "classicExpert", statsKey: "Classic", hashMode: "Classic" });

    // hashMode est suffixé pour cloisonner le tirage quotidien…
    expect(ctx.hashMode).toBe("ClassicExpert");
    // …mais la clé d'API reste celle du mode, sinon aucun statut ne correspondrait.
    expect(ctx.modeKey).toBe("classic");
  });
});

describe("expertConditionLabel — progression lisible", () => {
  it("rend la progression pour une condition de victoires rapides", () => {
    const label = expertConditionLabel({
      condition_type: "mode_wins_under_attempts",
      current: 7,
      required: 10,
    });
    expect(label).toContain("7");
    expect(label).toContain("10");
  });

  it("distingue les trois types de condition", () => {
    const base = { current: 3, required: 15 };
    const perfects = expertConditionLabel({ ...base, condition_type: "mode_consecutive_perfects" });
    const singleDay = expertConditionLabel({ ...base, condition_type: "mode_wins_single_day" });
    expect(perfects).not.toBe(singleDay);
  });

  it("ne renvoie jamais la clé i18n brute quand le type est inconnu", () => {
    const label = expertConditionLabel({ condition_type: "mode_qui_nexiste_pas", current: 1, required: 2 });
    expect(label).not.toContain("ui.expert_cond");
    expect(label).toContain("1");
  });
});

describe("setupExpertToggle — verrou du bouton ⚡", () => {
  it("verrouille le bouton quand le mode n'est pas débloqué", async () => {
    const toggle = mountToggle();
    stubExpertStatus({
      classic: {
        unlocked: false,
        condition_type: "mode_wins_under_attempts",
        required: 10,
        current: 4,
      },
    });

    const ctx = expertContext({ prefix: "classicExpert", statsKey: "Classic", hashMode: "Classic" });
    setupExpertToggle(ctx, "classiqueMode.html");
    await vi.waitFor(() => expect(toggle.classList.contains("expert-locked")).toBe(true));

    // Plus de href : le lien ne doit être ni activable, ni copiable.
    expect(toggle.hasAttribute("href")).toBe(false);
    expect(toggle.getAttribute("aria-disabled")).toBe("true");
    // La condition chiffrée doit être lisible au survol ET par un lecteur d'écran.
    expect(toggle.title).toContain("4");
    expect(toggle.title).toContain("10");
    expect(toggle.getAttribute("aria-label")).toContain(toggle.title);
    // Reste atteignable au clavier, sinon l'aria-label est inaccessible.
    expect(toggle.getAttribute("tabindex")).toBe("0");
  });

  it("laisse le bouton intact quand le mode est débloqué", async () => {
    const toggle = mountToggle();
    stubExpertStatus({
      classic: { unlocked: true, condition_type: "mode_wins_under_attempts", required: 10, current: 10 },
    });

    const ctx = expertContext({ prefix: "classicExpert", statsKey: "Classic", hashMode: "Classic" });
    setupExpertToggle(ctx, "classiqueMode.html");
    await vi.waitFor(() => expect(window._personadleApi.user.expertStatus).toHaveBeenCalled());

    expect(toggle.classList.contains("expert-locked")).toBe(false);
    expect(toggle.getAttribute("href")).toBe("classiqueMode.html?expert=1");
  });

  it("laisse le bouton cliquable pour un visiteur non connecté (pas de bridge API)", async () => {
    const toggle = mountToggle();
    window._personadleApi = undefined;

    const ctx = expertContext({ prefix: "classicExpert", statsKey: "Classic", hashMode: "Classic" });
    setupExpertToggle(ctx, "classiqueMode.html");
    await Promise.resolve();

    expect(toggle.classList.contains("expert-locked")).toBe(false);
    expect(toggle.getAttribute("href")).toBe("classiqueMode.html?expert=1");
  });

  it("laisse le bouton cliquable si le backend échoue (affichage optimiste)", async () => {
    const toggle = mountToggle();
    window._personadleApi = {
      user: { expertStatus: vi.fn().mockRejectedValue(new Error("offline")) },
    };

    const ctx = expertContext({ prefix: "classicExpert", statsKey: "Classic", hashMode: "Classic" });
    setupExpertToggle(ctx, "classiqueMode.html");
    await vi.waitFor(() => expect(window._personadleApi.user.expertStatus).toHaveBeenCalled());

    expect(toggle.classList.contains("expert-locked")).toBe(false);
  });

  it("ne verrouille jamais le bouton de RETOUR depuis une page Expert", async () => {
    window.history.replaceState({}, "", "/classiqueMode.html?expert=1");
    const toggle = mountToggle();
    stubExpertStatus({
      classic: { unlocked: false, condition_type: "mode_wins_under_attempts", required: 10, current: 0 },
    });

    const ctx = expertContext({ prefix: "classicExpert", statsKey: "Classic", hashMode: "Classic" });
    setupExpertToggle(ctx, "classiqueMode.html");
    await Promise.resolve();

    // Sur une page Expert le bouton signifie « revenir au mode normal » : le
    // verrouiller enfermerait le joueur sur la page.
    expect(toggle.classList.contains("expert-locked")).toBe(false);
    expect(toggle.getAttribute("href")).toBe("classiqueMode.html");
  });

  it("ne redemande pas le statut à chaque appel (une réponse couvre les 6 modes)", async () => {
    mountToggle();
    stubExpertStatus({
      classic: { unlocked: true, condition_type: "mode_wins_under_attempts", required: 10, current: 10 },
    });
    const ctx = expertContext({ prefix: "classicExpert", statsKey: "Classic", hashMode: "Classic" });

    setupExpertToggle(ctx, "classiqueMode.html");
    await vi.waitFor(() => expect(window._personadleApi.user.expertStatus).toHaveBeenCalledTimes(1));
    setupExpertToggle(ctx, "classiqueMode.html");
    await Promise.resolve();

    expect(window._personadleApi.user.expertStatus).toHaveBeenCalledTimes(1);
  });
});
