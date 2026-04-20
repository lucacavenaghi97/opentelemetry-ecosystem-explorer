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
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToggleControl } from "./toggle-control";
import type { ToggleNode } from "@/types/configuration";

const validateField = vi.fn();
let mockValidationErrors: Record<string, string> = {};

vi.mock("@/hooks/use-configuration-builder", () => ({
  useConfigurationBuilder: () => ({
    state: {
      values: {},
      enabledSections: {},
      validationErrors: mockValidationErrors,
      version: "1.0.0",
      isDirty: false,
    },
    validateField,
    setValue: vi.fn(),
  }),
}));

const node: ToggleNode = {
  controlType: "toggle",
  key: "enabled",
  label: "Enabled",
  path: "exporter.enabled",
};

describe("ToggleControl", () => {
  beforeEach(() => {
    validateField.mockReset();
    mockValidationErrors = {};
  });

  it("renders switch as checked when value is true", () => {
    render(<ToggleControl node={node} path={node.path} value={true} onChange={vi.fn()} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("renders switch as unchecked when value is false", () => {
    render(<ToggleControl node={node} path={node.path} value={false} onChange={vi.fn()} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("calls onChange with path and toggled value when clicked", () => {
    const onChange = vi.fn();
    render(<ToggleControl node={node} path={node.path} value={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith("exporter.enabled", true);
  });

  it("calls onChange with false when toggled from true", () => {
    const onChange = vi.fn();
    render(<ToggleControl node={node} path={node.path} value={true} onChange={onChange} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith("exporter.enabled", false);
  });

  it("shows null state when nullable and value is null", () => {
    const nullableNode = { ...node, nullable: true };
    render(
      <ToggleControl node={nullableNode} path={nullableNode.path} value={null} onChange={vi.fn()} />
    );
    expect(screen.getByRole("button", { name: "Set value" })).toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("activates with false when Set value clicked from null state", () => {
    const onChange = vi.fn();
    const nullableNode = { ...node, nullable: true };
    render(
      <ToggleControl
        node={nullableNode}
        path={nullableNode.path}
        value={null}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Set value" }));
    expect(onChange).toHaveBeenCalledWith("exporter.enabled", false);
  });

  it("clears to null when Clear clicked", () => {
    const onChange = vi.fn();
    const nullableNode = { ...node, nullable: true };
    render(
      <ToggleControl
        node={nullableNode}
        path={nullableNode.path}
        value={false}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear value" }));
    expect(onChange).toHaveBeenCalledWith("exporter.enabled", null);
  });

  it("renders the error from state when validationErrors has this path", () => {
    mockValidationErrors = { [node.path]: "Required" };
    render(<ToggleControl node={node} path={node.path} value={false} onChange={vi.fn()} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Required");
  });
});
