import type { GuideBody } from '@/lib/guides';

export const rccbExplained: GuideBody = {
  slug: 'rccb-explained',
  standfirst: 'An RCCB (residual current circuit breaker) continuously compares the current flowing out along the live conductor with the current returning along the neutral. In a healthy circuit those are equal. If they differ by more than the device’s sensitivity rating, current is leaving the circuit somewhere it should not: through damaged insulation, through a wet appliance, or through a person. The RCCB disconnects the supply in a few tens of milliseconds. It is the device in a distribution board that exists to protect people rather than cables, and it does nothing at all about overload or short circuit; that is still the MCB’s job.',
  sections: [
    {
      id: 'how-it-works',
      heading: 'How an RCCB works',
      blocks: [
        {
          kind: 'p',
          text: 'The principle is a balance check, and it is simpler than the acronym suggests.',
        },
        {
          kind: 'list',
          ordered: true,
          items: [
            'Both the live and neutral conductors of the circuit pass through a ring-shaped magnetic core inside the device.',
            'Current flowing out on the live conductor and back on the neutral produces magnetic effects that cancel each other exactly, as long as every electron that left comes back the way it should.',
            'A third winding on that core senses whether the cancellation is complete. In a healthy circuit it sees nothing.',
            'If some current leaves the circuit by another route, through a fault to earth or a person touching a live part, the outgoing and returning currents no longer match. That difference is the residual current the device is named after.',
            'Once the residual current exceeds the device’s rated sensitivity, the sensing winding operates a tripping mechanism and the contacts open. The disconnection happens in a few tens of milliseconds, which is fast enough to matter.',
          ],
        },
        {
          kind: 'p',
          text: 'That is why an RCCB catches a fault an MCB cannot see. A person touching a live conductor may draw only a few tens of milliamps, nowhere near enough to look like an overload on a 16 A circuit, but it is a glaring imbalance, and imbalance is the only thing the RCCB is watching.',
        },
        {
          kind: 'callout',
          tone: 'safety',
          heading: 'Understanding, not installation',
          body: 'This page explains what the device does so you can specify and buy the right one. Installing, replacing or testing a residual current device in a live board is work for a licensed electrician. An RCCB that trips repeatedly, or that will not reset, is reporting a fault in the installation. Treat it as information, not as an inconvenience to be worked around.',
        },
      ],
    },
    {
      id: 'two-ratings',
      heading: 'An RCCB has two ratings, and people mix them up',
      blocks: [
        {
          kind: 'p',
          text: 'Every RCCB is described by two numbers, and confusing them is the most common specification error we see on enquiries.',
        },
        {
          kind: 'table',
          caption: 'The two numbers on the front of the device',
          columns: ['Rating', 'What it means', 'Typical values'],
          rows: [
            ['Current rating, in amps', 'How much load current the device can carry continuously. It is a switch rating, not a protection setting: the RCCB will not trip on overload at all.', '25 A, 40 A, 63 A'],
            ['Sensitivity, in milliamps', 'The residual current at which it trips. This is the protective setting, and it is the number that decides what the device is actually for.', '30 mA, 100 mA, 300 mA'],
          ],
          note: 'A “40 A 30 mA” RCCB carries up to 40 A of load and trips at 30 mA of leakage. The two numbers are unrelated to each other.',
        },
        { kind: 'h3', text: 'Which sensitivity, and why' },
        {
          kind: 'table',
          caption: 'Sensitivity ratings and what each is intended to do',
          columns: ['Sensitivity', 'Intended job', 'Where it is normally used'],
          rows: [
            ['30 mA', 'Additional protection against electric shock: the level chosen because it acts below the current that causes serious harm', 'Domestic final circuits, bathrooms, kitchens, outdoor sockets, anywhere people handle appliances'],
            ['100 mA', 'Fire risk from sustained leakage, and stability where small natural leakage is normal', 'Sub-distribution and grouped circuits, installations with many electronic loads'],
            ['300 mA', 'Fire protection at a higher level, and discrimination so an upstream device does not trip before a downstream one', 'Main incomers and upstream boards'],
          ],
          note: 'The higher ratings are not weaker versions of a 30 mA device; they are for a different job. Only 30 mA is regarded as additional protection for people.',
        },
        {
          kind: 'p',
          text: 'Larger installations often use both: a 100 mA or 300 mA device upstream and 30 mA devices on the circuits people actually touch, so a fault trips the nearest device instead of the whole building. That layering is a design decision for whoever prepared the board schedule.',
        },
      ],
    },
    {
      id: 'rccb-vs-others',
      heading: 'RCCB, RCBO, ELCB, MCB: which is which',
      blocks: [
        {
          kind: 'table',
          caption: 'The four terms you will see on a board schedule',
          columns: ['Device', 'Detects', 'Does not detect', 'Typical role'],
          rows: [
            ['MCB', 'Overload and short circuit', 'Earth leakage', 'One per final circuit'],
            ['RCCB', 'Earth leakage (residual current)', 'Overload or short circuit', 'Covers a group of circuits behind it'],
            ['RCBO', 'Both: earth leakage and overcurrent in one unit', 'Not applicable', 'One per circuit, where the circuit needs its own leakage protection'],
            ['ELCB', 'Historically a voltage-operated earth leakage device; in Indian catalogues the term is now widely used for RCCBs', 'Not applicable', 'Read it as “RCCB” unless the schedule says otherwise'],
          ],
          note: 'Our own catalogue lists this family as “Residual Current Circuit Breakers (RCCBs/ELCBs)”, which reflects how the two terms are used interchangeably in the Indian trade. If a schedule specifies an ELCB, confirm which device is meant before ordering.',
        },
        {
          kind: 'p',
          text: 'The important consequence: an RCCB is not a substitute for MCBs. It has no overload protection of its own, and it depends on the devices around it. A board is normally MCBs plus an RCCB, or RCBOs. See [how to choose an MCB for home circuits](/guides/how-to-choose-mcb-for-home) for how the two arrangements compare in practice.',
        },
      ],
    },
    {
      id: 'poles-and-types',
      heading: 'Poles, and the type question worth asking',
      blocks: [
        { kind: 'h3', text: 'Two pole or four pole' },
        {
          kind: 'p',
          text: 'A two pole RCCB is the single-phase device: live and neutral through the core, and both switched when it trips. That is the domestic case. A four pole device handles three phases plus neutral and belongs on a three-phase supply: a larger house with a three-phase connection, a shop, an office floor. The pole count follows the supply, not the sensitivity.',
        },
        { kind: 'h3', text: 'Type AC and Type A' },
        {
          kind: 'p',
          text: 'Residual current devices are also classified by the kind of leakage current they can detect. A Type AC device responds to sinusoidal alternating residual current. A Type A device additionally responds to pulsating DC residual current, which is what electronic loads with rectifier front ends can produce: variable-speed drives, inverter air conditioners, LED drivers, EV charging equipment.',
        },
        {
          kind: 'p',
          text: 'This matters more every year as homes fill with electronics, and it is a question worth putting to whoever prepared your schedule rather than assuming. If the design does not state a type, ask before you order.',
        },
        {
          kind: 'callout',
          tone: 'note',
          heading: 'We do not state a type for the devices below, and here is why',
          body: 'The residual current type is a marked characteristic of a specific device, not something you can work out from its current rating, its sensitivity, its pole count or its catalogue name. Lauritz Knudsen’s published technical data for the catalogue numbers we carry lists conformance to IS 12640-1 along with the full electrical specification, but does not state a residual current type, so we will not assign one on the manufacturer’s behalf. If your design calls for a specific type, tell us before you order and we will confirm the marked type against the manufacturer’s datasheet for that exact catalogue number, and the device itself carries the marking, so it can be checked on delivery.',
        },
      ],
    },
    {
      id: 'catalogue',
      heading: 'The RCCB and RCBO range we carry',
      blocks: [
        {
          kind: 'p',
          text: 'Our [circuit protection catalogue](/category/circuit-protection) lists Lauritz Knudsen residual current devices across all three sensitivities, in two and four pole, at 25, 40 and 63 A, plus RCBOs that combine leakage and overcurrent protection in a single device.',
        },
        {
          kind: 'catalogue',
          heading: 'Representative records from the range',
          intro: 'Each combination of current rating, sensitivity and pole count is a separate catalogue record.',
          items: [
            { name: 'RCCB 25 A 30 mA, double pole', sku: 'BC202503', price: 2850, path: '/lauritz-knudsen/residual-current-circuit-breaker-25a-30ma-double-pole', note: 'Shock protection on a smaller single-phase board' },
            { name: 'RCCB 40 A 30 mA, double pole', sku: 'BC204003', price: 3145, path: '/lauritz-knudsen/residual-current-circuit-breaker-40a-30ma-double-pole', note: 'The common domestic specification' },
            { name: 'RCCB 63 A 30 mA, double pole', sku: 'BC206303', price: 4020, path: '/lauritz-knudsen/residual-current-circuit-breaker-63a-30ma-double-pole', note: 'Larger single-phase boards' },
            { name: 'RCCB 63 A 100 mA, four pole', sku: 'BC406310', price: 4160, path: '/lauritz-knudsen/residual-current-circuit-breaker-63a-100ma-four-pole', note: 'Three-phase, upstream of 30 mA devices' },
            { name: 'RCCB 63 A 300 mA, four pole', sku: 'BC406330', price: 4160, path: '/lauritz-knudsen/residual-current-circuit-breaker-63a-300ma-four-pole', note: 'Main incomer, fire protection level' },
            { name: 'RCBO 16 A 30 mA, double pole', sku: 'AUF3C201603', price: 5405, path: '/lauritz-knudsen/rcbo-16a-30ma-double-pole', note: 'Leakage and overcurrent on one circuit' },
            { name: 'RCBO 32 A 30 mA, double pole', sku: 'AUF3C203203', price: 5405, path: '/lauritz-knudsen/rcbo-32a-30ma-double-pole', note: 'Heavier dedicated circuits' },
          ],
          footnote: 'Current catalogue list prices per device. Send your board schedule for a quotation against quantities.',
        },
      ],
    },
    {
      id: 'tripping',
      heading: 'When an RCCB keeps tripping',
      blocks: [
        {
          kind: 'p',
          text: 'A residual current device that trips is doing its job. There are three broad reasons, and only one of them is the device itself.',
        },
        {
          kind: 'list',
          items: [
            'A genuine fault. Damaged insulation, water where it should not be, or a failing appliance letting current to earth. This is the case the device exists for, and the fix is finding the fault.',
            'Accumulated natural leakage. Many electronic appliances leak a very small current to earth by design. Put enough of them behind one 30 mA device and the total can approach the trip threshold on its own, especially in humid weather. This is a design problem, usually solved by splitting circuits across devices rather than by fitting a less sensitive one.',
            'A device at the end of its life. Residual current devices are mechanical and they do wear. That is why manufacturers fit a test button and specify how often it should be pressed: follow the instructions supplied with your device.',
          ],
        },
        {
          kind: 'callout',
          tone: 'safety',
          heading: 'What not to do',
          body: 'Do not replace a 30 mA device with a 100 mA one to stop it tripping. The higher rating is for a different job and is not regarded as protection for people. If a device trips repeatedly, get a licensed electrician to find the cause; an insulation problem that is being masked will not stay harmless.',
        },
      ],
    },
  ],
  faqs: [
    {
      question: 'What is an RCCB in electrical terms?',
      answer: 'A residual current circuit breaker: a device that compares the current flowing out on the live conductor with the current returning on the neutral, and disconnects the supply when the difference exceeds its sensitivity rating. That difference means current is escaping the circuit: through a fault to earth, or through a person. It is shock and leakage protection, and it does not protect against overload or short circuit.',
    },
    {
      question: 'What is the difference between an RCCB and an MCB?',
      answer: 'They watch for different faults. An MCB reacts to too much current in the circuit, meaning overload and short circuit, and protects the cable. An RCCB reacts to current leaving the circuit and protects people. A board needs both; an RCBO combines them into a single device.',
    },
    {
      question: 'Should I fit a 30 mA or a 100 mA RCCB?',
      answer: '30 mA is the rating used for additional protection against electric shock and it is what domestic final circuits are normally specified with. 100 mA and 300 mA devices are for limiting fire risk from sustained leakage and for coordinating with devices below them, typically upstream. They are not gentler versions of a 30 mA device; they are for a different job.',
    },
    {
      question: 'Does an RCCB protect against overload?',
      answer: 'No. Its current rating is a carrying rating, not a protection setting. Overload and short-circuit protection has to come from MCBs on the circuits behind it, or from RCBOs which combine both functions.',
    },
    {
      question: 'Two pole or four pole?',
      answer: 'Two pole for a single-phase supply, which covers most homes. Four pole for a three-phase supply: a larger house with a three-phase connection, a shop or an office floor. The pole count follows the supply arrangement, not the sensitivity.',
    },
    {
      question: 'How often should the test button be pressed?',
      answer: 'Follow the interval in the instructions supplied with the device; manufacturers specify this because the mechanism is mechanical and can wear. If the device does not trip when tested, or will not reset afterwards, stop and call a licensed electrician.',
    },
  ],
  cta: {
    heading: 'Specifying a board? Send the schedule',
    body: 'Tell us the current rating, sensitivity and pole count you need, or send the board schedule and we will price the RCCBs, RCBOs and MCBs together.',
    whatsappLabel: 'Get RCCB pricing on WhatsApp',
    whatsappText: 'Hi! I would like a quotation for RCCBs / RCBOs. My requirement is:',
    browse: { label: 'Browse circuit protection', path: '/category/circuit-protection' },
  },
  sources: [
    { label: 'IS 12640 (Part 1): Residual current operated circuit-breakers for household and similar uses (RCCBs). The standard the devices we carry are declared to (Bureau of Indian Standards product manual)', url: 'https://bis.gov.in/wp-content/uploads/2018/11/IS-12640_P1_PM_revised.pdf' },
    { label: 'IEC 61008-1:2024: Residual current operated circuit-breakers without integral overcurrent protection (the international equivalent)', url: 'https://webstore.iec.ch/en/publication/67980' },
    { label: 'IS 732: Code of practice for electrical wiring installations (Bureau of Indian Standards)', url: 'https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/standard_review/isdetails/MTA1NDU' },
    { label: 'Lauritz Knudsen: residual current circuit breaker (RCCB) range', url: 'https://www.lk-ea.com/products/mcb-rccb-distribution-boards/residual-current-circuit-breaker-rccb' },
    { label: 'Lauritz Knudsen: residual current operated circuit breaker (RCBO) range', url: 'https://www.lk-ea.com/products/mcb-rccb-distribution-boards/residual-current-operated-circuit-breaker-rcbo' },
  ],
  related: ['how-to-choose-mcb-for-home', 'mcb-vs-mccb'],
};

export default rccbExplained;
