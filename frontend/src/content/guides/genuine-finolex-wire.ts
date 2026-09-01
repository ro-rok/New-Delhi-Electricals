import type { GuideBody } from '@/lib/guides';

export const genuineFinolexWire: GuideBody = {
  slug: 'genuine-finolex-wire',
  standfirst: 'The checks worth relying on are documentary, not visual. Three of them actually verify something: buy from an authorised dealer and keep a GST invoice that names the exact product, look up the BIS licence number printed on the product in the Bureau of Indian Standards’ own database using the free BIS CARE app, and use Finolex’s own product-check portal. Everything else — how the print looks, how the packaging feels, whether there is a hologram — is a weak signal, because appearance is the first thing anyone copying a product gets right.',
  sections: [
    {
      id: 'why-visual-fails',
      heading: 'Why “how to spot a fake by looking at it” is bad advice',
      blocks: [
        {
          kind: 'p',
          text: 'Most advice on identifying original wire is a list of things to look at: the sharpness of the printing, the feel of the insulation, the finish of the label, the presence of a hologram. The problem is structural. Every one of those is a surface feature, and surface features are exactly what someone producing a counterfeit invests in first, because that is what the buyer inspects.',
        },
        {
          kind: 'p',
          text: 'Worse, the visual checks give false confidence in both directions. A genuine coil that has been sitting in a warm godown for a year can look tired. A convincing copy can look immaculate. If your confidence rests on appearance, you have no way to tell those two apart.',
        },
        {
          kind: 'p',
          text: 'What cannot be reproduced is an entry in someone else’s database. That is the principle behind the three checks below: each one asks an independent party — the Bureau of Indian Standards, the manufacturer, or the tax record behind your invoice — to confirm the product, rather than asking you to judge it by eye.',
        },
      ],
    },
    {
      id: 'check-purchase',
      heading: 'Check 1: where it came from, on paper',
      blocks: [
        {
          kind: 'p',
          text: 'This is the least exciting check and by some distance the most effective. A counterfeit product has to enter the supply chain somewhere, and it almost never enters through a channel that produces a complete paper trail back to the manufacturer.',
        },
        {
          kind: 'list',
          items: [
            'Buy from an authorised dealer for the brand. Authorisation is a relationship with the manufacturer, and it is checkable — ask, and check against the manufacturer’s own dealer listing.',
            'Insist on a GST invoice that names the exact product: brand, grade, conductor size, coil length. “Wire — 1 coil” on a slip of paper protects nobody.',
            'Keep the invoice. If a product ever has to be raised with the manufacturer, an invoice naming the exact SKU from an authorised seller is what makes that conversation possible. Without it there is nothing to investigate.',
            'Be careful about a price well below the market. There are legitimate reasons a price is lower — bulk, an old price list, a clearing stock line — but every one of them has an explanation the seller can give you. If there is no explanation, that is the signal.',
          ],
        },
        {
          kind: 'callout',
          tone: 'note',
          heading: 'Where we stand on this',
          body: 'New Delhi Electricals is an authorised dealer, and every Finolex record in our catalogue is a genuine branded product supplied against a GST invoice that names the exact SKU, grade, size and coil length. That is the check you are entitled to expect from any seller, and it is the one worth asking for before you order.',
        },
      ],
    },
    {
      id: 'check-bis',
      heading: 'Check 2: verify the BIS licence in the official database',
      blocks: [
        {
          kind: 'p',
          text: 'PVC-insulated cable for working voltages up to and including 1100 V is covered by IS 694, and ISI certification against it is mandatory for manufacturers. So a genuine coil carries the ISI mark together with the manufacturer’s BIS licence number, in the format CM/L-xxxxxxx.',
        },
        {
          kind: 'p',
          text: 'That number is not decoration. It resolves to a live record in the Bureau of Indian Standards’ own database, and anyone can look it up free from a phone at the point of purchase.',
        },
        {
          kind: 'list',
          ordered: true,
          items: [
            'Find the ISI mark and the CM/L number printed on the coil label or on the product.',
            'Install the free BIS CARE app published by the Bureau of Indian Standards, and open “Verify Licence Details”.',
            'Enter the CM/L number exactly as printed.',
            'Check what comes back: the licensee’s name and address, the standard covered, the brands included in the scope, the product varieties, and whether the licence is currently valid.',
            'Compare that against the coil in front of you. The manufacturer name, the brand and the product type all have to match, and the licence has to be live.',
          ],
        },
        {
          kind: 'table',
          caption: 'How to read the result',
          columns: ['What the lookup shows', 'What it means'],
          rows: [
            ['Valid licence, licensee and brand match the coil', 'The strongest single confirmation available to a buyer'],
            ['Number returns nothing', 'Re-enter it carefully first. If it still returns nothing, stop and raise it with the seller before the product goes anywhere near an installation'],
            ['Licence is valid but the brand or product scope does not match', 'A real licence number does not automatically cover the product in your hand. Treat a mismatch as unresolved'],
            ['No ISI mark or no licence number on the product at all', 'For a product where ISI certification is mandatory, this is not a grey area'],
          ],
        },
        {
          kind: 'p',
          text: 'This check works for any ISI-marked wire, not only Finolex. It is the most useful habit a contractor or a homeowner can pick up, because it takes under a minute and it does not depend on trusting anyone in the chain.',
        },
      ],
    },
    {
      id: 'check-finolex',
      heading: 'Check 3: Finolex’s own product check',
      blocks: [
        {
          kind: 'p',
          text: 'Finolex runs a verification portal of its own at check.finolex.com, titled “True Product Checker”. It is a manufacturer-run check, so it queries Finolex’s own records rather than the certification database, which makes it a useful second and independent confirmation alongside the BIS lookup.',
        },
        {
          kind: 'p',
          text: 'The portal works one way only: it opens your phone camera and reads a QR code. There is no field to type a code into, no SMS number and no scratch panel to reveal — if you are being asked to do any of those for a Finolex product, that is not this check. The portal itself carries one instruction before the camera opens, and it is worth following literally: scan only the external QR code.',
        },
        {
          kind: 'p',
          text: 'A code Finolex recognises returns a message thanking you for buying a genuine Finolex product. A code it does not recognise returns an explicit rejection rather than a blank screen, so a failed scan is unambiguous. Treat that rejection the way you would treat a failed BIS lookup: raise it with the seller before the wire is installed, not after.',
        },
        {
          kind: 'callout',
          tone: 'note',
          heading: 'Where the code sits, and what a failed scan does not prove',
          body: 'Finolex does not publish which part of a house-wire coil carries the scannable code, and it varies by pack, so follow the verification instructions printed on the product you actually received rather than hunting for a code in a fixed place. A scan that returns nothing is a reason to stop and ask the seller — it is not by itself proof of a counterfeit, because packaging is damaged and codes are already scanned in ordinary handling. The BIS licence lookup in check 2 remains the check that stands on its own.',
        },
        {
          kind: 'callout',
          tone: 'note',
          heading: 'A note on holograms and scratch codes',
          body: 'Anti-counterfeit features change without notice, and describing a feature that has since been retired is worse than describing none — it teaches people to look for the wrong thing. Confirm the current feature with the manufacturer or an authorised dealer rather than relying on an article, this one included.',
        },
      ],
    },
    {
      id: 'what-labelling-says',
      heading: 'What the labelling on a genuine coil tells you',
      blocks: [
        {
          kind: 'p',
          text: 'Beyond authenticity, the printed information on the coil is how you confirm you were supplied the product you paid for — which, in practice, is the substitution people actually encounter. Read it against your invoice line by line.',
        },
        {
          kind: 'table',
          caption: 'Read these five things off the coil and match them to the invoice',
          columns: ['On the coil', 'What to check'],
          rows: [
            ['Flame-retardant grade', 'FR and FRLS are different products at different prices. This is the easiest thing for a quotation to quietly downgrade'],
            ['Conductor size in sq mm', 'Must match the circuit schedule, not just the invoice'],
            ['Coil length in metres', 'Our Finolex records come in 90 m, 100 m, 200 m and 300 m coils. Check you were billed for the length you received'],
            ['Voltage grade', 'House wire in this range is 1100 V'],
            ['Standard and ISI mark', 'IS 694, with the CM/L licence number for the lookup in check 2'],
          ],
          note: 'A mismatch here is usually a supply error rather than a counterfeit, but it costs exactly as much to fix once the wire is inside a wall.',
        },
        {
          kind: 'catalogue',
          heading: 'The Finolex house wire we carry',
          intro: 'Single-core copper, PVC insulated, 1100 V, in two flame-retardant grades. Each coil length is a separate catalogue record.',
          items: [
            { name: 'Finolex FR 1.5 sq mm, 90 m coil', sku: 'FINO-FR-1.5-90', price: 2870, path: '/finolex/finolex-fr-1-5-sqmm-90m-house-wire', note: 'Short coil for one room or a repair' },
            { name: 'Finolex FR 1.5 sq mm, 300 m coil', sku: 'FINO-FR-1.5-300', price: 15010, path: '/finolex/finolex-fr-1-5-sqmm-300m-house-wire', note: 'Lighting circuits on a full rewire' },
            { name: 'Finolex FR 2.5 sq mm, 300 m coil', sku: 'FINO-FR-2.5-300', price: 15515, path: '/finolex/finolex-fr-2-5-sqmm-300m-house-wire', note: 'General socket circuits' },
            { name: 'Finolex FR 4 sq mm, 200 m coil', sku: 'FINO-FR-4-200', price: 23355, path: '/finolex/finolex-fr-4-sqmm-200m-house-wire', note: 'Geyser and air-conditioner points' },
            { name: 'Finolex FRLS 10 sq mm, 100 m coil', sku: 'FINO-FRLS-10-100', price: 20385, path: '/finolex/finolex-frls-10-sqmm-100m-house-wire', note: 'Low-smoke grade, submain runs' },
            { name: 'Finolex FRLS 25 sq mm, 100 m coil', sku: 'FINO-FRLS-25-100', price: 50365, path: '/finolex/finolex-frls-25-sqmm-100m-house-wire', note: 'Heavy feeds and incomers' },
          ],
          footnote: 'Current catalogue list prices per coil. See the full range on our [Finolex wires and cables page](/brand/finolex/wires-cables).',
        },
      ],
    },
    {
      id: 'if-in-doubt',
      heading: 'If you think something is wrong',
      blocks: [
        {
          kind: 'list',
          ordered: true,
          items: [
            'Do not install it. Once wire is drawn through conduit, the cost of the doubt multiplies.',
            'Photograph the coil, the label, the printed markings and the invoice together, before anything is opened further.',
            'Raise it with the seller first and in writing. A legitimate seller can trace the coil back through their own purchase record.',
            'Contact the manufacturer with the invoice and the photographs. This is why check 1 matters: without a traceable invoice there is nothing for anyone to investigate.',
            'If the product is genuine but is not what you ordered — a grade or a length short of the invoice — that is a supply dispute, and it is resolved the same way, with the same photographs.',
          ],
        },
        {
          kind: 'callout',
          tone: 'safety',
          heading: 'Do not test a suspect product yourself',
          body: 'Assessing whether a cable is fit for use is not something to attempt with household tools or by energising it to see what happens. If a product’s provenance is unresolved, keep it out of the installation and let the seller, the manufacturer or a qualified electrician deal with it.',
        },
      ],
    },
  ],
  faqs: [
    {
      question: 'How can I tell if Finolex wire is original?',
      answer: 'Use checks that can be independently verified rather than judging by appearance. Look up the CM/L licence number printed alongside the ISI mark in the Bureau of Indian Standards’ BIS CARE app and confirm the licensee, brand and scope match the coil; scan the QR code on the label through Finolex’s product-check portal; and buy from an authorised dealer against a GST invoice naming the exact grade, size and coil length.',
    },
    {
      question: 'Does a hologram prove a wire is genuine?',
      answer: 'Not on its own. Surface features are the first thing a counterfeit reproduces, and manufacturers change them without announcement, so an absent hologram may mean nothing and a present one proves little. Use it as a supporting signal at most, behind the BIS licence lookup and the purchase record.',
    },
    {
      question: 'What is the CM/L number on the coil?',
      answer: 'It is the manufacturer’s BIS licence number for the ISI certification, in the format CM/L-xxxxxxx. Entering it in the free BIS CARE app returns the licensee’s name and address, the standard, the brands and varieties covered by the licence, and whether it is currently valid.',
    },
    {
      question: 'Is cheaper Finolex wire always fake?',
      answer: 'No. Bulk quantities, an older price list and stock being cleared are all ordinary reasons for a lower price, and each has an explanation the seller can give you. The signal is not the price by itself — it is a price with no explanation behind it, and no invoice naming the exact product.',
    },
    {
      question: 'Do these checks work for other brands?',
      answer: 'The BIS licence lookup and the invoice check apply to any ISI-marked wire, and PVC-insulated cable up to 1100 V is certified under IS 694 regardless of the manufacturer. Only the manufacturer’s own verification portal is brand specific.',
    },
  ],
  cta: {
    heading: 'Buying Finolex wire in Delhi NCR',
    body: 'Send the grades, sizes, coil lengths and quantities you need. We quote from current catalogue pricing and supply against a GST invoice naming the exact product.',
    whatsappLabel: 'Get Finolex wire pricing on WhatsApp',
    whatsappText: 'Hi! I would like a quotation for Finolex wires and cables. My requirement is:',
    browse: { label: 'Browse Finolex wires & cables', path: '/brand/finolex/wires-cables' },
  },
  sources: [
    { label: 'BIS CARE app — Bureau of Indian Standards', url: 'https://www.services.bis.gov.in/php/BIS_2.0/BISBlog/bis-care-app/' },
    { label: 'IS 694 — PVC insulated cables for working voltages up to and including 1100 V', url: 'https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/standard_review/isdetails/MzQ2Nzk' },
    { label: 'Finolex “True Product Checker” — the manufacturer’s own product verification portal', url: 'https://check.finolex.com/' },
    { label: 'Finolex Cables — wires and cables product range', url: 'https://www.finolex.com/ProductPage/Cat/Wires-and-cables' },
  ],
  related: ['best-wire-for-house-wiring'],
};

export default genuineFinolexWire;
