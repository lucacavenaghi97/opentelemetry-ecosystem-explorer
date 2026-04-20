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
import { ControlWrapper } from "./control-wrapper";
import type { ConfigNodeBase } from "@/types/configuration";

const baseNode: ConfigNodeBase = {
  controlType: "text_input",
  key: "endpoint",
  label: "Endpoint",
  path: "exporter.endpoint",
};

describe("ControlWrapper", () => {
  it("renders label", () => {
    render(
      <ControlWrapper node={baseNode} onClear={vi.fn()} onActivate={vi.fn()}>
        <input />
      </ControlWrapper>
    );
    expect(screen.getByText("Endpoint")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    const node = { ...baseNode, description: "The collector URL" };
    render(
      <ControlWrapper node={node} onClear={vi.fn()} onActivate={vi.fn()}>
        <input />
      </ControlWrapper>
    );
    expect(screen.getByText("The collector URL")).toBeInTheDocument();
  });

  it("renders required asterisk when required", () => {
    const node = { ...baseNode, required: true };
    render(
      <ControlWrapper node={node} onClear={vi.fn()} onActivate={vi.fn()}>
        <input />
      </ControlWrapper>
    );
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("renders stability badge when development", () => {
    const node = { ...baseNode, stability: "development" as const };
    render(
      <ControlWrapper node={node} onClear={vi.fn()} onActivate={vi.fn()}>
        <input />
      </ControlWrapper>
    );
    expect(screen.getByText("dev")).toBeInTheDocument();
  });

  it("renders description with provided id when descriptionId given", () => {
    const node = { ...baseNode, description: "The collector URL" };
    render(
      <ControlWrapper node={node} descriptionId="my-desc" onClear={vi.fn()} onActivate={vi.fn()}>
        <input aria-describedby="my-desc" />
      </ControlWrapper>
    );
    const desc = screen.getByText("The collector URL");
    expect(desc).toHaveAttribute("id", "my-desc");
  });

  it("shows null placeholder and Set value button when nullable and isNull", () => {
    const node = { ...baseNode, nullable: true, nullBehavior: "Uses gRPC default" };
    render(
      <ControlWrapper node={node} isNull={true} onClear={vi.fn()} onActivate={vi.fn()}>
        <input role="textbox" />
      </ControlWrapper>
    );
    expect(screen.getByText("Uses gRPC default")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Set value" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("renders the null placeholder in italic so it reads as an annotation", () => {
    const node = { ...baseNode, nullable: true, defaultBehavior: "512 is used" };
    render(
      <ControlWrapper node={node} isNull={true} onClear={vi.fn()} onActivate={vi.fn()}>
        <input />
      </ControlWrapper>
    );
    expect(screen.getByText("512 is used")).toHaveClass("italic");
  });

  it("falls back to defaultBehavior for null placeholder when nullBehavior absent", () => {
    const node = { ...baseNode, nullable: true, defaultBehavior: "30 seconds" };
    render(
      <ControlWrapper node={node} isNull={true} onClear={vi.fn()} onActivate={vi.fn()}>
        <input />
      </ControlWrapper>
    );
    expect(screen.getByText("30 seconds")).toBeInTheDocument();
  });

  it("shows children and Clear button when nullable and not null", () => {
    const node = { ...baseNode, nullable: true };
    render(
      <ControlWrapper node={node} isNull={false} onClear={vi.fn()} onActivate={vi.fn()}>
        <input role="textbox" />
      </ControlWrapper>
    );
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear value" })).toBeInTheDocument();
  });

  it("calls onClear when Clear button clicked", () => {
    const onClear = vi.fn();
    const node = { ...baseNode, nullable: true };
    render(
      <ControlWrapper node={node} isNull={false} onClear={onClear} onActivate={vi.fn()}>
        <input />
      </ControlWrapper>
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear value" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("calls onActivate when Set value button clicked", () => {
    const onActivate = vi.fn();
    const node = { ...baseNode, nullable: true };
    render(
      <ControlWrapper node={node} isNull={true} onClear={vi.fn()} onActivate={onActivate}>
        <input />
      </ControlWrapper>
    );
    fireEvent.click(screen.getByRole("button", { name: "Set value" }));
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it("shows no Clear button for non-nullable fields", () => {
    render(
      <ControlWrapper node={baseNode} onClear={vi.fn()} onActivate={vi.fn()}>
        <input />
      </ControlWrapper>
    );
    expect(screen.queryByRole("button", { name: "Clear value" })).not.toBeInTheDocument();
  });

  it("links label to input via htmlFor when inputId provided", () => {
    render(
      <ControlWrapper node={baseNode} inputId="my-input" onClear={vi.fn()} onActivate={vi.fn()}>
        <input id="my-input" />
      </ControlWrapper>
    );
    const label = screen.getByText("Endpoint").closest("label");
    expect(label).toHaveAttribute("for", "my-input");
  });

  it("renders defaultBehavior via FieldMeta (no 'Default:' prefix) when not in null state", () => {
    const node = { ...baseNode, defaultBehavior: "30 seconds" };
    render(
      <ControlWrapper node={node} onClear={vi.fn()} onActivate={vi.fn()}>
        <input />
      </ControlWrapper>
    );
    expect(screen.getByText("30 seconds")).toBeInTheDocument();
    expect(screen.queryByText(/Default:/)).not.toBeInTheDocument();
  });

  it("hides FieldMeta when in null state (null-state sentence communicates default)", () => {
    const node = { ...baseNode, nullable: true, defaultBehavior: "30 seconds" };
    render(
      <ControlWrapper node={node} isNull={true} onClear={vi.fn()} onActivate={vi.fn()}>
        <input />
      </ControlWrapper>
    );
    // "30 seconds" appears exactly once — as the null-state sentence, not as FieldMeta.
    expect(screen.getAllByText("30 seconds")).toHaveLength(1);
  });

  it("renders nothing from FieldMeta when no constraints and no defaultBehavior", () => {
    render(
      <ControlWrapper node={baseNode} onClear={vi.fn()} onActivate={vi.fn()}>
        <input />
      </ControlWrapper>
    );
    // Sanity: no default-hint text leaks in.
    expect(screen.queryByText(/Default:/)).not.toBeInTheDocument();
  });

  it('shows "Using default" when both nullBehavior and defaultBehavior are absent', () => {
    const node = { ...baseNode, nullable: true };
    render(
      <ControlWrapper node={node} isNull={true} onClear={vi.fn()} onActivate={vi.fn()}>
        <input />
      </ControlWrapper>
    );
    expect(screen.getByText("Using default")).toBeInTheDocument();
  });

  it("renders the error message when error prop is set", () => {
    render(
      <ControlWrapper node={baseNode} error="Required" onClear={vi.fn()} onActivate={vi.fn()}>
        <input />
      </ControlWrapper>
    );
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("suppresses the label row when node.hideLabel is true", () => {
    const hiddenLabelNode = { ...baseNode, hideLabel: true };
    render(
      <ControlWrapper node={hiddenLabelNode}>
        <input aria-label="test-input" />
      </ControlWrapper>
    );
    // Label text must not appear in the document.
    expect(screen.queryByText(hiddenLabelNode.label)).not.toBeInTheDocument();
  });

  it("omits the error region when error is null or undefined", () => {
    const { rerender } = render(
      <ControlWrapper node={baseNode} error={null} onClear={vi.fn()} onActivate={vi.fn()}>
        <input />
      </ControlWrapper>
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    rerender(
      <ControlWrapper node={baseNode} onClear={vi.fn()} onActivate={vi.fn()}>
        <input />
      </ControlWrapper>
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
