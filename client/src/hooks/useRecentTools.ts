import { getToolById, type ToolId } from "@/data/nexa";
import { useEffect, useState } from "react";

const RECENT_TOOLS_KEY = "nexa-recent-tool-ids";
const RECENT_TOOLS_EVENT = "nexa:recent-tools";
const RECENT_TOOLS_LIMIT = 6;

function readRecentToolIds(): ToolId[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(RECENT_TOOLS_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((id): id is ToolId => typeof id === "string" && Boolean(getToolById(id))).slice(0, RECENT_TOOLS_LIMIT);
  } catch {
    return [];
  }
}

export function recordRecentTool(toolId: ToolId | string) {
  if (typeof window === "undefined") return;

  if (!getToolById(toolId)) return;

  const registeredToolId = toolId as ToolId;
  const next = [registeredToolId, ...readRecentToolIds().filter((id) => id !== registeredToolId)].slice(0, RECENT_TOOLS_LIMIT);
  window.localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(RECENT_TOOLS_EVENT));
}

export function useRecentTools() {
  const [recentToolIds, setRecentToolIds] = useState<ToolId[]>(readRecentToolIds);

  useEffect(() => {
    const refresh = () => setRecentToolIds(readRecentToolIds());
    window.addEventListener(RECENT_TOOLS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(RECENT_TOOLS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return recentToolIds.flatMap((id) => {
    const tool = getToolById(id);
    return tool ? [tool] : [];
  });
}
