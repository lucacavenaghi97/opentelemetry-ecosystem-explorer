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
import { useCallback, useMemo, type JSX } from "react";
import type { InstrumentationData } from "@/types/javaagent";
import type { ConfigValue, ConfigValues } from "@/types/configuration-builder";
import { useInstrumentations } from "@/hooks/use-javaagent-data";
import { useConfigurationBuilder } from "@/hooks/use-configuration-builder";
import { SectionCardShell } from "./section-card-shell";
import { InstrumentationRow } from "./instrumentation-row";

export interface InstrumentationBrowserProps {
  version: string;
  search: string;
  statusFilter: "all" | "overridden";
}

const SECTION_KEY = "instrumentation/development";
const LANG = "java";

type OverrideEntry = { enabled?: boolean } | undefined;

export function InstrumentationBrowser({
  version,
  search,
  statusFilter,
}: InstrumentationBrowserProps): JSX.Element {
  const { data: instrumentations, loading, error } = useInstrumentations(version);
  const { state, setValueByPath, setEnabled, removeMapEntry } = useConfigurationBuilder();

  const overrides = useMemo<Record<string, OverrideEntry>>(() => {
    const section = state.values[SECTION_KEY];
    if (!isPlainObject(section)) return {};
    const lang = section[LANG];
    if (!isPlainObject(lang)) return {};
    return lang as Record<string, OverrideEntry>;
  }, [state.values]);

  const sorted = useMemo(() => {
    if (!instrumentations) return [];
    return [...instrumentations].sort((a, b) => a.name.localeCompare(b.name));
  }, [instrumentations]);

  const overrideCount = useMemo(
    () => sorted.filter((i) => isOverridden(overrides[i.name])).length,
    [sorted, overrides]
  );

  const trimmedSearch = search.trim();
  const filtered = useMemo(() => {
    const q = trimmedSearch.toLowerCase();
    return sorted.filter((inst) => {
      if (statusFilter === "overridden" && !isOverridden(overrides[inst.name])) return false;
      if (q && !matchesQuery(inst, q)) return false;
      return true;
    });
  }, [sorted, overrides, trimmedSearch, statusFilter]);

  const handleAddOverride = useCallback(
    (inst: InstrumentationData) => {
      const startEnabled = inst.disabled_by_default === true;
      // setValueByPath bypasses parsePath's "." split — instrumentation IDs
      // like "cassandra-4.4" must reach the reducer as discrete segments.
      setValueByPath([SECTION_KEY, LANG, inst.name], { enabled: startEnabled });
      setEnabled(SECTION_KEY, true);
    },
    [setValueByPath, setEnabled]
  );

  const handleSetEnabled = useCallback(
    (id: string, enabled: boolean) => {
      setValueByPath([SECTION_KEY, LANG, id, "enabled"], enabled);
    },
    [setValueByPath]
  );

  const handleRemoveOverride = useCallback(
    (id: string) => {
      // removeMapEntry actually deletes the key, unlike setValueByPath(...,
      // undefined) which would leave a stale `{ id: undefined }` entry that
      // the section-flag mirror treats as "still has content". The dotted
      // path is safe here: neither "instrumentation/development" nor "java"
      // contains a "." that parsePath would split on.
      removeMapEntry(`${SECTION_KEY}.${LANG}`, id);
      // The mirror effect in InstrumentationTabBody flips
      // enabledSections[SECTION_KEY] to false on the next render once the
      // values tree is empty.
    },
    [removeMapEntry]
  );

  return (
    <SectionCardShell sectionKey="instrumentations">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-foreground text-base font-semibold">
          Instrumentations
          {sorted.length > 0 ? (
            <span className="text-muted-foreground ml-2 text-xs font-normal">
              · {sorted.length} total
              {overrideCount > 0 ? ` · ${overrideCount} overridden` : ""}
            </span>
          ) : null}
        </h3>
      </header>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading instrumentations…</p>
      ) : error ? (
        <p className="text-sm text-red-400">Failed to load instrumentations.</p>
      ) : (
        <Body
          total={sorted.length}
          filtered={filtered}
          overrides={overrides}
          search={trimmedSearch}
          statusFilter={statusFilter}
          overrideCount={overrideCount}
          onAddOverride={handleAddOverride}
          onSetEnabled={handleSetEnabled}
          onRemoveOverride={handleRemoveOverride}
        />
      )}
    </SectionCardShell>
  );
}

