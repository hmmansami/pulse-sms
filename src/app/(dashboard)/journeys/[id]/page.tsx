"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { JourneyEdge, JourneyNode, JourneyNodeType, JourneyStatus } from "@/types";
import { JourneyCanvas } from "@/components/journeys/journey-canvas";
import { JourneyToolbar } from "@/components/journeys/journey-toolbar";
import { NodeConfigPanel } from "@/components/journeys/node-config-panel";

type JourneyStats = {
  entered: number;
  active: number;
  completed: number;
};

type JourneyPayload = {
  id: string;
  name: string;
  status: JourneyStatus;
  trigger: { type: "event"; event: string };
  nodes: JourneyNode[];
  edges: JourneyEdge[];
};

function nodeDefaults(type: JourneyNodeType): Record<string, unknown> {
  if (type === "trigger") return { event: "subscriber_created" };
  if (type === "delay") return { amount: 30, unit: "minutes" };
  if (type === "send_sms") return { body: "Hi {{first_name}}, thanks for joining Pulse." };
  if (type === "send_email") return { subject: "Welcome to Pulse", body: "Thanks for subscribing." };
  if (type === "condition") {
    return {
      field: "subscriber.tags",
      operator: "contains",
      value: "vip",
      logic: "and",
      conditions: [{ field: "subscriber.tags", operator: "contains", value: "vip" }],
    };
  }
  return {};
}

export default function JourneyEditorPage() {
  const params = useParams<{ id: string }>();
  const [journeyName, setJourneyName] = useState("");
  const [status, setStatus] = useState<JourneyStatus>("draft");
  const [triggerEvent, setTriggerEvent] = useState("subscriber_created");
  const [nodes, setNodes] = useState<JourneyNode[]>([]);
  const [edges, setEdges] = useState<JourneyEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [pendingConnectionNodeId, setPendingConnectionNodeId] = useState<string | null>(null);
  const [stats, setStats] = useState<JourneyStats>({ entered: 0, active: 0, completed: 0 });
  const [isSaving, setIsSaving] = useState(false);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );

  useEffect(() => {
    const loadJourney = async () => {
      const [journeyRes, statsRes] = await Promise.all([
        fetch(`/api/journeys/${params.id}`),
        fetch(`/api/journeys/${params.id}/stats`),
      ]);

      const journeyPayload = (await journeyRes.json()) as { data?: JourneyPayload };
      const statsPayload = (await statsRes.json()) as { data?: JourneyStats };

      if (journeyPayload.data) {
        setJourneyName(journeyPayload.data.name);
        setStatus(journeyPayload.data.status);
        setTriggerEvent(journeyPayload.data.trigger?.event ?? "subscriber_created");
        setNodes(journeyPayload.data.nodes ?? []);
        setEdges(journeyPayload.data.edges ?? []);
      }

      if (statsPayload.data) {
        setStats(statsPayload.data);
      }
    };

    void loadJourney();
  }, [params.id]);

  const addNode = (nodeType: JourneyNodeType, position: { x: number; y: number }) => {
    const id = `${nodeType}-${Date.now()}`;

    setNodes((prev) => [
      ...prev,
      {
        id,
        type: nodeType,
        position,
        data: nodeDefaults(nodeType),
      },
    ]);
  };

  const moveNode = (nodeId: string, delta: { x: number; y: number }) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              position: {
                x: Math.max(0, node.position.x + delta.x),
                y: Math.max(0, node.position.y + delta.y),
              },
            }
          : node
      )
    );
  };

  const connectNodes = (sourceNodeId: string, targetNodeId: string) => {
    if (sourceNodeId === targetNodeId) {
      setPendingConnectionNodeId(null);
      return;
    }

    const sourceNode = nodes.find((node) => node.id === sourceNodeId);
    if (!sourceNode) return;

    let label: string | undefined;

    if (sourceNode.type === "condition") {
      const existing = edges.filter((edge) => edge.source === sourceNodeId && (edge.label === "if" || edge.label === "else"));
      label = existing.length === 0 ? "if" : "else";
    }

    setEdges((prev) => {
      const alreadyExists = prev.some((edge) => edge.source === sourceNodeId && edge.target === targetNodeId);
      if (alreadyExists) return prev;

      return [
        ...prev,
        {
          id: `edge-${Date.now()}`,
          source: sourceNodeId,
          target: targetNodeId,
          label,
        },
      ];
    });

    setPendingConnectionNodeId(null);
  };

  const updateNode = (updatedNode: JourneyNode) => {
    setNodes((prev) => prev.map((node) => (node.id === updatedNode.id ? updatedNode : node)));

    if (updatedNode.type === "trigger") {
      setTriggerEvent(String(updatedNode.data.event ?? "subscriber_created"));
    }
  };

  const saveJourney = async () => {
    setIsSaving(true);

    await fetch(`/api/journeys/${params.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: journeyName,
        status,
        trigger: {
          type: "event",
          event: triggerEvent,
        },
        nodes,
        edges,
      }),
    });

    setIsSaving(false);
  };

  const updateStatus = async (nextStatus: JourneyStatus) => {
    setStatus(nextStatus);

    await fetch(`/api/journeys/${params.id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: nextStatus }),
    });
  };

  return (
    <main className="relative min-h-screen bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <Link href="/journeys" className="text-sm text-indigo-600 hover:text-indigo-500">
            Back to journeys
          </Link>
          <div className="mt-1 flex items-center gap-2">
            <input
              value={journeyName}
              onChange={(event) => setJourneyName(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-lg font-semibold text-slate-900"
            />
          </div>
        </div>
      </div>

      <JourneyToolbar status={status} isSaving={isSaving} stats={stats} onSave={saveJourney} onStatusChange={updateStatus} />

      <JourneyCanvas
        nodes={nodes}
        edges={edges}
        selectedNodeId={selectedNodeId}
        pendingConnectionNodeId={pendingConnectionNodeId}
        onSelectNode={setSelectedNodeId}
        onStartConnection={(nodeId) => {
          setPendingConnectionNodeId((prev) => (prev === nodeId ? null : nodeId));
        }}
        onAddNode={addNode}
        onMoveNode={moveNode}
        onConnectNodes={connectNodes}
      />

      <NodeConfigPanel
        node={selectedNode}
        onClose={() => setSelectedNodeId(null)}
        onChange={updateNode}
      />
    </main>
  );
}
