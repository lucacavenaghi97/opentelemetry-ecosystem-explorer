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
import { useRef } from "react";
import { Plus } from "lucide-react";
import type { StringListNode } from "@/types/configuration";
import { useConfigurationBuilder } from "@/hooks/use-configuration-builder";
import { ControlWrapper } from "./control-wrapper";
import { LIST_INPUT_CLASS } from "./control-styles";
import {
  FocusManagedInputList,
  type FocusManagedInputListHandle,
} from "./focus-managed-input-list";
import { FieldSection } from "../field-section";

interface StringListControlProps {
  node: StringListNode;
  path: string;
  value: string[] | null;
  onChange: (path: string, value: string[] | null) => void;
}

export function StringListControl({ node, path, value, onChange }: StringListControlProps) {
  const items = value ?? [];
  const isNull = node.nullable === true && value === null;
  const { state } = useConfigurationBuilder();
  const error = state.validationErrors[path] ?? null;
  const { constraints } = node;
  const canRemove = !constraints?.minItems || items.length > constraints.minItems;
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const handleRef = useRef<FocusManagedInputListHandle>(null);

  const handleAdd = () => {
    onChange(path, [...items, ""]);
    handleRef.current?.notifyAdded();
  };

  return (
    <ControlWrapper
      node={node}
      isNull={isNull}
      error={error}
      onClear={() => onChange(path, null)}
      hideLabel
    >
      <FieldSection node={node} level="field" value={items} asGroup={false}>
        <FieldSection.Header>
          <FieldSection.Label />
          <FieldSection.Stability />
          <FieldSection.Info />
          <FieldSection.Action>
            <button
              ref={addButtonRef}
              type="button"
              onClick={handleAdd}
              aria-label={`Add item to ${node.label}`}
              className="border-border/60 bg-background/80 hover:border-primary/40 text-foreground inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs transition-all"
            >
              <Plus className="text-primary h-3 w-3" aria-hidden="true" />
              Add
            </button>
          </FieldSection.Action>
        </FieldSection.Header>
        <FieldSection.Body>
          {items.length === 0 ? (
            <FieldSection.Empty />
          ) : (
            <FocusManagedInputList<string>
              label={node.label}
              items={items}
              canRemove={canRemove}
              onChange={(next) => onChange(path, next)}
              addButtonRef={addButtonRef}
              handleRef={handleRef}
              renderInput={({ value, setValue, ariaLabel }) => (
                <input
                  type="text"
                  aria-label={ariaLabel}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className={LIST_INPUT_CLASS}
                />
              )}
            />
          )}
        </FieldSection.Body>
      </FieldSection>
    </ControlWrapper>
  );
}
