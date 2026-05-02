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
import type { InstrumentationData } from "@/types/javaagent";
import type { ConfigurationBuilderState } from "@/types/configuration-builder";

const setValueByPath = vi.fn();
const setEnabled = vi.fn();
const removeMapEntry = vi.fn();

let mockBuilderState: ConfigurationBuilderState;

vi.mock("@/hooks/use-configuration-builder", () => ({
  useConfigurationBuilder: () => ({
    state: mockBuilderState,
    setValueByPath: (...args: unknown[]) => setValueByPath(...args),
    setEnabled: (...args: unknown[]) => setEnabled(...args),
    removeMapEntry: (...args: unknown[]) => removeMapEntry(...args),
    setValue: vi.fn(),
    selectPlugin: vi.fn(),
    addListItem: vi.fn(),
    removeListItem: vi.fn(),
    setMapEntry: vi.fn(),
    resetToDefaults: vi.fn(),
    enableAllSections: vi.fn(),
    loadFromYaml: vi.fn(),
    validateField: vi.fn(),
    validateAll: vi.fn(),
    clearValidationError: vi.fn(),
  }),
}));

const useInstrumentationsMock = vi.fn();
vi.mock("@/hooks/use-javaagent-data", () => ({
  useInstrumentations: (version: string) => useInstrumentationsMock(version),
}));

import { InstrumentationBrowser } from "./instrumentation-browser";

const FIXTURE: InstrumentationData[] = [
  {
    name: "cassandra-4.4",
    display_name: "Cassandra Driver",
    description: "Database client spans + metrics for the DataStax Cassandra Driver.",
    disabled_by_default: false,
    scope: { name: "io.opentelemetry.cassandra-4.4" },
  },
  {
    name: "akka-http-10.0",
    display_name: "Akka HTTP 10.0",
    description: "HTTP client + server spans for Akka HTTP.",
    disabled_by_default: false,
    scope: { name: "io.opentelemetry.akka-http-10.0" },
  },
  {
    name: "jmx-metrics",
    display_name: "JMX Metrics",
    description: "Built-in JMX metric gatherer.",
    disabled_by_default: true,
    _is_custom: true,
    scope: { name: "io.opentelemetry.jmx-metrics" },
  },
];

function emptyState(): ConfigurationBuilderState {
  return {
    version: "1.0.0",
    values: {},
    enabledSections: {},
    validationErrors: {},
    isDirty: false,
    listItemIds: {},
  };
}

beforeEach(() => {
  setValueByPath.mockReset();
  setEnabled.mockReset();
  removeMapEntry.mockReset();
  mockBuilderState = emptyState();
  useInstrumentationsMock.mockReset();
});

