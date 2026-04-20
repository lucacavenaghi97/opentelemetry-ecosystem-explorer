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
import type { JSX } from "react";
import { Plus, X } from "lucide-react";
import type { ListNode } from "@/types/configuration";
import { useConfigurationBuilder } from "@/hooks/use-configuration-builder";
import { SchemaRenderer } from "./schema-renderer";
import { parsePath, getByPath } from "@/lib/config-path";

export interface ListRendererProps {
  node: ListNode;
  depth: number;
  path: string;
}

export function ListRenderer({ node, depth, path }: ListRendererProps): JSX.Element {
  const { state, addListItem, removeListItem } = useConfigurationBuilder();
  const raw = getByPath(state.values, parsePath(path));
  const items = Array.isArray(raw) ? raw : [];
  const { constraints } = node;
  const canAdd = !constraints?.maxItems || items.length < constraints.maxItems;
  const canRemove = !constraints?.minItems || items.length > constraints.minItems;

  return (
    <div className="space-y-3">
      {node.description && <p className="text-xs text-muted-foreground">{node.description}</p>}
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No items</p>
      ) : (
        <ul className="space-y-3">
          {items.map((_, i) => {
            const itemPath = `${path}[${i}]`;
            return (
              <li
                key={i}
                className="rounded-lg border border-border/40 bg-background/30 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Item {i + 1}</span>
                  {canRemove && (
                    <button
                      type="button"
                      aria-label={`Remove item ${i + 1}`}
                      onClick={() => removeListItem(path, i)}
                      className="rounded-md border border-border/60 p-1 text-muted-foreground hover:border-red-500/40 hover:text-red-400"
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  )}
                </div>
                <SchemaRenderer node={node.itemSchema} depth={depth + 1} path={itemPath} />
              </li>
            );
          })}
        </ul>
      )}
      {canAdd && (
        <button
          type="button"
          aria-label={`Add item to ${node.label}`}
          onClick={() => addListItem(path)}
          className="flex items-center gap-1 rounded-md border border-border/60 px-3 py-1.5 text-xs text-foreground hover:border-primary/40"
        >
          <Plus className="h-3 w-3 text-primary" aria-hidden="true" />
          Add
        </button>
      )}
    </div>
  );
}
