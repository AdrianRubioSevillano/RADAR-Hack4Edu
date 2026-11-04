import { ReactFlow, Background, Controls, MarkerType } from "@xyflow/react";

export interface MapSkill {
  readonly id: string;
  readonly name: string;
  readonly prerequisites: readonly string[];
  readonly valueText: string;
  readonly level: "none" | "low" | "mid" | "high";
}

const POSITIONS: Readonly<Record<string, { x: number; y: number } | undefined>> = {
  OPS: { x: 180, y: 0 },
  NEG: { x: 0, y: 110 },
  FRA: { x: 360, y: 110 },
  JER: { x: 0, y: 220 },
  ALG: { x: 180, y: 330 },
  ECU: { x: 180, y: 440 },
};

// Representación visual. La tabla que la acompaña es la alternativa accesible.
export function KnowledgeMap({ skills }: { skills: readonly MapSkill[] }) {
  const nodes = skills.map((skill) => ({
    id: skill.id,
    position: POSITIONS[skill.id] ?? { x: 0, y: 0 },
    className: `map-node map-node-${skill.level}`,
    data: {
      label: (
        <>
          <strong>{skill.name}</strong>
          <span>{skill.valueText}</span>
        </>
      ),
    },
  }));
  const edges = skills.flatMap((skill) =>
    skill.prerequisites.map((id) => ({
      id: `${id}-${skill.id}`,
      source: id,
      target: skill.id,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: "var(--edge)", strokeWidth: 1.6 },
    })),
  );
  return (
    <div className="map" role="img" aria-label="Mapa de prerrequisitos. La tabla siguiente contiene la misma información.">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        elementsSelectable={false}
        minZoom={0.3}
        proOptions={{ hideAttribution: false }}
      >
        <Background color="var(--grid)" gap={22} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

export function levelOf(probability: number | null): MapSkill["level"] {
  if (probability === null) return "none";
  if (probability < 0.4) return "low";
  return probability < 0.7 ? "mid" : "high";
}
