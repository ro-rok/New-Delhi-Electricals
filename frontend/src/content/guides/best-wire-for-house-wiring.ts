import type { GuideBody } from '@/lib/guides';

export const bestWireForHouseWiring: GuideBody = {
  slug: 'best-wire-for-house-wiring',
  standfirst: 'For domestic wiring in India the answer is almost always the same product family: single-core, multi-strand copper house wire made to IS 694 in the 1100 V grade, with a flame-retardant insulation grade, sized circuit by circuit. The brand is the last decision you make, not the first — conductor size, insulation grade and buying a genuine ISI-marked product matter far more than the name printed on the coil.',
  sections: [
    {
      id: 'four-decisions',
      heading: 'There is no single “best wire” — there are four decisions',
      blocks: [
        {
          kind: 'p',
          text: 'Most people asking which wire is best for house wiring are really asking four separate questions at once. Separating them makes the answer straightforward, because three of the four have a settled answer for Indian homes and only one is genuinely a matter of preference.',
        },
        {
          kind: 'table',
          caption: 'The four decisions, in the order they actually matter',
          columns: ['Decision', 'Answer for a typical Indian home', 'Room for debate'],
          rows: [
            ['Conductor material', 'Copper, multi-strand, for all internal circuits', 'Very little'],
            ['Conductor size', 'Set circuit by circuit from the load, run length and protective device', 'None — this is design, not preference'],
            ['Insulation grade', 'Flame retardant as a minimum; a low-smoke grade where evacuation is harder', 'Some, and it is a real safety decision'],
            ['Brand', 'Any ISI-marked manufacturer to IS 694, bought from an authorised source', 'This is where preference legitimately lives'],
          ],
          note: 'The two decisions carrying the most safety weight are the two people spend the least time on.',
        },
        {
          kind: 'callout',
          tone: 'safety',
          heading: 'This is a selection guide, not an installation guide',
          body: 'Nothing here tells you how to run, terminate or test a circuit. Wiring work and any testing of a live installation must be carried out by a licensed electrician working to the applicable standards. Use this to specify and buy the right material, then hand it to someone qualified to install it.',
        },
      ],
    },
    {
      id: 'copper-vs-aluminium',
      heading: 'Copper or aluminium for house wiring?',
      blocks: [
        {
          kind: 'p',
          text: 'For circuits inside a home — lights, fans, sockets, geyser and air-conditioner points — the practical answer in India is copper. Copper carries more current for a given cross-section, so the conductor is physically smaller for the same duty, and it behaves better at the screw terminals inside switchboards and distribution boards, which is where domestic wiring problems usually start.',
        },
        {
          kind: 'p',
          text: 'Aluminium conductors are normal on the supply side: service cables, incoming feeders and heavier distribution runs, where the saving on a long run is significant and the terminations are engineered for it. That is a different product from house wire and a different conversation with your contractor.',
        },
        {
          kind: 'p',
          text: 'Every house wire record in our [wires and cables catalogue](/category/wires-cables) is single-core annealed copper with PVC insulation, rated 1100 V. We do not list aluminium house wire, because for the circuits inside a flat there is no good reason to specify it.',
        },
      ],
    },
    {
      id: 'conductor-size',
      heading: 'Conductor size: the decision that is not yours to guess',
      blocks: [
        {
          kind: 'p',
          text: 'Size is quoted in square millimetres of conductor cross-section — 0.75, 1.0, 1.5, 2.5, 4, 6 sq mm and upwards. It is decided by the design current of the circuit, the length of the run, how the cables are grouped and installed, and the rating of the MCB protecting them. A circuit schedule prepared by your electrician or consultant fixes these. A table on a website cannot.',
        },
        {
          kind: 'p',
          text: 'What a table can usefully do is tell you which sizes to expect on that schedule, so you can sanity-check a quotation before you pay for it. These are the sizes that appear repeatedly on domestic circuit schedules in Delhi NCR:',
        },
        {
          kind: 'table',
          caption: 'Sizes commonly seen on Indian domestic circuit schedules — indicative only',
          columns: ['Circuit', 'Size usually seen', 'Why'],
          rows: [
            ['Light and fan points', '1.0 – 1.5 sq mm', 'Low, steady current spread across many points'],
            ['General 6 A socket circuits', '1.5 – 2.5 sq mm', 'Small appliances, several outlets on one circuit'],
            ['16 A power sockets, kitchen appliance points', '2.5 – 4 sq mm', 'Higher continuous current, often over a long run to a kitchen'],
            ['Dedicated geyser and air-conditioner points', '4 sq mm and above', 'High continuous load on a circuit of its own'],
            ['Submains and distribution-board feeds', '6 – 16 sq mm', 'Carries the sum of every circuit behind it'],
            ['Main incomer from the meter', '10 – 35 sq mm', 'Sized against the sanctioned load, not against any one circuit'],
          ],
          note: 'Indicative sizes to help you read a quotation, not a substitute for a circuit design. If a quotation gives you a size well below this band, ask why before accepting it.',
        },
        { kind: 'h3', text: 'What that means for the coils you order' },
        {
          kind: 'p',
          text: 'A whole-flat rewire is normally three or four sizes bought together, not one. The 1.0 and 1.5 sq mm coils cover lighting, 2.5 sq mm covers the socket circuits, and one or two heavier sizes cover the geyser, air-conditioner and submain runs. Ordering all of it as a single requirement is also how you get sensible pricing, because it is quoted as one job rather than as a series of small purchases.',
        },
        {
          kind: 'catalogue',
          heading: 'The house wire sizes in our catalogue right now',
          intro: 'Single-core copper, PVC insulated, 1100 V. Each record below is a separate coil with its own length and current catalogue list price.',
          items: [
            { name: 'Finolex FR 1.0 sq mm, 300 m coil', sku: 'FINO-FR-1.0-300', price: 9250, path: '/finolex/finolex-fr-1-sqmm-300m-house-wire', note: 'Typical lighting-circuit size' },
            { name: 'Finolex FR 1.5 sq mm, 300 m coil', sku: 'FINO-FR-1.5-300', price: 15010, path: '/finolex/finolex-fr-1-5-sqmm-300m-house-wire', note: 'Lighting and lighter socket circuits' },
            { name: 'Finolex FR 2.5 sq mm, 90 m coil', sku: 'FINO-FR-2.5-90', price: 4640, path: '/finolex/finolex-fr-2-5-sqmm-90m-house-wire', note: 'Short coil for one room or a repair' },
            { name: 'Polycab FR-LSH 2.5 sq mm, 300 m coil', sku: 'POLY-FRLSH-2.5-300', price: 29515, path: '/polycab/polycab-frlsh-2-5-sqmm-300m-house-wire', note: 'Socket circuits, low-smoke grade' },
            { name: 'Polycab FR-LSH 4 sq mm, 200 m coil', sku: 'POLY-FRLSH-4-200', price: 30345, path: '/polycab/polycab-frlsh-4-sqmm-200m-house-wire', note: 'Geyser and air-conditioner points' },
            { name: 'Finolex FRLS 10 sq mm, 100 m coil', sku: 'FINO-FRLS-10-100', price: 20385, path: '/finolex/finolex-frls-10-sqmm-100m-house-wire', note: 'Submain and distribution-board feeds' },
          ],
          footnote: 'Current catalogue list prices per coil. What you are quoted depends on the sizes and quantities on your list, so send the whole requirement rather than pricing one coil.',
        },
      ],
    },
    {
      id: 'insulation-grades',
      heading: 'FR, FRLS and FR-LSH: what the insulation grade buys you',
      blocks: [
        {
          kind: 'p',
          text: 'Every house wire has a PVC layer over the copper. The obvious job is electrical — PVC is a good insulator, so it keeps the conductor separated from whatever it touches. The less obvious jobs matter just as much: it protects the copper from moisture and abrasion while the wire is pulled through conduit, it is flexible enough to survive being drawn around bends, and its colour is how an electrician tells line from neutral from earth years later.',
        },
        {
          kind: 'p',
          text: 'Plain PVC also burns, and it produces dense smoke and acidic gas when it does. That is what the grade letters address. They describe how the compound has been modified, and this is the one specification decision on this page where spending more genuinely buys something.',
        },
        {
          kind: 'table',
          caption: 'Flame-retardant grades you will see on Indian house wire',
          columns: ['Grade', 'What is modified', 'Where it is usually specified'],
          rows: [
            ['FR — flame retardant', 'The compound resists ignition and is formulated not to sustain a flame along the run', 'The normal baseline for domestic circuits'],
            ['FRLS / FR-LSH — flame retardant, low smoke (and halogen)', 'Adds reduced smoke density and reduced halogen acid-gas emission during burning', 'High-rise flats, shared corridors and stairwells, offices, hotels, hospitals — anywhere getting people out takes longer'],
            ['HFFR / LSZH — halogen free', 'A different, non-PVC compound that removes halogen from the insulation entirely', 'Specified projects with an explicit halogen-free requirement; not a normal domestic grade'],
          ],
          note: 'Naming is not standardised across manufacturers. Finolex lists FR and FRLS; Polycab lists FR-LSH. Specify the manufacturer’s own grade name alongside the IS number rather than the acronym on its own — that is how you avoid being supplied a grade below the one you priced.',
        },
        { kind: 'h3', text: 'How to decide between them' },
        {
          kind: 'list',
          items: [
            'A ground-floor or low-rise home with straightforward escape routes: FR is the normal specification, and it is what most Delhi NCR domestic schedules are priced on.',
            'A flat in a high-rise, or anywhere the escape route is an internal corridor or a single staircase: the low-smoke grades are worth the difference, because smoke rather than flame is usually what stops people getting out.',
            'A commercial fit-out, hotel, school or healthcare space: check the project specification first. It will normally name the grade, and it may name the standard as well.',
            'Mixing grades across one flat to save money is a false economy. The cost gap on a domestic quantity is small next to the cost of pulling wire through conduit twice.',
          ],
        },
        {
          kind: 'p',
          text: 'Our catalogue carries all three flame-retardant grade names above in copper house wire: [Finolex FR and FRLS](/brand/finolex/wires-cables) and [Polycab FR-LSH](/brand/polycab/wires-cables). If you are not sure which grade your drawing calls for, send us the specification page and we will quote against it.',
        },
      ],
    },
    {
      id: 'brand',
      heading: 'Which company’s wire is best?',
      blocks: [
        {
          kind: 'p',
          text: 'This is the question most people start with, and it is the one with the least at stake — provided you buy a genuine, ISI-marked product from an authorised source. PVC-insulated cable for working voltages up to and including 1100 V is covered by IS 694, and ISI certification against it is mandatory for manufacturers. A wire carrying a valid ISI mark has been certified against the same conductor resistance, insulation thickness, high-voltage and flammability requirements regardless of whose name is on the drum.',
        },
        {
          kind: 'p',
          text: 'So the honest comparison is not “which brand is safer”. It is which manufacturer gives you the grade, the size and the coil length you need at a price you can get quoted today. Those differ more than people expect:',
        },
        {
          kind: 'table',
          caption: 'What actually differs between the house wire ranges we carry',
          columns: ['', 'Finolex', 'Polycab'],
          rows: [
            ['Grades in our catalogue', 'FR (0.75 – 6 sq mm) and FRLS (10 – 35 sq mm)', 'FR-LSH across the whole listed range'],
            ['Size range listed', '0.75 to 35 sq mm', '0.75 to 16 sq mm'],
            ['Coil lengths listed', '90 m, 100 m, 200 m and 300 m', '200 m and 300 m'],
            ['Short-coil option for small jobs', 'Yes — 90 m coils in the smaller sizes', 'Not in the current listing'],
            ['Conductor and insulation', 'Copper, PVC, 1100 V, single core', 'Copper, PVC, 1100 V, single core'],
          ],
          note: 'Based on the records live in our catalogue. This reflects what we carry, not the manufacturers’ full national ranges.',
        },
        { kind: 'h3', text: 'A more useful way to choose' },
        {
          kind: 'list',
          ordered: true,
          items: [
            'Start from the grade your specification or your own risk tolerance requires. If it calls for low smoke, the shortlist is already narrower.',
            'Check that the manufacturer lists every size on your schedule. Buying one size from a second brand because the first is short of it is normal and harmless — there is no compatibility issue between brands.',
            'Match coil length to the job. A single room does not need a 300 m coil, and a full rewire bought in 90 m coils means more joints and more offcuts.',
            'Compare the price quoted for the whole list rather than the price of one coil. Coil lengths differ between sizes and between brands, so a coil-to-coil comparison is not comparing like with like.',
            'Confirm the product is genuine before you accept delivery. See [how to check a Finolex coil is genuine](/guides/genuine-finolex-wire) — the same principles apply to any brand.',
          ],
        },
      ],
    },
    {
      id: 'mistakes',
      heading: 'Five expensive mistakes to avoid',
      blocks: [
        {
          kind: 'list',
          ordered: true,
          items: [
            'Buying a size down to save money. The saving is a few thousand rupees on a flat; the cost is a circuit that runs warm for twenty years and cannot be upgraded without opening the walls again.',
            'Quoting the whole flat on one size. A schedule that is 2.5 sq mm from the lights to the geyser is a sign nobody sized the circuits.',
            'Treating “FR” and “FRLS” as interchangeable words. They are different products at different prices, and it is one of the easiest places for a quotation to quietly drop a grade.',
            'Comparing coil prices instead of comparing requirements. A 90 m coil and a 300 m coil are not comparable line items.',
            'Buying from whoever is cheapest with no invoice and no traceable source. This is the only mistake on the list that can put a counterfeit product inside a wall.',
          ],
        },
        {
          kind: 'callout',
          tone: 'note',
          heading: 'Before you commit quantities',
          body: 'Send us the circuit schedule or the bill of quantities your electrician has prepared. We price it against the sizes, grades and coil lengths we actually carry, and tell you where the schedule asks for something we do not list rather than substituting quietly.',
        },
      ],
    },
  ],
  faqs: [
    {
      question: 'Is 1.5 sq mm or 2.5 sq mm right for house wiring?',
      answer: 'Both, on different circuits. 1.0 to 1.5 sq mm is the usual size for lighting and fan points, and 2.5 sq mm is the usual size for general socket circuits. A geyser or air-conditioner point normally needs more again. The size on any given circuit comes from its design current, run length and protective device, so work from your electrician’s schedule.',
    },
    {
      question: 'Is a more expensive brand of wire safer?',
      answer: 'Not by itself. PVC-insulated cable up to 1100 V is covered by IS 694 and ISI certification against it is mandatory, so a genuine ISI-marked wire from any certified manufacturer has been tested against the same requirements. Price differences usually reflect the insulation grade, the copper content of the size you chose and the coil length — not a safety gap between certified brands.',
    },
    {
      question: 'Do I need FRLS wire in a normal flat?',
      answer: 'It is a judgement call rather than a rule. FR is the normal baseline for domestic circuits. The low-smoke grades are worth specifying where escape from the building is slower — a high-rise flat, an internal corridor, a single staircase — because smoke inhalation rather than flame is usually the danger. If a project specification names a grade, follow the specification.',
    },
    {
      question: 'Can I use wire from two different brands in one house?',
      answer: 'Yes. There is no compatibility issue between ISI-marked house wires from different manufacturers, and it is common to buy one size from a second brand when the first is short of it. Keep the colour coding consistent throughout, and keep the insulation grade consistent within a circuit.',
    },
    {
      question: 'How much wire will a flat need?',
      answer: 'It depends entirely on the point count, the floor plate and how the circuits are grouped, which is why any figure quoted without seeing a plan is a guess. Send the circuit schedule, or just the point count, on WhatsApp and we will work out the coils and quote them.',
    },
  ],
  cta: {
    heading: 'Get your wiring list priced',
    body: 'Send the sizes, grades and quantities from your circuit schedule, or just the point count if the schedule is not ready yet. We reply with current pricing against what we carry.',
    whatsappLabel: 'Send your wiring list on WhatsApp',
    whatsappText: 'Hi! I would like a quotation for house wiring cable. My requirement is:',
    browse: { label: 'Browse wires & cables', path: '/category/wires-cables' },
  },
  sources: [
    { label: 'IS 694 — PVC insulated cables for working voltages up to and including 1100 V (Bureau of Indian Standards)', url: 'https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/standard_review/isdetails/MzQ2Nzk' },
    { label: 'Finolex Cables — wires and cables product range', url: 'https://www.finolex.com/ProductPage/Cat/Wires-and-cables' },
    { label: 'Polycab — house wires', url: 'https://polycab.com/products/wires/' },
  ],
  related: ['genuine-finolex-wire', 'how-to-choose-mcb-for-home'],
};

export default bestWireForHouseWiring;
