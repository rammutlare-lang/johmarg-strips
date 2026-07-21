const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, AlignmentType, PageBreak, Header, Footer,
  PageNumber, VerticalAlign, ImageRun
} = require("docx");

const GOLD = "F5B400";
const GOLD_DARK = "C98E00";
const BLACK = "111111";
const GRAY = "6B6B6B";

const PAGE_WIDTH_DXA = 12240; // US Letter
const MARGIN_DXA = 900;
const CONTENT_WIDTH = PAGE_WIDTH_DXA - MARGIN_DXA * 2; // 10440
const COL_WIDTH = Math.floor(CONTENT_WIDTH / 2); // 2 cards per row

const IMG_DIR = path.join(__dirname, "images");
const IMG_PX = 170; // display size of each product photo, pixels

function catHeading(number, title, count) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 500, after: 120 },
    border: { bottom: { color: GOLD, space: 6, style: BorderStyle.SINGLE, size: 12 } },
    children: [
      new TextRun({ text: `${number}. `, bold: true, color: GOLD_DARK, size: 30 }),
      new TextRun({ text: title, bold: true, color: BLACK, size: 30 }),
      new TextRun({ text: `   (${count} products)`, italics: true, color: GRAY, size: 20 }),
    ],
  });
}

function catIntro(text) {
  return new Paragraph({
    spacing: { after: 220 },
    children: [new TextRun({ text, color: GRAY, size: 21, italics: true })],
  });
}

function productCard(name, desc, materials, imgFile) {
  const imgPath = path.join(IMG_DIR, imgFile);
  const imgBuffer = fs.readFileSync(imgPath);
  return new TableCell({
    width: { size: COL_WIDTH, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "DDDDDD" },
    },
    margins: { top: 160, bottom: 160, left: 160, right: 160 },
    verticalAlign: VerticalAlign.TOP,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [new ImageRun({ type: "jpg", data: imgBuffer, transformation: { width: IMG_PX, height: IMG_PX } })],
      }),
      new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: name, bold: true, color: BLACK, size: 21 })],
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [new TextRun({ text: desc, color: "333333", size: 18 })],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "MATERIALS: ", bold: true, color: GOLD_DARK, size: 15 }),
          new TextRun({ text: materials, color: GRAY, size: 15 }),
        ],
      }),
    ],
  });
}

function productGrid(products) {
  const rows = [];
  for (let i = 0; i < products.length; i += 2) {
    const left = products[i];
    const right = products[i + 1];
    rows.push(new TableRow({
      children: right
        ? [productCard(...left), productCard(...right)]
        : [productCard(...left), new TableCell({
            width: { size: COL_WIDTH, type: WidthType.DXA },
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            children: [new Paragraph({ children: [] })],
          })],
    }));
  }
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [COL_WIDTH, COL_WIDTH],
    rows,
  });
}

// ---------------- PRODUCT DATA: [name, description, materials, imageFile] ----------------

