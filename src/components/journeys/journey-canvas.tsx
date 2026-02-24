"use client";

import { useMemo, useRef } from "react";
import { DndContext, type DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { Link2 } from "lucide-react";
import type { JourneyEdge, JourneyNode, JourneyNodeType } from "@/types";
import { NodePalette } from "@/components/journeys/node-palette";
import { TriggerNode } from "@/components/journeys/nodes/trigger-node";
import { DelayNode } from "@/components/journeys/nodes/delay-node";
import { SendSMSNode } from "@/components/journeys/nodes/send-sms-node";
import { SendEmailNode } from "@/components/journeys/nodes/send-email-node";
import { ConditionNode } from "@/components/journeys/nodes/condition-node";

type JourneyCanvasProps = {
  nodes: JourneyNode[];
  edges: JourneyEdge[];
  selectedNodeId: string | null;
  pendingConnectionNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onStartConnection: (sourceNodeId: string) => void;
  onAddNode: (nodeType: JourneyNodeType, position: { x: number; y: number }) => void;
  onMoveNode: (nodeId: string, delta: { x: number; y: number }) => void;
  onConnectNodes: (sourceNodeId: string, targetNodeId: string) => void;
};

type NodeWrapperProps = {
  node: JourneyNode;
  selected: boolean;
  connectingFrom: boolean;
  onSelect: () => void;
  onStartConnection: () => void;
};

function NodeWrapper({
  node,
  selected,
  connectingFrom,
  onSelect,
  onStartConnection,
}: NodeWrapperProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `node-${node.id}`,
    data: {
      kind: "node",
      nodeId: node.id,
    },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    left: node.position.x,
    top: node.position.y,
  };

  return (
    <div ref={setNodeRef} className="absolute" style={style}>
      <div className="absolute -left-3 top-1/2 -translate-y-1/2">
        <button
          type="button"
          onClick={onStartConnection}
          className={`rounded-full border p-1 shadow-sm ${
            connectingFrom
              ? "border-indigo-500 bg-indigo-50 text-indigo-700"
              : "border-slate-300 bg-white text-slate-600"
          }`}
          title="Connect to another node"
        >
          <Link2 className="h-3 w-3" />
        </button>
      </div>

      <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
        {node.type === "trigger" && <TriggerNode node={node} selected={selected} onSelect={onSelect} />}
        {node.type === "delay" && <DelayNode node={node} selected={selected} onSelect={onSelect} />}
        {node.type === "send_sms" && <SendSMSNode node={node} selected={selected} onSelect={onSelect} />}
        {node.type === "send_email" && <SendEmailNode node={node} selected={selected} onSelect={onSelect} />}
        {node.type === "condition" && <ConditionNode node={node} selected={selected} onSelect={onSelect} />}
      </div>
    </div>
  );
}

function edgePath(source: JourneyNode, target: JourneyNode) {
  const sourceX = source.position.x + 220;
  const sourceY = source.position.y + 46;
  const targetX = target.position.x;
  const targetY = target.position.y + 46;

  return `M ${sourceX} ${sourceY} C ${sourceX + 90} ${sourceY}, ${targetX - 90} ${targetY}, ${targetX} ${targetY}`;
}

export function JourneyCanvas({
  nodes,
  edges,
  selectedNodeId,
  pendingConnectionNodeId,
  onSelectNode,
  onStartConnection,
  onAddNode,
  onMoveNode,
  onConnectNodes,
}: JourneyCanvasProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const { setNodeRef } = useDroppable({ id: "journey-canvas" });

  const edgeShapes = useMemo(() => {
    return edges
      .map((edge) => {
        const source = nodes.find((node) => node.id === edge.source);
        const target = nodes.find((node) => node.id === edge.target);

        if (!source || !target) return null;

        return {
          id: edge.id,
          label: edge.label,
          path: edgePath(source, target),
          labelX: (source.position.x + target.position.x + 220) / 2,
          labelY: (source.position.y + target.position.y) / 2,
        };
      })
      .filter(Boolean) as Array<{ id: string; label?: string; path: string; labelX: number; labelY: number }>;
  }, [edges, nodes]);

  const handleDragEnd = (event: DragEndEvent) => {
    const data = event.active.data.current as
      | {
          kind: "palette";
          nodeType: JourneyNodeType;
        }
      | {
          kind: "node";
          nodeId: string;
        }
      | undefined;

    if (!data) return;

    if (data.kind === "node") {
      if (event.delta.x === 0 && event.delta.y === 0) return;
      onMoveNode(data.nodeId, { x: event.delta.x, y: event.delta.y });
      return;
    }

    if (data.kind === "palette" && event.over?.id === "journey-canvas") {
      const activatorEvent = event.activatorEvent;
      if (!canvasRef.current || !("clientX" in activatorEvent)) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const ev = activatorEvent as MouseEvent;
      onAddNode(data.nodeType, {
        x: ev.clientX - rect.left - 110,
        y: ev.clientY - rect.top - 46,
      });
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="relative flex h-[calc(100vh-125px)] overflow-hidden">
        <NodePalette />

        <div
          ref={(element) => {
            setNodeRef(element);
            canvasRef.current = element;
          }}
          className="relative flex-1 overflow-auto bg-slate-100"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(148,163,184,0.35) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
          onClick={() => onSelectNode(null)}
        >
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            <defs>
              <marker
                id="journey-arrow"
                viewBox="0 0 10 10"
                refX="10"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
              </marker>
            </defs>

            {edgeShapes.map((edge) => (
              <g key={edge.id}>
                <path d={edge.path} fill="none" stroke="#64748b" strokeWidth="2" markerEnd="url(#journey-arrow)" />
                {edge.label && (
                  <text x={edge.labelX} y={edge.labelY} fill="#334155" fontSize="12" textAnchor="middle">
                    {edge.label}
                  </text>
                )}
              </g>
            ))}
          </svg>

          {nodes.map((node) => (
            <div
              key={node.id}
              onClick={(e) => {
                e.stopPropagation();
                if (pendingConnectionNodeId && pendingConnectionNodeId !== node.id) {
                  onConnectNodes(pendingConnectionNodeId, node.id);
                }
                onSelectNode(node.id);
              }}
            >
              <NodeWrapper
                node={node}
                selected={selectedNodeId === node.id}
                connectingFrom={pendingConnectionNodeId === node.id}
                onSelect={() => onSelectNode(node.id)}
                onStartConnection={() => onStartConnection(node.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </DndContext>
  );
}
