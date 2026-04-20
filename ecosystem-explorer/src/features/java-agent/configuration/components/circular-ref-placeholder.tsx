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
import type { CircularRefNode } from "@/types/configuration";

interface CircularRefPlaceholderProps {
  node: CircularRefNode;
}

export function CircularRefPlaceholder({ node }: CircularRefPlaceholderProps) {
  return (
    <div className="rounded-md border border-border/40 bg-background/40 px-4 py-2 text-sm text-muted-foreground">
      <strong className="font-medium text-foreground">{node.label}</strong>
      <span>
        {" "}
        — Circular reference to {node.refType}. Configure this under its canonical section.
      </span>
    </div>
  );
}
