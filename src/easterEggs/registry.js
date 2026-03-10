import { lazy } from "react";

const EASTER_EGG_REGISTRY = {
  "wwi-decisions": {
    id: "wwi-decisions",
    label: "The Rational Road to Catastrophe",
    description:
      "Step into the shoes of 1914 leaders and make the decisions that started WWI.",
    component: lazy(() => import("./games/WWIDecisions")),
  },
};

export default EASTER_EGG_REGISTRY;

export function getRegistryList() {
  return Object.values(EASTER_EGG_REGISTRY).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
}
