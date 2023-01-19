export class GDocLink {
  constructor(link = "", title = "", id = new Date().getTime().toString()) {
    this.id = id;
    this.link = link;
    this.title = title;
  }
}
