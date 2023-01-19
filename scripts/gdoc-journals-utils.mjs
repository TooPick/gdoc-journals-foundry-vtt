import { GDocJournals } from "./gdoc-journals.mjs";
import config from "../config.mjs";

export class GDocJournalsUtils {
  /**
   * Call the api to get the gdoc and convert it to html
   */
  static async getGDocHtml(link) {
    const response = await fetch(config.API_ENDPOINT + "?url=" + link, {
      method: "GET",
    });
    return await response.json();
  }

  /**
   * Retrieve existing links in pages of the journal given
   */
  static getAllPageLinks(journalSheetId) {
    const journal = game.journal.get(journalSheetId);
    const gdocLinks = [];
    if (journal !== undefined) {
      journal.pages.forEach((page) => {
        const link = page.getFlag(
          GDocJournals.ID,
          GDocJournals.FLAGS.GDOC_LINK
        );
        if (link !== undefined) {
          gdocLinks.push(link);
        }
      });
    }

    return gdocLinks;
  }

  /**
   * Remove pages with link flag if the link was deleted
   */
  static async removeUnusedPagesLinks(journalSheetId, currentLinks) {
    const journal = game.journal.get(journalSheetId);
    journal.pages.forEach(async (page) => {
      const link = page.getFlag(GDocJournals.ID, GDocJournals.FLAGS.GDOC_LINK);

      if (link) {
        const found = currentLinks.find((val) => val.id === link.id);
        if (found === undefined) {
          await JournalEntryPage.deleteDocuments([page.id], {
            parent: journal,
          });
        }
      }
    });
  }

  /**
   * Find the page associated to the given link
   */
  static findJournalPageWithLink(journalSheetId, gdocLink) {
    const journal = game.journal.get(journalSheetId);
    let found = null;
    journal.pages.forEach(async (page) => {
      const link = page.getFlag(GDocJournals.ID, GDocJournals.FLAGS.GDOC_LINK);

      if (link.id === gdocLink.id) {
        found = page;
        return;
      }
    });

    return found;
  }
}