const metalProfiles = [
  ["Straight Edge", "A clean, straight finish and protective edge for all tiling applications.", "Aluminium, Brass, Stainless Steel", "01_straight-edge.jpg"],
  ["Formable Edge", "Accommodates curved flooring areas with decorative, functional edge protection.", "Aluminium, Brass, Stainless Steel", "02_formable-edge.jpg"],
  ["Round Edge", "A semi-round face alternative to Straight Edge for efficient tile protection.", "Aluminium, Brass, Stainless Steel", "03_round-edge.jpg"],
  ["Square Edge", "A versatile trim used vertically or horizontally as a feature strip on walls and floors.", "Aluminium, Brass, Stainless Steel", "04_square-edge.jpg"],
  ["45° Ramp", "Transitions between different floor covering heights while protecting exposed tile edges.", "Aluminium", "05_45-ramp.jpg"],
  ["Tile In Step & Large Tile In Step", "Installed during tiling to protect and finish ceramic stair edges, in two sizes.", "Aluminium", "06_tile-in-step.jpg"],
  ["Retrofit Stair Nosing", "Slip-resistant protection for existing tiled stairs, with optional PVC inserts.", "Aluminium, PVC Insert", "07_retrofit-stair-nosing.jpg"],
  ["Retrofit Ramp", "A post-installation transition profile between differing floor covering heights.", "Aluminium", "08_retrofit-ramp.jpg"],
  ["Large Transition Ramp", "Transitions between floor covering heights across larger, wider areas.", "Aluminium", "09_large-transition-ramp.jpg"],
  ["Tile In Internal Angle", "Creates the opposite effect of a square edge, protecting internal corners.", "Aluminium", "10_tile-in-internal-angle.jpg"],
  ["Listello", "An elegant decorative feature strip for tiled wall coverings, multiple heights and finishes.", "Aluminium, Stainless Steel", "11_listello.jpg"],
  ["Retrofit / Pencil Listello", "A slimline decorative alternative for elegant tiled wall coverings.", "Aluminium", "12_pencil-listello.jpg"],
  ["Mosaic Edge", "Edge protection sized specifically for mosaic tiling applications, wall and floor.", "Polished Silver Aluminium", "13_mosaic-edge.jpg"],
  ["Vari Strip", "A rounded, 28mm carpet-to-tile transition with gripper teeth to hold carpet in place.", "Aluminium", "14_vari-strip.jpg"],
  ["Cover Strip", "A 40mm profile that covers gaps or edges between flooring installations.", "Aluminium", "15_cover-strip.jpg"],
  ["T-Piece", "A 22mm dividing strip between different flooring surfaces, doubling as a protective solution.", "Aluminium", "16_t-piece.jpg"],
  ["Carpet Tile Nosing", "Joins carpet to other flooring types, particularly for staircase transitions.", "Aluminium", "17_carpet-tile-nosing.jpg"],
  ["Carpet Square Edge (Fast Edge)", "Protects the vulnerable edges typical of carpet installations.", "Aluminium", "18_carpet-square-edge.jpg"],
  ["Retro Corner Protector", "Prevents and cosmetically repairs damage on vulnerable external corners.", "Aluminium, Brass, Stainless Steel", "19_retro-corner-protector.jpg"],
  ["Tile In Corner Protector", "Protects external corners of walls and columns as tiling is being installed.", "Aluminium, Brass, Stainless Steel", "20_tile-in-corner-protector.jpg"],
  ["Dividing Strip / Flat Bar / Weather Bar / Skirting", "A functional and decorative strip used to fill gaps and divide flooring.", "Aluminium, Brass, Stainless Steel", "21_dividing-strip.jpg"],
  ["Heavy Duty Movement Joint", "Allows tile panel movement to prevent cracking or lifting, medium to heavy duty.", "Aluminium, Brass, Stainless Steel", "22_heavy-duty-movement-joint.jpg"],
];

const carpetWoodLaminate = [
  ["Wood Edge", "Protects flooring outlines and edges while allowing for natural expansion and contraction.", "Aluminium", "27_wood-edge.jpg"],
  ["Wood End", "Protects the vulnerable end edges of wooden flooring and covers small finishing gaps.", "Aluminium", "28_wood-end.jpg"],
  ["Wood Reducer / Transition", "Transitions between different floor heights and coverings, such as tile to wood.", "Aluminium", "29_wood-reducer.jpg"],
  ["Wood Expansion Cover", "Bridges gaps between hard, smooth finishes installed at the same height.", "Aluminium", "30_wood-expansion-cover.jpg"],
  ["Wood Stair Nosing", "Protects wooden stair edges with a clean, aesthetically pleasing finish.", "Aluminium", "31_wood-stair-nosing.jpg"],
  ["LVT / SPC Transition", "Transitions between laminate/SPC flooring and other floor coverings.", "Aluminium", "32_lvt-transition.jpg"],
  ["LVT / SPC Expansion", "Allows for the expansion and contraction of laminate and SPC flooring.", "Aluminium", "33_lvt-expansion.jpg"],
  ["LVT / SPC Stair Nosing", "Protects laminate and SPC stair edges with a clean, finished look.", "Aluminium", "34_lvt-stair-nosing.jpg"],
  ["Retro 21 x 21 Stair Nosing", "An alternative to standard Retrofit Stair Nosing with grooved corner adherence.", "Aluminium", "35_retro-21x21.jpg"],
  ["Naplock", "Finishes and protects carpet installation edges, with gripper teeth to hold position.", "Aluminium", "36_naplock.jpg"],
  ["Thriftline", "Similar to Naplock with a rounder face design and integrated gripper teeth.", "Aluminium", "37_thriftline.jpg"],
  ["Tread Cover", "A transition profile protecting the edges of vinyl, laminate or carpeted thresholds.", "Aluminium", "38_tread-cover.jpg"],
];