interface BodyProps {
  total: number;
  filtered: InstrumentationData[];
  overrides: Record<string, OverrideEntry>;
  search: string;
  statusFilter: "all" | "overridden";
  overrideCount: number;
  onAddOverride: (inst: InstrumentationData) => void;
  onSetEnabled: (id: string, enabled: boolean) => void;
  onRemoveOverride: (id: string) => void;
}

function Body({
  total,
  filtered,
  overrides,
  search,
  statusFilter,
  overrideCount,
  onAddOverride,
  onSetEnabled,
  onRemoveOverride,
}: BodyProps): JSX.Element {
  return (
    <div className="space-y-3">
      <div className="border-border/40 bg-background/30 text-muted-foreground rounded-md border px-3 py-2 text-xs">
        {readout(total, filtered.length, search, statusFilter, overrideCount)}
      </div>

      {filtered.length === 0 ? (
        <EmptyState search={search} statusFilter={statusFilter} total={total} />
      ) : (
        <ul className="space-y-1.5">
          {filtered.map((inst) => (
            <li key={inst.name}>
              <InstrumentationRow
                instrumentation={inst}
                override={toRowOverride(overrides[inst.name])}
                onAddOverride={() => onAddOverride(inst)}
                onSetEnabled={(enabled) => onSetEnabled(inst.name, enabled)}
                onRemoveOverride={() => onRemoveOverride(inst.name)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState({
  search,
  statusFilter,
  total,
}: {
  search: string;
  statusFilter: "all" | "overridden";
  total: number;
}): JSX.Element {
  if (search) {
    return (
      <p className="text-muted-foreground text-sm">
        No instrumentations match &ldquo;{search}&rdquo;. Clear the search to show all {total}.
      </p>
    );
  }
  if (statusFilter === "overridden") {
    return (
      <p className="text-muted-foreground text-sm">
        You haven&rsquo;t overridden any instrumentation yet. Click &ldquo;+ Override&rdquo; on a
        row to add one.
      </p>
    );
  }
  return <p className="text-muted-foreground text-sm">No instrumentations available.</p>;
}

function readout(
  total: number,
  shown: number,
  search: string,
  statusFilter: "all" | "overridden",
  overrideCount: number
): string {
  const parts: string[] = [];
  if (search) parts.push(`Search "${search}" · ${shown} of ${total}`);
  else if (statusFilter === "overridden") parts.push(`Overridden · ${overrideCount} of ${total}`);
  else parts.push(`No filter · ${total} instrumentations`);
  return parts.join(" · ");
}

function matchesQuery(inst: InstrumentationData, q: string): boolean {
  return (
    inst.name.toLowerCase().includes(q) ||
    (inst.display_name?.toLowerCase().includes(q) ?? false) ||
    (inst.description?.toLowerCase().includes(q) ?? false)
  );
}

function isOverridden(entry: OverrideEntry): boolean {
  return !!entry && typeof entry === "object" && typeof entry.enabled === "boolean";
}

function toRowOverride(entry: OverrideEntry): { enabled: boolean } | undefined {
  if (!isOverridden(entry)) return undefined;
  return { enabled: (entry as { enabled: boolean }).enabled };
}

function isPlainObject(v: ConfigValue | undefined): v is ConfigValues {
  return !!v && typeof v === "object" && !Array.isArray(v);
}
