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
import { GroupRenderer } from "./group-renderer";
import type { GroupNode } from "@/types/configuration";

const mockState = {
  values: {},
  enabledSections: { resource: false },
  validationErrors: {},
  version: "1.0.0",
  isDirty: false,
};

const setEnabled = vi.fn();
const setValue = vi.fn();

vi.mock("@/hooks/use-configuration-builder", () => ({
  useConfigurationBuilder: () => ({
    state: mockState,
    setEnabled: (...a: unknown[]) => setEnabled(...a),
    setValue: (...a: unknown[]) => setValue(...a),
  }),
}));

const groupNode: GroupNode = {
  controlType: "group",
  key: "resource",
  label: "Resource",
  path: "resource",
  description: "The resource section",
  children: [],
};

describe("GroupRenderer", () => {
  it("at depth 0 renders a card with an enable switch", () => {
    render(<GroupRenderer node={groupNode} depth={0} path="resource" />);
    expect(screen.getByText("Resource")).toBeInTheDocument();
    const sw = screen.getByRole("switch", { name: /Enable Resource/i });
    expect(sw).toHaveAttribute("aria-checked", "false");
  });

  it("at depth 0, flipping the switch dispatches setEnabled", () => {
    render(<GroupRenderer node={groupNode} depth={0} path="resource" />);
    fireEvent.click(screen.getByRole("switch", { name: /Enable Resource/i }));
    expect(setEnabled).toHaveBeenCalledWith("resource", true);
  });

  it("at depth >= 3 renders a plain header without a collapse chevron", () => {
    render(<GroupRenderer node={groupNode} depth={3} path="resource" />);
    expect(screen.getByText("Resource")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /collapse/i })).not.toBeInTheDocument();
  });

  it("hides the chevron button at depth 0 when the section is disabled", () => {
    mockState.enabledSections.resource = false;
    render(<GroupRenderer node={groupNode} depth={0} path="resource" />);
    expect(screen.queryByRole("button", { name: /Expand Resource/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Collapse Resource/ })).not.toBeInTheDocument();
  });

  it("shows a labeled chevron button at depth 0 when the section is enabled", () => {
    mockState.enabledSections.resource = true;
    render(<GroupRenderer node={groupNode} depth={0} path="resource" />);
    expect(screen.getByRole("button", { name: /Collapse Resource/ })).toBeInTheDocument();
    mockState.enabledSections.resource = false; // restore for other tests
  });

  it("auto-expands the section when enabled flips from false to true", () => {
    mockState.enabledSections.resource = false;
    const childNode: GroupNode = {
      ...groupNode,
      children: [
        {
          controlType: "text_input",
          key: "schema_url",
          label: "Schema URL",
          path: "resource.schema_url",
        },
      ],
    };
    const { rerender } = render(<GroupRenderer node={childNode} depth={0} path="resource" />);
    // Initially disabled and collapsed — child label should not appear.
    expect(screen.queryByText("Schema URL")).not.toBeInTheDocument();

    // Flip enabled on and re-render with the same node reference.
    mockState.enabledSections.resource = true;
    rerender(<GroupRenderer node={childNode} depth={0} path="resource" />);

    // Child label should now appear (auto-expanded).
    expect(screen.getByText("Schema URL")).toBeInTheDocument();
    mockState.enabledSections.resource = false; // restore
  });
});
