import { GDocJournalsConfig } from "./gdoc-journal-config.mjs";
import { GDocJournalsUtils } from "./gdoc-journals-utils.mjs";

export class GDocJournals {
  static ID = "gdoc-journals";

  static FLAGS = {
    GDOC_LINK: "gdoc-link",
  };

  static TEMPLATES = {
    SET_LINK: `modules/${this.ID}/templates/gdoc-journals-set-link.hbs`,
  };

  static initialize() {
    this.config = new GDocJournalsConfig();
  }
}

/**
 * Once the game has initialized, set up the module
 */
Hooks.once("init", () => {
  console.log("Google Docs Journals | Initialization");
  GDocJournals.initialize();
});

/**
 * Add the config button on the journal sheet window
 */
Hooks.on("getDocumentSheetHeaderButtons", (journalSheet, args) => {
  const documentType = journalSheet.object.documentName;
  if (documentType === "JournalEntry") {
    const button = {
      class: "gdoc-journal-set-link",
      icon: "fas fa-file",
      label: game.i18n.localize("GDOC_JOURNALS.btn-title"),
      onclick: (event) => {
        GDocJournals.config.showConfig(journalSheet.object._id);
      },
    };

    args.splice(0, 0, button);
  }
});

/**
 * Add the "update all" button on the journals tab
 */
Hooks.on("renderJournalDirectory", (app, html, data) => {
  // Browser Buttons
  const grouping = $('<div class="flexcol browser-group"></div>');
  const updateAllBrowserButton = $(
    `<button class="update-all-gdoc-journals-btn"><i class="fas fa-sync"></i> ${game.i18n.localize(
      "GDOC_JOURNALS.update-all"
    )}</button>`
  );

  html.find(".directory-footer").append(grouping);
  html.find(".browser-group").append(updateAllBrowserButton);

  // Handle button clicks
  updateAllBrowserButton.click((ev) => {
    ev.preventDefault();
    GDocJournalsUtils.syncAllJournals();
  });
});
