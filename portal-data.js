/* =====================================================================
   BURLINGTON ARCADE — WHAT THE YAEL AND CASSANDRA PAGES LIST

   To add a PDF:
     1. Put the PDF in assets/ (for example assets/clients/tom-ford/).
        Keep it under 25 MB.
     2. Add one line to the right "files" list below:
        { title:"Rendering, white awning", file:"assets/clients/tom-ford/tom-ford-rendering.pdf", date:"July 2026" },
     3. Push from GitHub Desktop.

   The "sent" lines under each client only say what the architects
   delivered, so you know which PDFs belong there.
   ===================================================================== */
window.PORTAL = {

  clients: [
    { slug:"tom-ford", name:"Tom Ford",
      sent:["July 2026: layout plan (LOD) and a rendering with a white awning"],
      files:[] },
    { slug:"ysl", name:"YSL",
      sent:["May to June 2026: layout plans (LOD) for Retail 2 and Retail 3, and a rendering with a white awning",
            "October 2026: Retail 3 plan confirmed for YSL"],
      files:[] },
    { slug:"elyse-walker", name:"Elyse Walker",
      sent:["August 2026: store rendering in the townhouse and an updated townhouse layout plan (LOD)"],
      files:[] },
    { slug:"elie-saab", name:"Elie Saab",
      sent:["October 2026: layout plans (LOD) for Retail 3 and Retail 6, and a rendering in Retail 3"],
      files:[] },
    { slug:"david-webb", name:"David Webb",
      sent:["October 2026: two-floor rendering in the townhouse"],
      files:[] },
    { slug:"revolve", name:"Revolve",
      sent:["October 2026: rendering in the townhouse"],
      files:[] },
    { slug:"miu-miu", name:"Miu Miu",
      sent:["October 2026: rendering in parcel 3"],
      files:[
        { title:"Miu Miu", file:"assets/clients/miu-miu/2026-10-26_miu-miu.pdf", date:"26 October 2026" }
      ] }
  ],

  /* Cassandra > Latest Exports (every PDF we have sent, branded and unbranded). Newest first.
     Yael does not see this list; she gets only the unbranded deck, from "latest" below. */
  exports: [
    { title:"Pitch deck, unbranded, with plans", file:"assets/2026-10-26_Burlington_pitch_deck_unbranded.pdf", view:"deck/", date:"26 October 2026" },
    { title:"Pitch deck, with plans", file:"assets/2026-10-19_Burlington_pitch_deck.pdf", date:"19 October 2026" },
    { title:"Landscaping set (42 pages)", file:"assets/2026-10-13_Burlington_landscaping.pdf", date:"13 October 2026" }
  ],

  /* Yael's two big buttons ("deck" and "floorplan"). Only unbranded files go here.
     When there is a new deck or a floor plan, put the PDF in assets/ and change "file" and "date".
     An empty "file" shows the button as "Coming soon". */
  latest: [
    { key:"floorplan", label:"Latest floor plan", file:"", date:"" },
    { key:"deck", label:"Pitch deck, unbranded, from the architects", note:"Pitch deck, unbranded", file:"assets/2026-10-26_Burlington_pitch_deck_unbranded.pdf", view:"deck/", date:"26 October 2026" }
  ],

  /* The presentation viewer (deck/). It shows the slides as pictures in assets/deck/
     (slide-01.jpg ...), made from the PDF below. For a new deck the slide pictures
     have to be made again, so ask Claude; then change pdf, count and date here. */
  presentation: {
    title:"Pitch deck, unbranded", pdf:"assets/2026-10-26_Burlington_pitch_deck_unbranded.pdf",
    slides:"assets/deck/", count:55, date:"26 October 2026"
  }
};
