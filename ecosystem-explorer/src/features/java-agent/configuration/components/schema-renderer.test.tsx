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
import { render, screen } from "@testing-library/react";
import { SchemaRenderer } from "./schema-renderer";
import type { TextInputNode } from "@/types/configuration";

vi.mock("./controls/text-input-control", () => ({
  TextInputControl: ({ node }: { node: TextInputNode }) => <span>text:{node.key}</span>,
}));

vi.mock("@/hooks/use-configuration-builder", () => ({
  useConfigurationBuilder: () => ({
    state: {
      values: {},
      enabledSections: {},
      validationErrors: {},
      version: "1.0.0",
      isDirty: false,
    },
    setValue: vi.fn(),
  }),
}));

describe("SchemaRenderer", () => {
  it("dispatches leaves to their control component", () => {
    render(
      <SchemaRenderer
        node={{
          controlType: "text_input",
          key: "endpoint",
          label: "Endpoint",
          path: "endpoint",
        }}
        depth={1}
        path="endpoint"
      />
    );
    expect(screen.getByText("text:endpoint")).toBeInTheDocument();
  });
});
