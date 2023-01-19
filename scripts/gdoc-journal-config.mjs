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
      // Remove journal pages if link was removed
      await GDocJournalsUtils.removeUnusedPagesLinks(
        journalSheetId,
        this.options.currentLinks
      );

      const journal = await game.journal.get(journalSheetId);
      if (journal !== undefined) {
        await this.options.currentLinks.forEach(async (gdocLink) => {
          // Retrieve the Gdoc html and title
          const result = await GDocJournalsUtils.getGDocHtml(gdocLink.link);

          // Search for an existing page for this link
          const foundPage = await GDocJournalsUtils.findJournalPageWithLink(
            journalSheetId,
            gdocLink
          );

          gdocLink.title = result.title;

          if (foundPage) {
            // Update an existing page
            const updates = [
              {
                _id: foundPage.id,
                name: result.title,
                text: {
                  content: result.html,
                },
              },
            ];

            await JournalEntryPage.updateDocuments(updates, {
              parent: journal,
            });

            // Update the flag link data
            await foundPage.setFlag(
              GDocJournals.ID,
              GDocJournals.FLAGS.GDOC_LINK,
              gdocLink
            );
          } else {
            // Create a new page
            const page = await JournalEntryPage.createDocuments(
              [
                {
                  name: result.title,
                  text: {
                    content: result.html,
                  },
                },
              ],
              { parent: journal }
            );

            // Update the flag link data
            await page[0].setFlag(
              GDocJournals.ID,
              GDocJournals.FLAGS.GDOC_LINK,
              gdocLink
            );
          }
        });
      }
    }
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.on("click", "[data-action]", this._handleButtonClick.bind(this));
  }
}
