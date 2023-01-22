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
   * Retrieve existing pages of the journal given with a link associated
   */
  static getAllPageWithLinks(journalSheetId) {
    const journal = game.journal.get(journalSheetId);
    const pages = [];
    if (journal !== undefined) {
      journal.pages.forEach((page) => {
        const link = page.getFlag(
          GDocJournals.ID,
          GDocJournals.FLAGS.GDOC_LINK
        );
        if (link !== undefined) {
          pages.push(page);
        }
      });
    }

    return pages;
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

      if (link && link.id === gdocLink.id) {
        found = page;
        return;
      }
    });

    return found;
  }

  /**
   * Update the page with the gdoc link in flags
   */
  static async updatePage(page) {
    const gdocLink = page.getFlag(
      GDocJournals.ID,
      GDocJournals.FLAGS.GDOC_LINK
    );

    if (gdocLink) {
      // Retrieve the Gdoc html and title
      const result = await GDocJournalsUtils.getGDocHtml(gdocLink.link);
      gdocLink.title = result.title;

      // Update an existing page
      const updates = [
        {
          _id: page.id,
          name: result.title,
          text: {
            content: result.html,
          },
        },
      ];

      await JournalEntryPage.updateDocuments(updates, {
        parent: page.parent,
      });

      // Update the flag link data
      await page.setFlag(
        GDocJournals.ID,
        GDocJournals.FLAGS.GDOC_LINK,
        gdocLink
      );
    }
  }

  /**
   * Find all journals with gdoc links and update them
   */
  static async syncAllJournals() {
    game.journal.forEach(async (journal) => {
      console.log(journal);
      const pages = await GDocJournalsUtils.getAllPageWithLinks(journal.id);
      pages.forEach((page) => {
        GDocJournalsUtils.updatePage(page);
      });
    });
  }
}