const pvcProfiles = [
  ["PVC Movement Joint", "A lightweight alternative to metal movement joints, preventing tile cracking or lifting.", "Virgin PVC", "23_pvc-movement-joint.jpg"],
  ["PVC Round Edge", "A corner and wall-covering trim available in multiple heights, colours and marble finishes.", "Virgin PVC", "24_pvc-round-edge.jpg"],
  ["PVC Internal Seal Strip", "A rigid, curved seal for horizontal and vertical surfaces installed during tiling.", "Virgin PVC", "25_pvc-internal-seal-strip.jpg"],
  ["PVC Flexible Seal", "A retrofit seal for horizontal and vertical surfaces, installed after tiling is complete.", "Virgin PVC", "26_pvc-flexible-seal.jpg"],
];

const vinylProfiles = [
  ["Vinyl Stair Nosing", "Provides an effective non-slip surface and tread to the edge of steps.", "Vinyl", "41_vinyl-stair-nosing.jpg"],
  ["Vinyl Hospital Skirting", "Installed in the angle between wall and floor for hygienic, hospital-grade finishes.", "Vinyl", "42_vinyl-hospital-skirting.jpg"],
  ["Vinyl Sit On Skirting", "Installed over other profiles, such as the Cove Former, for a finished skirting look.", "Vinyl", "43_vinyl-sit-on-skirting.jpg"],
  ["Vinyl Expansion Joint Cover", "Installed over movement joints to absorb expansion and contraction.", "Vinyl", "44_vinyl-expansion-joint-cover.jpg"],
  ["Vinyl Cove Former", "A base installation profile for sheet flooring and wall applications.", "Vinyl", "45_vinyl-cove-former.jpg"],
  ["Vinyl Capping Strip 16mm", "A sealed, finished edge for vinyl wall cladding and sheeting installations.", "Vinyl", "46_vinyl-capping-16mm.jpg"],
  ["Vinyl Capping Strip 18mm", "A wider sealed, finished edge for vinyl wall cladding and sheeting installations.", "Vinyl", "47_vinyl-capping-18mm.jpg"],
];

const tileSpacers = [
  ["Tile Spacer", "Maintains the desired space between tiles, used vertically or horizontally as required.", "Plastic", "39_tile-spacer.jpg"],
  ["Self-Levelling Tile Spacers", "Maintains correct spacing and levels during installation for a flawless finish.", "Plastic", "40_self-levelling-spacers.jpg"],
];

// ---------------- DOCUMENT ----------------

const pageProps = {
  page: {
    size: { width: PAGE_WIDTH_DXA, height: 15840 },
    margin: { top: MARGIN_DXA, bottom: MARGIN_DXA, left: MARGIN_DXA, right: MARGIN_DXA },
  },
};

