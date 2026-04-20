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
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ListRenderer } from "./list-renderer";
import type { ListNode } from "@/types/configuration";

const addListItem = vi.fn();
const removeListItem = vi.fn();

vi.mock("@/hooks/use-configuration-builder", () => ({
  useConfigurationBuilder: () => ({
    state: {
      values: { tp: { processors: [{}] } },
      enabledSections: {},
      validationErrors: {},
      version: "1.0.0",
      isDirty: false,
    },
    addListItem: (...a: unknown[]) => addListItem(...a),
    removeListItem: (...a: unknown[]) => removeListItem(...a),
    setValue: vi.fn(),
    setEnabled: vi.fn(),
    selectPlugin: vi.fn(),
  }),
}));

vi.mock("./schema-renderer", () => ({
  SchemaRenderer: ({ path }: { path: string }) => <span data-testid="child-path">{path}</span>,
}));

const listNode: ListNode = {
  controlType: "list",
  key: "processors",
  label: "Processors",
  path: "tp.processors",
  itemSchema: {
    controlType: "group",
    key: "item",
    label: "Item",
    path: "tp.processors.item",
    children: [],
  },
};

describe("ListRenderer", () => {
  it("renders an item card for each value and injects indexed path", () => {
    render(<ListRenderer node={listNode} depth={1} path="tp.processors" />);
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    const child = screen.getByTestId("child-path");
    expect(child.textContent).toBe("tp.processors[0]");
  });

  it("dispatches addListItem when Add clicked", () => {
    render(<ListRenderer node={listNode} depth={1} path="tp.processors" />);
    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    expect(addListItem).toHaveBeenCalledWith("tp.processors");
  });

  it("dispatches removeListItem with the clicked index", () => {
    render(<ListRenderer node={listNode} depth={1} path="tp.processors" />);
    fireEvent.click(screen.getByRole("button", { name: /remove item 1/i }));
    expect(removeListItem).toHaveBeenCalledWith("tp.processors", 0);
  });
});
