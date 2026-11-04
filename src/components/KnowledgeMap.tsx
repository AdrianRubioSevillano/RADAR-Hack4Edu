import { useEffect, useState } from "react";
import { Background, Controls, MarkerType, Position, ReactFlow } from "@xyflow/react";
import { SkillBadge } from "./art.tsx";
import { skillTheme } from "./theme.ts";

export interface MapSkill {
  readonly id: string;
  readonly name: string;
  readonly prerequisites: readonly string[];
  readonly valueText: string;
  // Valor en [0, 1] para la barra del nodo; null si no hay evidencia.
  readonly value: number | null;
}

const WIDE: Readonly<Record<string, { x: number; y: number } | undefined>> = {
  OPS: { x: 0, y: 95 },
  NEG: { x: 250, y: 0 },
  FRA: { x: 250, y: 190 },
  JER: { x: 500, y: 0 },
  ALG: { x: 750, y: 95 },
  ECU: { x: 1000, y: 95 },
};

const TALL: Readonly<Record<string, { x: number; y: number } | undefined>> = {
  OPS: { x: 110, y: 0 },
  NEG: { x: 0, y: 130 },
  FRA: { x: 220, y: 130 },
  JER: { x: 0, y: 260 },
  ALG: { x: 110, y: 390 },
  ECU: { x: 110, y: 520 },
};

function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px)");
    const change = () => setNarrow(query.matches);
    change();
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  return narrow;
}

// Representación visual. La tabla que la acompaña es la alternativa accesible.
export function KnowledgeMap({ skills }: { skills: readonly MapSkill[] }) {
  const narrow = useNarrow();
  const positions = narrow ? TALL : WIDE;
  const nodes = skills.map((skill) => ({
    id: skill.id,
    position: positions[skill.id] ?? { x: 0, y: 0 },
    sourcePosition: narrow ? Position.Bottom : Position.Right,
    targetPosition: narrow ? Position.Top : Position.Left,
    className: skill.value === null ? "map-node map-node-empty" : "map-node",
    data: {
      label: (
        <>
          <span className="map-node-head">
            <SkillBadge id={skill.id} size="sm" />
            <strong>{skill.name}</strong>
          </span>
          <span className="map-node-value">{skill.valueText}</span>
          <span className="meter" style={{ "--value": skill.value ?? 0, "--skill": skillTheme(skill.id).color } as React.CSSProperties} />
        </>
      ),
    },
  }));
  const edges = skills.flatMap((skill) =>
    skill.prerequisites.map((id) => ({
      id: `${id}-${skill.id}`,
      source: id,
      target: skill.id,
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, color: "var(--ink)" },
      style: { stroke: "var(--ink)", strokeWidth: 2 },
    })),
  );
  return (
    <div className="map" role="group" aria-label="Mapa de prerrequisitos entre competencias. La tabla de esta sección contiene la misma información.">
      <ReactFlow
        key={narrow ? "tall" : "wide"}
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.08 }}
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        elementsSelectable={false}
        panOnScroll={false}
        zoomOnScroll={false}
        preventScrolling={false}
        minZoom={0.3}
      >
        <Background color="var(--ring)" gap={24} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