describe("InstrumentationBrowser", () => {
  it("renders loading copy while loading", () => {
    useInstrumentationsMock.mockReturnValue({ data: null, loading: true, error: null });
    render(<InstrumentationBrowser version="1.0.0" search="" statusFilter="all" />);
    expect(screen.getByText(/Loading instrumentations/i)).toBeInTheDocument();
  });

  it("renders error copy when the load fails", () => {
    useInstrumentationsMock.mockReturnValue({
      data: null,
      loading: false,
      error: new Error("boom"),
    });
    render(<InstrumentationBrowser version="1.0.0" search="" statusFilter="all" />);
    expect(screen.getByText(/Failed to load instrumentations/i)).toBeInTheDocument();
  });

  it("renders all instrumentations from the fixture", () => {
    useInstrumentationsMock.mockReturnValue({ data: FIXTURE, loading: false, error: null });
    render(<InstrumentationBrowser version="1.0.0" search="" statusFilter="all" />);
    expect(screen.getByText("Cassandra Driver")).toBeInTheDocument();
    expect(screen.getByText("Akka HTTP 10.0")).toBeInTheDocument();
    expect(screen.getByText("JMX Metrics")).toBeInTheDocument();
  });

  it("filters by name (case-insensitive)", () => {
    useInstrumentationsMock.mockReturnValue({ data: FIXTURE, loading: false, error: null });
    render(<InstrumentationBrowser version="1.0.0" search="cassandra" statusFilter="all" />);
    expect(screen.getByText("Cassandra Driver")).toBeInTheDocument();
    expect(screen.queryByText("Akka HTTP 10.0")).toBeNull();
    expect(screen.queryByText("JMX Metrics")).toBeNull();
  });

  it("filters by description substring", () => {
    useInstrumentationsMock.mockReturnValue({ data: FIXTURE, loading: false, error: null });
    render(<InstrumentationBrowser version="1.0.0" search="JMX metric" statusFilter="all" />);
    expect(screen.getByText("JMX Metrics")).toBeInTheDocument();
    expect(screen.queryByText("Cassandra Driver")).toBeNull();
  });

  it("statusFilter='overridden' shows only overridden rows", () => {
    mockBuilderState = {
      ...emptyState(),
      values: {
        "instrumentation/development": {
          java: {
            "cassandra-4.4": { enabled: false },
          },
        },
      },
    };
    useInstrumentationsMock.mockReturnValue({ data: FIXTURE, loading: false, error: null });
    render(<InstrumentationBrowser version="1.0.0" search="" statusFilter="overridden" />);
    expect(screen.getByText("Cassandra Driver")).toBeInTheDocument();
    expect(screen.queryByText("Akka HTTP 10.0")).toBeNull();
    expect(screen.queryByText("JMX Metrics")).toBeNull();
  });

  it("renders the empty-search copy when nothing matches", () => {
    useInstrumentationsMock.mockReturnValue({ data: FIXTURE, loading: false, error: null });
    render(<InstrumentationBrowser version="1.0.0" search="nope-zzz" statusFilter="all" />);
    expect(screen.getByText(/No instrumentations match/)).toBeInTheDocument();
    expect(screen.getByText(/Clear the search to show all 3/)).toBeInTheDocument();
  });

  it("header readout reflects total and override count", () => {
    mockBuilderState = {
      ...emptyState(),
      values: {
        "instrumentation/development": {
          java: {
            "cassandra-4.4": { enabled: false },
          },
        },
      },
    };
    useInstrumentationsMock.mockReturnValue({ data: FIXTURE, loading: false, error: null });
    render(<InstrumentationBrowser version="1.0.0" search="" statusFilter="all" />);
    expect(screen.getByText(/3 total/)).toBeInTheDocument();
    expect(screen.getByText(/1 overridden/)).toBeInTheDocument();
    expect(screen.getByText(/No filter · 3 instrumentations/)).toBeInTheDocument();
  });

  it("clicking + Override writes the opposite-of-default and enables the section", () => {
    useInstrumentationsMock.mockReturnValue({ data: FIXTURE, loading: false, error: null });
    render(<InstrumentationBrowser version="1.0.0" search="cassandra" statusFilter="all" />);
    fireEvent.click(screen.getByRole("button", { name: /Override Cassandra Driver/ }));
    // cassandra-4.4 is enabled-by-default → starting override is enabled: false
    expect(setValueByPath).toHaveBeenCalledWith(
      ["instrumentation/development", "java", "cassandra-4.4"],
      { enabled: false }
    );
    expect(setEnabled).toHaveBeenCalledWith("instrumentation/development", true);
  });

  it("clicking + Override on a disabled-by-default row writes enabled: true", () => {
    useInstrumentationsMock.mockReturnValue({ data: FIXTURE, loading: false, error: null });
    render(<InstrumentationBrowser version="1.0.0" search="jmx" statusFilter="all" />);
    fireEvent.click(screen.getByRole("button", { name: /Override JMX Metrics/ }));
    expect(setValueByPath).toHaveBeenCalledWith(
      ["instrumentation/development", "java", "jmx-metrics"],
      { enabled: true }
    );
  });

  it("toggling an existing override writes only the enabled leaf", () => {
    mockBuilderState = {
      ...emptyState(),
      values: {
        "instrumentation/development": {
          java: { "cassandra-4.4": { enabled: false } },
        },
      },
    };
    useInstrumentationsMock.mockReturnValue({ data: FIXTURE, loading: false, error: null });
    render(<InstrumentationBrowser version="1.0.0" search="cassandra" statusFilter="all" />);
    fireEvent.click(screen.getByRole("button", { name: "Enabled" }));
    expect(setValueByPath).toHaveBeenCalledWith(
      ["instrumentation/development", "java", "cassandra-4.4", "enabled"],
      true
    );
  });

  it("removing an override calls removeMapEntry to actually delete the key", () => {
    mockBuilderState = {
      ...emptyState(),
      values: {
        "instrumentation/development": {
          java: { "cassandra-4.4": { enabled: false } },
        },
      },
    };
    useInstrumentationsMock.mockReturnValue({ data: FIXTURE, loading: false, error: null });
    render(<InstrumentationBrowser version="1.0.0" search="cassandra" statusFilter="all" />);
    fireEvent.click(screen.getByRole("button", { name: /Remove override for Cassandra Driver/ }));
    // removeMapEntry truly deletes the key — the section flag is then driven
    // by the mirror effect in InstrumentationTabBody, not by the browser.
    expect(removeMapEntry).toHaveBeenCalledWith(
      "instrumentation/development.java",
      "cassandra-4.4"
    );
    expect(setValueByPath).not.toHaveBeenCalled();
    expect(setEnabled).not.toHaveBeenCalled();
  });
});
