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
import { InstrumentationRow } from "./instrumentation-row";
import type { InstrumentationData } from "@/types/javaagent";

function makeInst(overrides: Partial<InstrumentationData> = {}): InstrumentationData {
  return {
    name: "cassandra-4.4",
    display_name: "Cassandra Driver",
    description: "Database client spans + metrics for the DataStax Cassandra Driver.",
    disabled_by_default: false,
    scope: { name: "io.opentelemetry.cassandra-4.4" },
    ...overrides,
  };
}

describe("InstrumentationRow", () => {
  it("shows 'enabled by default' pill and an Override button when not overridden and enabled-by-default", () => {
    render(
      <InstrumentationRow
        instrumentation={makeInst()}
        override={undefined}
        onAddOverride={vi.fn()}
        onSetEnabled={vi.fn()}
        onRemoveOverride={vi.fn()}
      />
    );
    expect(screen.getByText("enabled by default")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Override Cassandra Driver/ })).toBeInTheDocument();
  });

  it("shows 'disabled by default' pill when disabled_by_default is true", () => {
    render(
      <InstrumentationRow
        instrumentation={makeInst({
          name: "jmx-metrics",
          display_name: "JMX Metrics",
          disabled_by_default: true,
        })}
        override={undefined}
        onAddOverride={vi.fn()}
        onSetEnabled={vi.fn()}
        onRemoveOverride={vi.fn()}
      />
    );
    expect(screen.getByText("disabled by default")).toBeInTheDocument();
  });

  it("shows enabled toggle state and a remove button when overridden+enabled", () => {
    render(
      <InstrumentationRow
        instrumentation={makeInst()}
        override={{ enabled: true }}
        onAddOverride={vi.fn()}
        onSetEnabled={vi.fn()}
        onRemoveOverride={vi.fn()}
      />
    );
    const enabledBtn = screen.getByRole("button", { name: "Enabled" });
    const disabledBtn = screen.getByRole("button", { name: "Disabled" });
    expect(enabledBtn).toHaveAttribute("aria-pressed", "true");
    expect(disabledBtn).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByRole("button", { name: /Remove override for Cassandra Driver/ })
    ).toBeInTheDocument();
  });

  it("shows disabled toggle state when overridden+disabled", () => {
    render(
      <InstrumentationRow
        instrumentation={makeInst()}
        override={{ enabled: false }}
        onAddOverride={vi.fn()}
        onSetEnabled={vi.fn()}
        onRemoveOverride={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "Disabled" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "Enabled" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("renders the 'custom' badge when _is_custom is true", () => {
    render(
      <InstrumentationRow
        instrumentation={makeInst({ name: "jmx-metrics", _is_custom: true })}
        override={undefined}
        onAddOverride={vi.fn()}
        onSetEnabled={vi.fn()}
        onRemoveOverride={vi.fn()}
      />
    );
    expect(screen.getByText("custom")).toBeInTheDocument();
  });

  it("fires onAddOverride when the Override button is clicked", () => {
    const onAddOverride = vi.fn();
    render(
      <InstrumentationRow
        instrumentation={makeInst()}
        override={undefined}
        onAddOverride={onAddOverride}
        onSetEnabled={vi.fn()}
        onRemoveOverride={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Override Cassandra Driver/ }));
    expect(onAddOverride).toHaveBeenCalledTimes(1);
  });

  it("fires onSetEnabled with the new value when toggling state", () => {
    const onSetEnabled = vi.fn();
    render(
      <InstrumentationRow
        instrumentation={makeInst()}
        override={{ enabled: true }}
        onAddOverride={vi.fn()}
        onSetEnabled={onSetEnabled}
        onRemoveOverride={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Disabled" }));
    expect(onSetEnabled).toHaveBeenCalledWith(false);
    fireEvent.click(screen.getByRole("button", { name: "Enabled" }));
    expect(onSetEnabled).toHaveBeenCalledWith(true);
  });

  it("fires onRemoveOverride when the remove button is clicked", () => {
    const onRemoveOverride = vi.fn();
    render(
      <InstrumentationRow
        instrumentation={makeInst()}
        override={{ enabled: false }}
        onAddOverride={vi.fn()}
        onSetEnabled={vi.fn()}
        onRemoveOverride={onRemoveOverride}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Remove override for Cassandra Driver/ }));
    expect(onRemoveOverride).toHaveBeenCalledTimes(1);
  });

  it("renders dotted IDs verbatim without round-tripping through parsePath", () => {
    render(
      <InstrumentationRow
        instrumentation={makeInst({ name: "akka-http-10.0", display_name: "Akka HTTP 10.0" })}
        override={undefined}
        onAddOverride={vi.fn()}
        onSetEnabled={vi.fn()}
        onRemoveOverride={vi.fn()}
      />
    );
    expect(screen.getByText("akka-http-10.0")).toBeInTheDocument();
    expect(screen.getByText("Akka HTTP 10.0")).toBeInTheDocument();
  });
});
