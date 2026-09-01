import type { GuideBody } from '@/lib/guides';

export const mcbVsMccb: GuideBody = {
  slug: 'mcb-vs-mccb',
  standfirst: 'Both are circuit breakers that disconnect a circuit on overload and short circuit. An MCB — miniature circuit breaker — is a small DIN-rail device with fixed trip settings, used on the final circuits and submains of homes and light commercial installations. An MCCB — moulded case circuit breaker — is a larger device with a much higher current and fault-breaking capability and, usually, adjustable trip settings, used at the main incomer and on distribution boards feeding heavy loads. If you are wiring a flat or a floor, you need MCBs. MCCBs turn up further upstream, where the building supply is switched.',
  sections: [
    {
      id: 'comparison',
      heading: 'The comparison in one table',
      blocks: [
        {
          kind: 'table',
          caption: 'MCB and MCCB side by side',
          columns: ['', 'MCB', 'MCCB'],
          rows: [
            ['Full name', 'Miniature circuit breaker', 'Moulded case circuit breaker'],
            ['Product standard', 'IS/IEC 60898-1 for household and similar installations', 'IEC 60947-2 for industrial switchgear'],
            ['Typical current ratings', 'A few amps up to around 125 A', 'Around 16 A up to 2500 A and beyond'],
            ['Fault-breaking capacity', 'Commonly in the 6 – 10 kA range', 'Far higher, and selected against the fault level at that point'],
            ['Trip settings', 'Fixed by the manufacturer — you choose them by choosing the device', 'Usually adjustable, thermal and often magnetic'],
            ['Mounting', 'Snaps onto DIN rail, sized in modules', 'Bolted or plugged into a panel, much larger'],
            ['Poles', 'Single, double, triple and four pole', 'Usually triple or four pole'],
            ['Where it belongs', 'Final circuits and submains in homes, shops and offices', 'Main incomers, heavy feeders, industrial panels'],
          ],
        },
        {
          kind: 'callout',
          tone: 'safety',
          heading: 'Selection guidance only',
          body: 'This page helps you understand and specify a device. It is not installation guidance. Selecting a breaker against the actual fault level at a point in an installation, and installing or changing anything inside a distribution board, is work for a licensed electrician or a qualified electrical consultant.',
        },
      ],
    },
    {
      id: 'same-job',
      heading: 'What they have in common',
      blocks: [
        {
          kind: 'p',
          text: 'Both devices do the same two jobs, and it is worth being precise about them because a lot of confusion downstream comes from being vague here.',
        },
        {
          kind: 'list',
          items: [
            'Overload protection. A current somewhat above the rating, sustained for a while — too many appliances on one circuit, a motor working harder than it should. A bimetallic strip heats, bends and trips the mechanism. This is deliberately slow, because a brief overload is normal and tripping on it would be useless.',
            'Short-circuit protection. A very large current, effectively instantly — line touching neutral, or a fault to earth on the phase conductor. An electromagnetic element trips the mechanism in a fraction of a cycle.',
          ],
        },
        {
          kind: 'p',
          text: 'Neither device protects a person against electric shock. Both are there to protect the cable and the installation from current the cable was not sized to carry. Shock and earth-leakage protection is a separate device — see [what an RCCB does and how it works](/guides/rccb-explained).',
        },
      ],
    },
    {
      id: 'real-difference',
      heading: 'The real dividing line: fault-breaking capacity',
      blocks: [
        {
          kind: 'p',
          text: 'People usually describe the difference as “MCCBs handle more current”, and that is true but incomplete. The parameter that actually decides which family you are in is breaking capacity — the largest fault current the device can interrupt safely and still be a working device afterwards.',
        },
        {
          kind: 'p',
          text: 'Prospective fault current is highest close to the transformer and falls as you move down through the installation, because every metre of cable adds impedance. So the incoming panel of a building sees a fault level that a domestic-scale device is not built to interrupt, while the distribution board inside a flat, several runs downstream, sees a fraction of it. That is the physical reason the two device families exist, and it is why swapping one for the other is not a matter of taste.',
        },
        { kind: 'h3', text: 'Fixed versus adjustable trip settings' },
        {
          kind: 'p',
          text: 'The second real difference follows from where each device sits. An MCB has fixed characteristics: you select the behaviour you want by selecting the rating and the trip curve, and once it is on the rail it does what it does. That is exactly right for a final circuit, where the load is known and rarely changes.',
        },
        {
          kind: 'p',
          text: 'An MCCB usually has an adjustable thermal setting, and often an adjustable magnetic setting too. That matters upstream, where the same frame size has to be tuned to a particular feeder and coordinated with the devices below it so that a fault trips the nearest breaker rather than the main one — discrimination, in the trade. Adjustability is a commissioning tool for an engineer, not a convenience feature.',
        },
      ],
    },
    {
      id: 'trip-curves',
      heading: 'Trip curves: B, C and D',
      blocks: [
        {
          kind: 'p',
          text: 'MCBs are sold by curve as well as by rating. The curve describes how much inrush the magnetic element tolerates before it treats the current as a short circuit rather than a starting surge.',
        },
        {
          kind: 'table',
          caption: 'What the MCB curve letter means',
          columns: ['Curve', 'Tolerates', 'Typical use'],
          rows: [
            ['B', 'Least inrush', 'Resistive loads — lighting, heating, long cable runs'],
            ['C', 'Moderate inrush', 'The general-purpose domestic and commercial curve: mixed sockets, motors, air conditioners'],
            ['D', 'Highest inrush', 'Heavy inductive starting loads — transformers, large motors, welding sets'],
          ],
          note: 'The MCBs listed in our [circuit protection catalogue](/category/circuit-protection) are C curve, which is the curve most Indian domestic and light-commercial schedules are written around.',
        },
        {
          kind: 'p',
          text: 'A device that keeps tripping when an appliance starts is often a curve problem rather than a rating problem, and going up a rating to stop nuisance tripping is the wrong fix — it leaves the cable protected at a level it was not sized for. That is a conversation to have with your electrician before you change anything.',
        },
      ],
    },
    {
      id: 'where-each-goes',
      heading: 'Where each one appears in a real installation',
      blocks: [
        {
          kind: 'p',
          text: 'Walk down a typical Delhi NCR residential building and the two families sort themselves out quite clearly.',
        },
        {
          kind: 'table',
          caption: 'A typical residential building, from the supply inward',
          columns: ['Point in the installation', 'What is usually there'],
          rows: [
            ['Building main panel after the supply', 'MCCB, sized against the sanctioned load and the fault level at that point'],
            ['Riser or floor distribution', 'MCCB or a high-rated MCB, depending on the load and the design'],
            ['Flat distribution board incomer', 'Isolator or main switch, frequently with an RCCB behind it'],
            ['Final circuits inside the flat', 'MCBs, one per circuit, or RCBOs where each circuit needs its own earth-leakage protection'],
          ],
          note: 'This is the usual pattern, not a rule. The actual design belongs to whoever prepared the single-line diagram for the building.',
        },
        {
          kind: 'p',
          text: 'The practical consequence for most people reading this: if you are buying for a home, a shop or a small office fit-out, everything on your list is an MCB, an RCCB, an RCBO or an isolator. An MCCB usually enters the conversation only when you are dealing with the building supply, a commercial panel or a genset changeover.',
        },
        {
          kind: 'catalogue',
          heading: 'What we carry in the MCB range',
          intro: 'Lauritz Knudsen Tripper series, C curve, in single, double, triple and four pole. Ratings run from 6 A to 63 A.',
          items: [
            { name: 'MCB 6 A C curve, single pole', sku: 'BA10060C', price: 226, path: '/lauritz-knudsen/miniature-circuit-breaker-6a-c-curve-single-pole', note: 'Lighting circuits' },
            { name: 'MCB 16 A C curve, single pole', sku: 'BA10160C', price: 226, path: '/lauritz-knudsen/miniature-circuit-breaker-16a-c-curve-single-pole', note: 'Socket and appliance circuits' },
            { name: 'MCB 20 A C curve, double pole', sku: 'BA20200C', price: 790, path: '/lauritz-knudsen/miniature-circuit-breaker-20a-c-curve-double-pole', note: 'Dedicated appliance points' },
            { name: 'MCB 40 A C curve, double pole', sku: 'BA20400C', price: 1165, path: '/lauritz-knudsen/miniature-circuit-breaker-40a-c-curve-double-pole', note: 'Board incomers and heavier feeds' },
            { name: 'MCB 63 A C curve, four pole', sku: 'BA40630C', price: 2450, path: '/lauritz-knudsen/miniature-circuit-breaker-63a-c-curve-four-pole', note: 'The top of the MCB range we list' },
            { name: 'Isolator 100 A, four pole', sku: 'BE410000', price: 1415, path: '/lauritz-knudsen/isolator-100a-four-pole', note: 'Switching without overload protection' },
          ],
          footnote: 'Current catalogue list prices. Our circuit-protection listing covers MCBs, RCCBs, RCBOs, isolators and changeover devices; it does not currently include moulded case circuit breakers. If your design calls for an MCCB, send us the specification and we will tell you what can be supplied against it.',
        },
      ],
    },
    {
      id: 'what-to-specify',
      heading: 'What to have ready when you enquire',
      blocks: [
        {
          kind: 'p',
          text: 'Whichever family you need, a quotation is only as good as the information behind it. Five things turn a vague enquiry into a priced list:',
        },
        {
          kind: 'list',
          ordered: true,
          items: [
            'Current rating in amps, per device.',
            'Number of poles — single, double, triple or four.',
            'Trip curve, for MCBs. If nobody has specified one, C is the usual domestic and light-commercial default.',
            'Breaking capacity, if the design states one. If it does, do not treat it as optional.',
            'Quantity per line, and whether the devices have to share a board with existing equipment.',
          ],
        },
        {
          kind: 'callout',
          tone: 'note',
          heading: 'Send the board schedule, not a shopping list',
          body: 'If your electrician or consultant has produced a distribution-board schedule or a single-line diagram, send that instead. It carries the ratings, poles, curves and quantities together, and it lets us price the whole board in one reply.',
        },
      ],
    },
  ],
  faqs: [
    {
      question: 'Can an MCCB be used instead of an MCB in a house?',
      answer: 'It is the wrong tool rather than a dangerous one. An MCCB is physically much larger, does not fit a domestic DIN-rail board, costs considerably more, and its adjustable settings offer nothing useful on a final circuit whose load is already known. Domestic boards are built around MCBs, RCCBs and RCBOs.',
    },
    {
      question: 'Can an MCB replace an MCCB at a main incomer?',
      answer: 'Not on your own judgement. The incomer has to interrupt the fault current available at that point in the installation, and that figure comes from the design, not from the load. Substituting a smaller device there is exactly the substitution the two product families exist to prevent. Ask the consultant who specified it.',
    },
    {
      question: 'Which is better, MCB or MCCB?',
      answer: 'Neither. They occupy different positions in an installation, and each is the wrong device in the other one’s position. The useful question is what the design at that point calls for.',
    },
    {
      question: 'Do MCBs protect against electric shock?',
      answer: 'No. An MCB reacts to overload and short circuit — current the cable was not sized to carry. It cannot detect the small leakage current that flows through a person. That needs a residual current device: an RCCB, or an RCBO which combines both functions in one unit. See [our RCCB guide](/guides/rccb-explained).',
    },
    {
      question: 'What does the C on my MCB mean?',
      answer: 'It is the trip curve — how much brief starting surge the device tolerates before treating the current as a short circuit. C is the general-purpose curve for mixed domestic and light-commercial loads including motors and air conditioners. B is for resistive loads, D for heavy inductive starting loads.',
    },
  ],
  cta: {
    heading: 'Price your distribution board',
    body: 'Send the board schedule or the list of ratings, poles and quantities you need. We reply with current pricing on what we carry, and tell you plainly where a line falls outside it.',
    whatsappLabel: 'Send your board schedule on WhatsApp',
    whatsappText: 'Hi! I would like a quotation for circuit protection devices. My requirement is:',
    browse: { label: 'Browse circuit protection', path: '/category/circuit-protection' },
  },
  sources: [
    { label: 'IEC 60898-1:2015 — Circuit-breakers for overcurrent protection for household and similar installations', url: 'https://webstore.iec.ch/en/publication/21972' },
    { label: 'IEC 60947-2:2016 — Low-voltage switchgear and controlgear: circuit-breakers', url: 'https://webstore.iec.ch/en/publication/25040' },
    { label: 'Lauritz Knudsen — MCB and MCCB product information', url: 'https://www.lk-ea.com/' },
  ],
  related: ['how-to-choose-mcb-for-home', 'rccb-explained'],
};

export default mcbVsMccb;
