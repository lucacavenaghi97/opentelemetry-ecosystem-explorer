/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { useState, type JSX } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { GroupNode } from "@/types/configuration";
import { useConfigurationBuilder } from "@/hooks/use-configuration-builder";
import { SchemaRenderer } from "./schema-renderer";

export interface GroupRendererProps {
  node: GroupNode;
  depth: number;
  path: string;
}

export function GroupRenderer({ node, depth, path }: GroupRendererProps): JSX.Element {
  const { state, setEnabled } = useConfigurationBuilder();
  const isTopLevel = depth === 0;
  const enabled = isTopLevel ? state.enabledSections[node.key] === true : true;
  const [expanded, setExpanded] = useState(!isTopLevel || enabled);
  const [prevEnabled, setPrevEnabled] = useState(enabled);
  if (isTopLevel && prevEnabled !== enabled) {
    setPrevEnabled(enabled);
    if (enabled) setExpanded(true);
  }

  const body = enabled ? (
    <div className={depth >= 3 ? "pl-3 border-l border-border/40 space-y-3" : "space-y-3"}>
      {node.children.map((child) => (
        <SchemaRenderer
          key={child.key}
          node={child}
          depth={depth + 1}
          path={path ? `${path}.${child.key}` : child.key}
        />
      ))}
    </div>
  ) : null;

  if (isTopLevel) {
    return (
      <section className="rounded-xl border border-border/50 bg-card/40 p-5 space-y-3">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {enabled && (
              <button
                type="button"
                aria-expanded={expanded}
                aria-label={expanded ? `Collapse ${node.label}` : `Expand ${node.label}`}
                onClick={() => setExpanded((e) => !e)}
                className="text-muted-foreground hover:text-foreground"
              >
                {expanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
            <h3 className="text-base font-semibold text-foreground truncate">{node.label}</h3>
            {node.stability === "development" && (
              <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs text-yellow-500">
                dev
              </span>
            )}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={`Enable ${node.label}`}
            onClick={() => setEnabled(node.key, !enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
              enabled ? "bg-primary" : "bg-border"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </header>
        {node.description && <p className="text-xs text-muted-foreground">{node.description}</p>}
        {expanded && body}
      </section>
    );
  }

  if (depth <= 2) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary"
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {node.label}
        </button>
        {node.description && <p className="text-xs text-muted-foreground">{node.description}</p>}
        {expanded && body}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {node.label}
      </h5>
      {body}
    </div>
  );
}
