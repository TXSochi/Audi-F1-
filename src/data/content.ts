const IMG = `${import.meta.env.BASE_URL}img/`;
export const img = (name: string) => `${IMG}${name}`;

export const OFFICIAL_URL = "https://www.audif1.com/en/car/configurator";

export const NAV = [
  { id: "car", label: "Car" },
  { id: "configure", label: "Configure" },
  { id: "drivers", label: "Drivers" },
  { id: "team", label: "Team" },
  { id: "roadmap", label: "2030" },
];

export const SPECS = [
  { value: "1.6", unit: "L", label: "V6 turbo hybrid", short: "V6 turbo" },
  { value: "400", unit: "kW", label: "Combustion, approx.", short: "Engine" },
  { value: "350", unit: "kW", label: "Electric motor", short: "Electric" },
  { value: "2030", unit: "", label: "Title target", short: "Title goal" },
];

export type Chapter = {
  shot: string;
  kicker: string;
  title: string;
  body: string;
  photo: string;
  facts?: { value: string; unit?: string; label: string }[];
  swatches?: { name: string; color: string }[];
  split?: boolean;
};

export const CHAPTERS: Chapter[] = [
  {
    shot: "livery",
    kicker: "Livery",
    title: "Three colours. One identity.",
    body: "Titanium carries Audi's motorsport past. Carbon shows the material underneath. Red is new for the team, and it sits exactly where the car breathes.",
    photo: "left.webp",
    swatches: [
      { name: "Titanium", color: "linear-gradient(135deg,#eceef0,#9b9ea3)" },
      { name: "Carbon", color: "linear-gradient(135deg,#34363a,#0b0b0c)" },
      { name: "Audi Red", color: "linear-gradient(135deg,#ff2d55,#b00028)" },
    ],
  },
  {
    shot: "aero",
    kicker: "Aerodynamics",
    title: "Active Aero. Two shapes per lap.",
    body: "The 2026 rules let the front and rear wings move. Flaps close for downforce in the corners and open on the straights to shed drag, on a car that is narrower and shorter than before.",
    photo: "angular.webp",
    facts: [
      { value: "1,900", unit: "mm", label: "Maximum width" },
      { value: "3,400", unit: "mm", label: "Maximum wheelbase" },
      { value: "2", label: "Aero modes: corner, straight" },
      { value: "18", unit: "in", label: "Pirelli wheels" },
    ],
  },
  {
    shot: "power",
    kicker: "Power unit",
    title: "AFR 26 Hybrid. Almost half electric.",
    body: "Audi builds its own power unit in Neuburg an der Donau. A turbo V6 is paired with an electric motor that nearly matches it, running on sustainable fuel developed with bp.",
    photo: "top.webp",
    split: true,
    facts: [
      { value: "1.6", unit: "L", label: "V6 turbo" },
      { value: "100", unit: "%", label: "Sustainable fuel" },
    ],
  },
  {
    shot: "cockpit",
    kicker: "Cockpit",
    title: "One seat. Titanium around it.",
    body: "The halo is finished in the same titanium tone as the bodywork. Above the driver's head, the airbox is lined in red and feeds the engine behind.",
    photo: "frontclose.webp",
    facts: [
      { value: "#27", label: "Nico Hülkenberg" },
      { value: "#5", label: "Gabriel Bortoleto" },
    ],
  },
  {
    shot: "rear",
    kicker: "Rear",
    title: "Carbon at the back. Four rings.",
    body: "From the engine cover rearward the paint stops and bare carbon takes over. The four rings sit on the rear wing, the last thing the car behind gets to read.",
    photo: "rear34.webp",
    facts: [
      { value: "08.03", label: "Race debut, Melbourne 2026" },
      { value: "11", label: "Teams on the 2026 grid" },
    ],
  },
];

export const DRIVERS = [
  {
    no: "27",
    first: "Nico",
    last: "Hülkenberg",
    country: "Germany",
    bio: "Born 1987. Won the 24 Hours of Le Mans in 2015 and brings more than 250 Grand Prix starts to Audi's first season.",
    stats: [
      { value: "250+", label: "Starts" },
      { value: "2015", label: "Le Mans win" },
      { value: "2010", label: "F1 debut" },
    ],
    photo: "angular.webp",
  },
  {
    no: "5",
    first: "Gabriel",
    last: "Bortoleto",
    country: "Brazil",
    bio: "Born 2004. Won Formula 3 in 2023 and Formula 2 in 2024, each at the first attempt, then stepped straight into Formula 1.",
    stats: [
      { value: "2024", label: "F2 title" },
      { value: "2023", label: "F3 title" },
      { value: "2025", label: "F1 debut" },
    ],
    photo: "rear34.webp",
  },
];

export const SITES = [
  { code: "DE", city: "Neuburg an der Donau", role: "Power unit", text: "Where the AFR 26 Hybrid is designed and built, alongside the battery and electronics.", x: 84.3, y: 59.6 },
  { code: "CH", city: "Hinwil", role: "Chassis and race team", text: "The former Sauber factory. Chassis, aerodynamics and race operations.", x: 71.3, y: 77.5 },
  { code: "UK", city: "Bicester", role: "Technical centre", text: "A technical centre in the heart of British motorsport, close to the supply chain and the talent.", x: 15.8, y: 20 },
];

export const TIMELINE = [
  { when: "2022", date: "August 2022", title: "The decision", text: "Audi announces it will enter Formula 1 as a works team in 2026." },
  { when: "2025", date: "November 2025", title: "Colours in Munich", text: "The titanium, carbon and red scheme is shown for the first time." },
  { when: "01.26", date: "9 January 2026", title: "First rollout", text: "The R26 turns its first laps at the Circuit de Barcelona-Catalunya." },
  { when: "Berlin", date: "January 2026", title: "Berlin premiere", text: "The team and its race livery are unveiled at Kraftwerk, a former power station." },
  { when: "03.26", date: "8 March 2026", title: "Race debut", text: "Audi's first Grand Prix, in Melbourne." },
  { when: "2030", date: "By 2030", title: "Fight for the title", text: "The target the team set itself from day one.", goal: true },
];

export const GALLERY = [
  { src: "left.webp", label: "Profile", cls: "shot--a", bleed: false },
  { src: "front.webp", label: "Head on", cls: "shot--b", bleed: false },
  { src: "back.webp", label: "Diffuser", cls: "shot--c", bleed: false },
  { src: "top.webp", label: "Plan view", cls: "shot--d", bleed: false },
  { src: "topclose.webp", label: "Cockpit", cls: "shot--a", bleed: true },
  { src: "frontclose.webp", label: "Halo and airbox", cls: "shot--b", bleed: true },
];

export const PARTNERS = ["Audi", "Revolut", "Visit Qatar", "bp", "Castrol"];
