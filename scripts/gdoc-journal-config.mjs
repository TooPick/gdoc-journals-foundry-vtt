import { GDocJournalsUtils } from "./gdoc-journals-utils.mjs";
import { GDocJournals } from "./gdoc-journals.mjs";
import { GDocLink } from "./gdoc-journal-link.mjs";

/**
 * The configuration window
 */
export class GDocJournalsConfig extends FormApplication {
  /**
   * Set values and open window
   */
  showConfig(journalSheetId) {
    this.reset();
    this.options.journalSheetId = journalSheetId;
    this.render(true, {
      focus: true,
    });
  }

  /**
   * Set default values
   */
  reset() {
    this.options = GDocJournalsConfig.defaultOptions;
  }

  static get defaultOptions() {
    const defaults = super.defaultOptions;
    const overrides = {
      closeOnSubmit: false,
      height: "auto",
      id: "gdoc-journals",
      submitOnChange: true,
      minimizable: false,
      template: GDocJournals.TEMPLATES.SET_LINK,
      title: game.i18n.localize("GDOC_JOURNALS.config-title"),
      journalSheetId: "",
      savedLinks: [],
      currentLinks: [],
      width: 500,
      focus: true,
      init: false,
    };

    const mergedOptions = foundry.utils.mergeObject(defaults, overrides);

    return mergedOptions;
  }

  /**
   * Handle all window actions
   */
  async _handleButtonClick(event) {
    const clickedElement = $(event.currentTarget);
    const action = clickedElement.data().action;

    switch (action) {
      // Add a new link
      case "addLink": {
        this.options.currentLinks.push(new GDocLink());
        this.render(true, {
          currentLinks: this.options.currentLinks,
        });
        break;
      }
      // Remove an existing link
      case "removeLink": {
        const index = clickedElement.data().index;
        this.options.currentLinks.splice(index, 1);
        this.render(true, {
          currentLinks: this.options.currentLinks,
        });
        break;
      }
      // Update journal with current links
      case "update": {
        await this._handleUpdateAction();
        this.close();
        break;
      }
    }
  }

  /**
   * Retrieve all links stored in journal pages
   */
  getData(options) {
    if (!options.init) {
      const journalSheetId = options.journalSheetId;
      options.savedLinks = GDocJournalsUtils.getAllPageLinks(journalSheetId);
      options.currentLinks = JSON.parse(JSON.stringify(options.savedLinks));
      options.init = true;
    }

    return {
      currentLinks: options.currentLinks,
    };
  }

  /**
   * Update the data structure on form changes
   */
  async _updateObject(event, formData) {
    const expandedData = foundry.utils.expandObject(formData);
    const ids = Object.keys(expandedData);
    const currentLinks = [];
    ids.forEach((id) => {
      currentLinks.push(new GDocLink(expandedData[id], "", id));
    });
    this.options.currentLinks = currentLinks;
  }

  /**
   * Update journal action
   */
  async _handleUpdateAction() {
    const journalSheetId = this.options.journalSheetId;

    if (Array.isArray(this.options.currentLinks)) {
      const journal = await game.journal.get(journalSheetId);
      if (journal !== undefined) {
        // Remove journal pages if link was removed
        await GDocJournalsUtils.removeUnusedPagesLinks(
          journalSheetId,
          this.options.currentLinks
        );

        await this.options.currentLinks.forEach(async (gdocLink) => {
          // Search for an existing page for this link
          let page = await GDocJournalsUtils.findJournalPageWithLink(
            journalSheetId,
            gdocLink
          );

          if (!page) {
            //Create a new page
            page = await JournalEntryPage.createDocuments(
              [
                {
                  name: gdocLink.link,
                },
              ],
              { parent: journal }
            );

            page = journal.pages.get(page[0].id);

            // Update the flag link data
            await page.setFlag(
              GDocJournals.ID,
              GDocJournals.FLAGS.GDOC_LINK,
              gdocLink
            );
          }

          // Update the page with gdoc link
          GDocJournalsUtils.updatePage(page);
        });
      }
    }
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.on("click", "[data-action]", this._handleButtonClick.bind(this));
  }
}
