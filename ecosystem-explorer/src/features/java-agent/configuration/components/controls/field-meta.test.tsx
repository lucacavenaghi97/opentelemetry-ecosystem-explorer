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
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FieldMeta } from "./field-meta";

describe("FieldMeta", () => {
  it("returns null when node has no constraints and no defaultBehavior", () => {
    const { container } = render(<FieldMeta node={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders inclusive range when minimum and maximum are both set", () => {
    render(<FieldMeta node={{ constraints: { minimum: 0, maximum: 100 } }} />);
    expect(screen.getByText("0–100")).toBeInTheDocument();
  });

  it("renders ≥ min when only minimum is set", () => {
    render(<FieldMeta node={{ constraints: { minimum: 0 } }} />);
    expect(screen.getByText("≥ 0")).toBeInTheDocument();
  });

  it("renders > min when only exclusiveMinimum is set", () => {
    render(<FieldMeta node={{ constraints: { exclusiveMinimum: 0 } }} />);
    expect(screen.getByText("> 0")).toBeInTheDocument();
  });

  it("renders ≤ max when only maximum is set", () => {
    render(<FieldMeta node={{ constraints: { maximum: 100 } }} />);
    expect(screen.getByText("≤ 100")).toBeInTheDocument();
  });

  it("renders < max when only exclusiveMaximum is set", () => {
    render(<FieldMeta node={{ constraints: { exclusiveMaximum: 100 } }} />);
    expect(screen.getByText("< 100")).toBeInTheDocument();
  });

  it("renders '> min & < max' when both exclusive bounds are set", () => {
    render(<FieldMeta node={{ constraints: { exclusiveMinimum: 0, exclusiveMaximum: 10 } }} />);
    expect(screen.getByText("> 0 & < 10")).toBeInTheDocument();
  });

  it("prefers inclusive minimum when both minimum and exclusiveMinimum are set", () => {
    render(
      <FieldMeta node={{ constraints: { minimum: 0, exclusiveMinimum: -1, maximum: 100 } }} />
    );
    expect(screen.getByText("0–100")).toBeInTheDocument();
    expect(screen.queryByText("> -1")).not.toBeInTheDocument();
  });

  it("renders '1–10 items' when both minItems and maxItems are set", () => {
    render(<FieldMeta node={{ constraints: { minItems: 1, maxItems: 10 } }} />);
    expect(screen.getByText("1–10 items")).toBeInTheDocument();
  });

  it("renders '≥ 1 item' (singular) when minItems is 1", () => {
    render(<FieldMeta node={{ constraints: { minItems: 1 } }} />);
    expect(screen.getByText("≥ 1 item")).toBeInTheDocument();
  });

  it("renders '≥ 2 items' (plural) when minItems is 2", () => {
    render(<FieldMeta node={{ constraints: { minItems: 2 } }} />);
    expect(screen.getByText("≥ 2 items")).toBeInTheDocument();
  });

  it("renders '≤ 10 items' when only maxItems is set", () => {
    render(<FieldMeta node={{ constraints: { maxItems: 10 } }} />);
    expect(screen.getByText("≤ 10 items")).toBeInTheDocument();
  });

  it("renders defaultBehavior text without 'Default:' prefix", () => {
    render(<FieldMeta node={{ defaultBehavior: "128" }} />);
    expect(screen.getByText("128")).toBeInTheDocument();
    expect(screen.queryByText(/Default:/)).not.toBeInTheDocument();
  });

  it("renders constraints then default, middot-joined, in order", () => {
    const { container } = render(
      <FieldMeta node={{ constraints: { minimum: 0, maximum: 100 }, defaultBehavior: "50" }} />
    );
    expect(container.textContent).toMatch(/0–100.*·.*50/);
  });

  it("renders items range then default, middot-joined, in order", () => {
    const { container } = render(
      <FieldMeta node={{ constraints: { minItems: 1, maxItems: 5 }, defaultBehavior: "empty" }} />
    );
    expect(container.textContent).toMatch(/1–5 items.*·.*empty/);
  });
});