const doc = new Document({
  styles: { default: { document: { run: { font: "Calibri", size: 21 } } } },
  sections: [
    {
      properties: pageProps,
      children: [
        new Paragraph({ spacing: { before: 2200 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "JOH", bold: true, size: 72, color: BLACK }),
            new TextRun({ text: "M", bold: true, size: 72, color: GOLD }),
            new TextRun({ text: "ARG", bold: true, size: 72, color: BLACK }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 500 },
          children: [new TextRun({ text: "S T R I P S", bold: true, size: 28, color: GOLD_DARK, characterSpacing: 40 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { color: GOLD, space: 10, style: BorderStyle.SINGLE, size: 16 }, bottom: { color: GOLD, space: 10, style: BorderStyle.SINGLE, size: 16 } },
          spacing: { before: 300, after: 300 },
          children: [new TextRun({ text: "PRODUCT CATALOGUE", bold: true, size: 44, color: BLACK })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          children: [new TextRun({ text: "Finishing Touches. Lasting Impression.", italics: true, size: 24, color: GRAY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 800 },
          children: [new TextRun({ text: "47 Products  |  5 Ranges  |  Aluminium · Brass · Stainless Steel · PVC · Vinyl", size: 20, color: GRAY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 3200 },
          children: [new TextRun({ text: "trims@johmargstrips.co.za   |   +27 83 324 0532", size: 19, color: GRAY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Edition: July 2026", size: 18, color: GRAY, italics: true })],
        }),
        new Paragraph({ children: [new PageBreak()] }),
      ],
    },
    {
      properties: pageProps,
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: { bottom: { color: "CCCCCC", space: 4, style: BorderStyle.SINGLE, size: 4 } },
            children: [new TextRun({ text: "JOHMARG STRIPS  —  PRODUCT CATALOGUE", size: 16, color: GRAY, bold: true })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Page ", size: 16, color: GRAY }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GRAY }),
              new TextRun({ text: " of ", size: 16, color: GRAY }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: GRAY }),
            ],
          })],
        }),
      },
      children: [
        new Paragraph({
          heading: HeadingLevel.TITLE,
          spacing: { after: 200 },
          children: [new TextRun({ text: "Contents", bold: true, color: BLACK, size: 32 })],
        }),
        ...[
          ["1. Metal Profiles", "22 products"],
          ["2. Carpet, Wood & Laminate Profiles", "12 products"],
          ["3. PVC Profiles", "4 products"],
          ["4. Vinyl Profiles", "7 products"],
          ["5. Tile Spacers", "2 products"],
        ].map(([label, count]) => new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: label, bold: true, size: 22, color: BLACK }),
            new TextRun({ text: `   —   ${count}`, size: 20, color: GRAY, italics: true }),
          ],
        })),
        new Paragraph({
          spacing: { before: 300, after: 0 },
          children: [new TextRun({
            text: "This catalogue lists the complete Johmarg Strips product range across five families of tile trims, edge profiles, stair nosing, movement joints, and flooring transition strips. Materials, finishes and dimensions vary by product — contact our team for full specifications or a project-specific quotation.",
            size: 20, color: GRAY, italics: true,
          })],
        }),
        new Paragraph({ children: [new PageBreak()] }),

        catHeading(1, "Metal Profiles", metalProfiles.length),
        catIntro("Our largest range — edge trims, stair nosing, corner protection, listellos and movement joints manufactured in Aluminium, Brass and Stainless Steel."),
        productGrid(metalProfiles),

        catHeading(2, "Carpet, Wood & Laminate Profiles", carpetWoodLaminate.length),
        catIntro("Transition, edge and stair nosing profiles purpose-built for carpet, solid wood, laminate and LVT/SPC flooring installations."),
        productGrid(carpetWoodLaminate),

        catHeading(3, "PVC Profiles", pvcProfiles.length),
        catIntro("Lightweight, corrosion-resistant alternatives to metal trims — made from certified impact- and UV-resistant, non-toxic, lead-free virgin PVC."),
        productGrid(pvcProfiles),

        catHeading(4, "Vinyl Profiles", vinylProfiles.length),
        catIntro("Non-slip, hygienic and easy-to-clean vinyl profiles suited to healthcare, hospitality and other high-traffic environments."),
        productGrid(vinylProfiles),

        catHeading(5, "Tile Spacers", tileSpacers.length),
        catIntro("Essential installation accessories that keep tile spacing consistent and levels correct across every job."),
        productGrid(tileSpacers),

        new Paragraph({
          spacing: { before: 500 },
          border: { top: { color: GOLD, space: 8, style: BorderStyle.SINGLE, size: 12 } },
          children: [],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          children: [new TextRun({ text: "JOHMARG STRIPS", bold: true, size: 24, color: BLACK })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "trims@johmargstrips.co.za   |   +27 83 324 0532   |   Currently operating online", size: 18, color: GRAY })],
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(path.join(__dirname, "Johmarg_Strips_Product_Catalogue.docx"), buffer);
  console.log("done");
});
