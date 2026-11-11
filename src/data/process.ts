export interface ProcessPhase {
  number: string;
  title: string;
  summary: string;
  deliverables: string[];
}

/** Four-phase summary used on the homepage. */
export const processPhases: ProcessPhase[] = [
  {
    number: "01",
    title: "Discover",
    summary: "We learn about your business, goals, users and constraints, and find where technology can help most.",
    deliverables: ["Discovery workshop", "Goals & success measures", "Opportunity map"],
  },
  {
    number: "02",
    title: "Define",
    summary: "We agree on scope, priorities, architecture and timeline, so everyone knows what will be built and why.",
    deliverables: ["Written scope", "UX wireframes", "Delivery plan"],
  },
  {
    number: "03",
    title: "Develop",
    summary: "We design and build in reviewable increments, sharing progress regularly on a staging environment or test app.",
    deliverables: ["Designs & prototypes", "Working builds", "Weekly updates"],
  },
  {
    number: "04",
    title: "Deliver",
    summary: "We test, launch (including App Store and Google Play submission), hand over, then keep improving based on real use.",
    deliverables: ["Tested release", "Documentation", "Support & improvement plan"],
  },
];

export interface DetailedPhase {
  id: string;
  number: string;
  title: string;
  intro: string;
  whatHappens: string[];
  clientContributes: string[];
  solveraDelivers: string[];
  nextStep: string;
}

/** Five-stage detail used on /process. */
export const detailedPhases: DetailedPhase[] = [
  {
    id: "discovery",
    number: "01",
    title: "Discovery",
    intro: "Understanding the problem before proposing a solution.",
    whatHappens: [
      "Conversations with you and, where useful, the people who will use the solution",
      "Review of existing systems, data, content and workflows",
      "Clarifying goals and how success will be measured",
    ],
    clientContributes: ["Context about the business and its customers", "Access to relevant tools or examples", "Time for one or two working sessions"],
    solveraDelivers: ["A summary of what we learned", "Identified opportunities and risks", "Recommended direction"],
    nextStep: "Agree on the direction and move into planning.",
  },
  {
    id: "planning",
    number: "02",
    title: "Planning & Definition",
    intro: "Turning goals into a clear, agreed scope.",
    whatHappens: ["Defining features, integrations and priorities", "Choosing architecture and tools", "Estimating effort and setting milestones"],
    clientContributes: ["Decisions on priorities", "Feedback on the proposed scope", "Confirmation of responsibilities (content, accounts, approvals)"],
    solveraDelivers: ["Written scope and acceptance criteria", "Timeline with milestones", "Technical approach"],
    nextStep: "Approve the scope and schedule design work.",
  },
  {
    id: "design",
    number: "03",
    title: "Design & Prototyping",
    intro: "Making ideas visible early, when changes are cheap.",
    whatHappens: ["Wireframes for key journeys", "Interface design based on your brand", "Clickable prototypes or workflow diagrams for review"],
    clientContributes: ["Content and brand assets", "Focused feedback in agreed review rounds"],
    solveraDelivers: ["Approved designs or workflow maps", "Component and style guidelines", "Updated build plan"],
    nextStep: "Sign off designs and begin development.",
  },
  {
    id: "development",
    number: "04",
    title: "Development & Integration",
    intro: "Building in small increments you can see and test.",
    whatHappens: ["Development on a staging environment", "Integration with your systems and APIs", "Regular progress updates and demos"],
    clientContributes: ["Access to third-party accounts and APIs", "Timely feedback on builds", "Test data where needed"],
    solveraDelivers: ["Working software at each milestone", "Visible progress and open issues list", "Integration documentation"],
    nextStep: "Move into structured testing ahead of launch.",
  },
  {
    id: "launch",
    number: "05",
    title: "Testing, Launch & Improvement",
    intro: "Launching carefully, then improving with real usage.",
    whatHappens: ["Functional, responsive, accessibility and performance testing", "Launch planning and go-live", "Monitoring and a prioritized improvement backlog"],
    clientContributes: ["User acceptance testing", "Final launch approval", "Feedback from real users"],
    solveraDelivers: ["Tested release", "Documentation and handover of all access", "Optional ongoing support and improvement"],
    nextStep: "Review results together and plan the next improvements.",
  },
];
