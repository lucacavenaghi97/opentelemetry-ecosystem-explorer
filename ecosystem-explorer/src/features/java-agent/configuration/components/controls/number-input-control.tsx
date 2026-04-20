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
import type { ChangeEvent } from "react";
import { useId, useRef, useState } from "react";
import type { NumberInputNode } from "@/types/configuration";
import { useConfigurationBuilder } from "@/hooks/use-configuration-builder";
import { ControlWrapper } from "./control-wrapper";

interface NumberInputControlProps {
  node: NumberInputNode;
  path: string;
  value: number | null;
  onChange: (path: string, value: number | null) => void;
}

const INPUT_CLASS =
  "w-full rounded-lg border border-border/60 bg-background/80 px-4 py-2.5 text-sm backdrop-blur-sm transition-all duration-200 placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20";

export function NumberInputControl({ node, path, value, onChange }: NumberInputControlProps) {
  const id = useId();
  const descId = useId();
  const isNull = node.nullable === true && value === null;
  const { state, validateField } = useConfigurationBuilder();
  const error = state.validationErrors[path] ?? null;
  const { constraints } = node;
  const min = constraints?.minimum ?? constraints?.exclusiveMinimum;
  const max = constraints?.maximum ?? constraints?.exclusiveMaximum;

  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string>(() => (value === null ? "" : String(value)));
  const [prevValue, setPrevValue] = useState<number | null>(value);

  if (prevValue !== value) {
    setPrevValue(value);
    const next = value === null ? "" : String(value);
    if (draft === "" || parseFloat(draft) !== value) setDraft(next);
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDraft(raw);
    if (raw === "") return;
    const num = parseFloat(raw);
    if (Number.isFinite(num)) onChange(path, num);
  };

  const handleBlur = () => {
    if (draft === "" && value !== null) setDraft(String(value));
    validateField(path);
  };

  return (
    <ControlWrapper
      node={node}
      inputId={id}
      descriptionId={node.description ? descId : undefined}
      isNull={isNull}
      error={error}
      onClear={() => onChange(path, null)}
      onActivate={() => {
        onChange(path, 0);
        requestAnimationFrame(() => {
          const el = inputRef.current;
          if (el) {
            el.focus();
            el.select();
          }
        });
      }}
    >
      <input
        id={id}
        type="number"
        value={draft}
        min={min}
        max={max}
        placeholder={node.defaultBehavior ?? ""}
        ref={inputRef}
        aria-describedby={node.description ? descId : undefined}
        aria-required={node.required || undefined}
        onChange={handleChange}
        onBlur={handleBlur}
        className={INPUT_CLASS}
      />
    </ControlWrapper>
  );
}
