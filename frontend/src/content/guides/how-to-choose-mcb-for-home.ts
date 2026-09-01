import type { GuideBody } from '@/lib/guides';

export const howToChooseMcbForHome: GuideBody = {
  slug: 'how-to-choose-mcb-for-home',
  standfirst: 'You do not choose one MCB for a house — you choose one per circuit. The rating has to sit between two numbers: at or above the design current of what is on the circuit, and at or below the current-carrying capacity of the cable protecting it. For most Indian homes that means a C curve MCB at 6 A for lighting, 16 A for general socket circuits, and 16 to 20 A on a dedicated 1.5 ton air-conditioner point. Because the cable sets the upper limit, an MCB cannot honestly be chosen without knowing what cable is behind it.',
  sections: [
    {
      id: 'the-rule',
      heading: 'The rule that decides everything else',
      blocks: [
        {
          kind: 'p',
          text: 'An MCB is not protecting the appliance. It is protecting the cable. That single fact resolves most of the confusion around choosing one.',
        },
        {
          kind: 'p',
          text: 'A cable of a given size can carry a certain current continuously without overheating, and that figure depends on the size, how the cable is installed, how it is grouped with others and how warm the space is. The MCB sits in front of it to make sure the cable is never asked to carry more than that for long enough to matter. So the rating has to satisfy two conditions at once:',
        },
        {
          kind: 'list',
          items: [
            'At or above the design current of the circuit — otherwise it trips during normal use and everyone learns to ignore it.',
            'At or below the current-carrying capacity of the cable in its actual installed conditions — otherwise the cable can overheat while the MCB sits there perfectly happy.',
          ],
        },
        {
          kind: 'p',
          text: 'The second condition is the one that gets broken. Someone puts a 32 A MCB on a circuit wired in 1.5 sq mm to stop nuisance tripping, and has quietly removed the protection the cable depended on. If you take one thing from this page: [the wire size](/category/wires-cables) and the MCB rating are one decision, not two.',
        },
        {
          kind: 'callout',
          tone: 'safety',
          heading: 'Specification, not installation',
          body: 'This is buying guidance. Working inside a distribution board, changing a device, or testing a live circuit is work for a licensed electrician. If a breaker is tripping repeatedly, that is a fault to be investigated, not a device to be upsized.',
        },
      ],
    },
    {
      id: 'five-steps',
      heading: 'Five steps to a rating',
      blocks: [
        { kind: 'h3', text: '1. Work out what is on the circuit' },
        {
          kind: 'p',
          text: 'Add up the loads the circuit will realistically carry at the same time. Appliance nameplates give either watts or a rated current; at a nominal 230 V single phase, current in amps is roughly watts divided by 230. A 3 kW geyser is therefore around 13 A, and a circuit of general sockets is judged on what actually runs together, not on the theoretical maximum of every outlet at once.',
        },
        { kind: 'h3', text: '2. Find the ceiling the cable sets' },
        {
          kind: 'p',
          text: 'This is the step people skip. The cable already run to that point has a capacity, and the MCB cannot exceed it. If the circuit is being designed now, the two are chosen together — the load sets the cable, the cable sets the ceiling, and the MCB lands between them.',
        },
        { kind: 'h3', text: '3. Pick the nearest standard rating in between' },
        {
          kind: 'p',
          text: 'MCBs come in standard steps. The ratings in our catalogue are 6, 10, 16, 20, 25, 32, 40 and 63 A. Choose the smallest standard rating that clears the design current comfortably, rather than the largest one the cable would tolerate.',
        },
        { kind: 'h3', text: '4. Choose the trip curve' },
        {
          kind: 'p',
          text: 'C curve is the general-purpose choice for Indian homes and covers mixed sockets, motors and air conditioners. B curve suits purely resistive loads such as lighting and heating. D curve is for heavy inductive starting loads and is unusual in a home. The MCBs we carry are C curve. Curve and rating are separate decisions — [see the fuller explanation in our MCB vs MCCB guide](/guides/mcb-vs-mccb).',
        },
        { kind: 'h3', text: '5. Choose the number of poles' },
        {
          kind: 'p',
          text: 'Single pole switches the live conductor only, and is the usual choice for lighting and general socket circuits on a single-phase supply. Double pole switches live and neutral together, which is what you want on a dedicated high-load appliance point — a geyser, an air conditioner — because it isolates the appliance completely. Triple and four pole devices belong on three-phase circuits and board incomers.',
        },
      ],
    },
    {
      id: 'by-circuit',
      heading: 'Typical ratings by circuit',
      blocks: [
        {
          kind: 'table',
          caption: 'What appears on most Indian domestic board schedules — indicative, not prescriptive',
          columns: ['Circuit', 'Usual MCB', 'Poles', 'Notes'],
          rows: [
            ['Lighting and fan points', '6 A, C curve', 'Single pole', 'Several points share one circuit'],
            ['General 6 A socket circuit', '10 – 16 A, C curve', 'Single pole', 'Rating follows the cable size on the circuit'],
            ['16 A power sockets, kitchen appliances', '16 – 20 A, C curve', 'Single or double pole', 'Kitchens often get a circuit of their own'],
            ['Geyser / water heater point', '16 A, C curve (for a 3 kW heater)', 'Double pole', 'Dedicated circuit; double pole so it isolates fully'],
            ['1.5 ton air-conditioner point', '16 – 20 A, C curve', 'Double pole', 'See the section below'],
            ['Distribution board incomer', '40 – 63 A, or an isolator', 'Double or four pole', 'Sized against the board, not any one circuit'],
          ],
          note: 'These are the ratings that recur on domestic schedules. The rating for your circuit comes from its design current and its cable, which is why your electrician’s board schedule beats any table.',
        },
      ],
    },
    {
      id: 'ac-point',
      heading: 'Which MCB for a 1.5 ton AC?',
      blocks: [
        {
          kind: 'p',
          text: 'A 16 A or 20 A C curve MCB, double pole, on a dedicated circuit — that is the answer on most Indian domestic schedules. The reasoning behind it is more useful than the number, because it tells you when the number is wrong.',
        },
        {
          kind: 'p',
          text: 'A 1.5 ton split air conditioner draws somewhere around 7 to 10 A while running, and considerably less than that on an inverter unit at part load. What sets the MCB is not the running current but the brief surge as the compressor starts. That is exactly what the C curve exists for: it tolerates a short starting inrush without treating it as a short circuit, so a correctly rated C curve device does not trip every time the compressor kicks in.',
        },
        {
          kind: 'table',
          caption: 'Air-conditioner points — the pattern, with the caveat that the nameplate wins',
          columns: ['Unit', 'Approximate running current', 'Usually specified'],
          rows: [
            ['1.0 ton split', 'around 5 – 7 A', '16 A C curve, double pole'],
            ['1.5 ton split', 'around 7 – 10 A', '16 A C curve, double pole; 20 A where the unit’s rated current is higher'],
            ['2.0 ton split', 'around 10 – 13 A', '20 A C curve, double pole'],
          ],
          note: 'Read the rated and maximum current from the unit’s nameplate or manual and use those, plus the cable size on the circuit. Tonnage is a cooling rating, not an electrical one, and two 1.5 ton units can differ.',
        },
        {
          kind: 'list',
          items: [
            'Give the air conditioner a dedicated circuit. Sharing it with sockets means one appliance can trip the other, and it makes the rating harder to choose.',
            'Use a double pole device on that circuit so the point can be isolated completely for service.',
            'Check the cable. A 20 A MCB on a circuit wired for less is not a fix for tripping — it removes the protection the cable relies on.',
            'If the unit trips the breaker only on start-up, that is a curve and coordination question. If it trips at random during running, treat it as a fault and have it looked at.',
          ],
        },
      ],
    },
    {
      id: 'mcb-or-rcbo',
      heading: 'MCB, RCBO, or both?',
      blocks: [
        {
          kind: 'p',
          text: 'An MCB handles overload and short circuit. It does not detect earth leakage, which is the fault that matters for shock protection. There are two normal ways to cover both.',
        },
        {
          kind: 'table',
          caption: 'Two ways to build a domestic board',
          columns: ['Arrangement', 'How it behaves', 'Trade-off'],
          rows: [
            ['RCCB at the board, MCBs on each circuit', 'One residual current device covers a group of circuits sitting behind it', 'Cheaper and compact, but an earth fault anywhere in the group takes out every circuit in it'],
            ['RCBO per circuit', 'Each circuit has its own overcurrent and earth-leakage protection in one device', 'Costs more and takes more board space, but a fault only disconnects the circuit that caused it'],
          ],
          note: 'Many boards use both: RCBOs on the circuits where nuisance disconnection is most disruptive, and an RCCB group for the rest.',
        },
        {
          kind: 'p',
          text: 'Our circuit-protection listing carries both. If you are deciding between the two, [our RCCB guide](/guides/rccb-explained) covers what the residual current device is actually detecting and which sensitivity rating applies where.',
        },
        {
          kind: 'catalogue',
          heading: 'MCB ratings we carry',
          intro: 'Lauritz Knudsen Tripper series, C curve. Single, double, triple and four pole across the range.',
          items: [
            { name: 'MCB 6 A C curve, single pole', sku: 'BA10060C', price: 226, path: '/lauritz-knudsen/miniature-circuit-breaker-6a-c-curve-single-pole', note: 'Lighting and fan circuits' },
            { name: 'MCB 10 A C curve, single pole', sku: 'BA10100C', price: 226, path: '/lauritz-knudsen/miniature-circuit-breaker-10a-c-curve-single-pole', note: 'Lighter socket circuits' },
            { name: 'MCB 16 A C curve, single pole', sku: 'BA10160C', price: 226, path: '/lauritz-knudsen/miniature-circuit-breaker-16a-c-curve-single-pole', note: 'General socket circuits' },
            { name: 'MCB 16 A C curve, double pole', sku: 'BA20160C', price: 790, path: '/lauritz-knudsen/miniature-circuit-breaker-16a-c-curve-double-pole', note: 'Geyser and air-conditioner points' },
            { name: 'MCB 20 A C curve, double pole', sku: 'BA20200C', price: 790, path: '/lauritz-knudsen/miniature-circuit-breaker-20a-c-curve-double-pole', note: 'Higher-rated AC and appliance points' },
            { name: 'MCB 40 A C curve, double pole', sku: 'BA20400C', price: 1165, path: '/lauritz-knudsen/miniature-circuit-breaker-40a-c-curve-double-pole', note: 'Board incomers' },
            { name: 'RCBO 16 A 30 mA, double pole', sku: 'AUF3C201603', price: 5405, path: '/lauritz-knudsen/rcbo-16a-30ma-double-pole', note: 'Overcurrent and earth leakage in one device' },
          ],
          footnote: 'Current catalogue list prices per device. Send the full board schedule for a quotation against quantities.',
        },
      ],
    },
    {
      id: 'mistakes',
      heading: 'Where domestic boards usually go wrong',
      blocks: [
        {
          kind: 'list',
          ordered: true,
          items: [
            'Upsizing an MCB to stop nuisance tripping. The trip is information. Removing the protection does not remove the cause.',
            'Choosing the rating before the cable is decided. It is one decision, and doing it in the wrong order means the ceiling is set after the fact.',
            'Putting the air conditioner and the kitchen sockets on the same circuit, then wondering why the rating never feels right.',
            'Single pole devices on dedicated high-load appliance points, so the point cannot be isolated properly for service.',
            'Assuming an MCB provides shock protection. It does not, and an installation with no residual current device anywhere in it has a real gap.',
          ],
        },
        {
          kind: 'callout',
          tone: 'note',
          heading: 'If you have a board schedule, send it',
          body: 'A schedule from your electrician carries the ratings, poles, curves and quantities together. Send it on WhatsApp and we will price the whole board in one reply, and flag anything on it we do not carry rather than substituting quietly.',
        },
      ],
    },
  ],
  faqs: [
    {
      question: 'Which MCB is best for a home?',
      answer: 'There is no single answer, because a home needs several. Lighting circuits are usually 6 A, general socket circuits 10 to 16 A, and dedicated geyser and air-conditioner points 16 to 20 A on a double pole device — all C curve. Each rating has to fit the cable on that circuit, which is why the board schedule matters more than any general recommendation.',
    },
    {
      question: 'Which MCB is required for a 1.5 ton AC?',
      answer: 'A 16 A or 20 A C curve MCB on a double pole device and a dedicated circuit covers most 1.5 ton split units, which draw roughly 7 to 10 A while running. Confirm against the rated and maximum current on the unit’s nameplate and against the cable size, because tonnage is a cooling rating and two 1.5 ton units are not necessarily the same electrical load.',
    },
    {
      question: 'What happens if the MCB rating is too high?',
      answer: 'The cable loses its protection. A fault or overload that the cable cannot survive may not trip the device, so the cable heats up instead. This is the reason upsizing a breaker to stop nuisance tripping is the wrong response.',
    },
    {
      question: 'Single pole or double pole for a geyser?',
      answer: 'Double pole is the usual specification for a dedicated geyser point. It disconnects live and neutral together, so the appliance is fully isolated for service rather than only having the live conductor broken.',
    },
    {
      question: 'Do I need an RCCB as well as MCBs?',
      answer: 'An MCB cannot detect earth leakage, which is the fault involved in electric shock, so an installation with only MCBs has a genuine gap. The two normal arrangements are an RCCB covering a group of circuits, or an RCBO per circuit combining both functions. Which is right depends on the board and how disruptive a group disconnection would be.',
    },
    {
      question: 'Why does my MCB trip only when the AC starts?',
      answer: 'That points at the starting surge rather than the running load — usually a curve or coordination question rather than a rating question. Have your electrician check the curve, the rating and the cable together. Fitting a larger device to make the symptom stop is the wrong fix.',
    },
  ],
  cta: {
    heading: 'Price your distribution board',
    body: 'Send the board schedule, or the list of circuits with their ratings and poles. We reply with current pricing on the MCBs, RCCBs and RCBOs we carry.',
    whatsappLabel: 'Get MCB pricing on WhatsApp',
    whatsappText: 'Hi! I would like a quotation for MCBs for a home distribution board. My requirement is:',
    browse: { label: 'Browse circuit protection', path: '/category/circuit-protection' },
  },
  sources: [
    { label: 'IEC 60898-1:2015 — Circuit-breakers for overcurrent protection for household and similar installations', url: 'https://webstore.iec.ch/en/publication/21972' },
    { label: 'IS 732 — Code of practice for electrical wiring installations (Bureau of Indian Standards)', url: 'https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/standard_review/isdetails/MTA1NDU' },
    { label: 'Lauritz Knudsen — how to choose an MCB for an air conditioner', url: 'https://smartshop.lk-ea.com/blog-articles/post/how-to-choose-mcb-for-ac.html' },
  ],
  related: ['mcb-vs-mccb', 'rccb-explained'],
};

export default howToChooseMcbForHome;
