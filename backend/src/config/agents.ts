
export const agents = [
  {
    id: "izzy",
    name: "Izzy",
    role: "orchestrator",
    description: "Coordinates the entire learning generation workflow.",
    status: "idle"
  },
  {
    id: "suria",
    name: "Suria",
    role: "planner",
    description: "Analyzes teaching materials and plans learning objectives.",
    status: "idle"
  },
  {
    id: "saujana",
    name: "Saujana",
    role: "designer",
    description: "Designs activities, games, and learning experiences.",
    status: "idle"
  },
  {
    id: "arus",
    name: "Arus",
    role: "developer",
    description: "Generates vanilla HTML, CSS, and JavaScript.",
    status: "idle"
  },
  {
    id: "embun",
    name: "Embun",
    role: "tester",
    description: "Tests generated websites and reports problems.",
    status: "idle"
  }
] as const;
