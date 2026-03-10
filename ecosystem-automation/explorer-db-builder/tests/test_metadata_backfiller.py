# Copyright The OpenTelemetry Authors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
"""Tests for metadata backfiller."""

from explorer_db_builder.metadata_backfiller import backfill_metadata
from semantic_version import Version


class TestBackfillMetadata:
    def test_backfill_missing_display_name_in_early_versions(self):
        """Backfills display_name from later version to earlier versions."""
        versions = [Version("1.1.0"), Version("1.2.0"), Version("1.3.0"), Version("1.4.0")]

        inventories = {
            Version("1.1.0"): {
                "file_format": 0.2,
                "libraries": [{"name": "akka-http", "description": "Akka HTTP instrumentation"}],
            },
            Version("1.2.0"): {
                "file_format": 0.2,
                "libraries": [{"name": "akka-http", "description": "Akka HTTP instrumentation"}],
            },
            Version("1.3.0"): {
                "file_format": 0.2,
                "libraries": [{"name": "akka-http", "description": "Akka HTTP instrumentation"}],
            },
            Version("1.4.0"): {
                "file_format": 0.2,
                "libraries": [
                    {
                        "name": "akka-http",
                        "display_name": "Akka HTTP",
                        "description": "Akka HTTP instrumentation",
                    }
                ],
            },
        }

        def load_fn(version):
            return inventories[version]

        result = backfill_metadata(versions, load_fn)

        assert result[Version("1.1.0")]["libraries"][0]["display_name"] == "Akka HTTP"
        assert result[Version("1.2.0")]["libraries"][0]["display_name"] == "Akka HTTP"
        assert result[Version("1.3.0")]["libraries"][0]["display_name"] == "Akka HTTP"
        assert result[Version("1.4.0")]["libraries"][0]["display_name"] == "Akka HTTP"

    def test_changing_values_across_versions(self):
        """When values change, only backfill to the point of change."""
        versions = [
            Version("1.1.0"),
            Version("1.2.0"),
            Version("1.3.0"),
            Version("1.4.0"),
            Version("1.5.0"),
        ]

        inventories = {
            Version("1.1.0"): {
                "file_format": 0.2,
                "libraries": [{"name": "akka-http"}],
            },
            Version("1.2.0"): {
                "file_format": 0.2,
                "libraries": [{"name": "akka-http"}],
            },
            Version("1.3.0"): {
                "file_format": 0.2,
                "libraries": [{"name": "akka-http"}],
            },
            Version("1.4.0"): {
                "file_format": 0.2,
                "libraries": [{"name": "akka-http", "display_name": "Akka HTTP"}],
            },
            Version("1.5.0"): {
                "file_format": 0.2,
                "libraries": [{"name": "akka-http", "display_name": "Akka HTTP Client"}],
            },
        }

        def load_fn(version):
            return inventories[version]

        result = backfill_metadata(versions, load_fn)

        assert result[Version("1.1.0")]["libraries"][0]["display_name"] == "Akka HTTP"
        assert result[Version("1.2.0")]["libraries"][0]["display_name"] == "Akka HTTP"
        assert result[Version("1.3.0")]["libraries"][0]["display_name"] == "Akka HTTP"
        assert result[Version("1.4.0")]["libraries"][0]["display_name"] == "Akka HTTP"
        assert result[Version("1.5.0")]["libraries"][0]["display_name"] == "Akka HTTP Client"

    def test_backfill_multiple_fields_and_libraries(self):
        """Backfills multiple fields independently across multiple libraries."""
        versions = [Version("1.1.0"), Version("1.2.0"), Version("1.3.0")]

        inventories = {
            Version("1.1.0"): {
                "file_format": 0.2,
                "libraries": [
                    {"name": "lib-a"},
                    {"name": "lib-b"},
                ],
            },
            Version("1.2.0"): {
                "file_format": 0.2,
                "libraries": [
                    {"name": "lib-a", "display_name": "Library A"},
                    {"name": "lib-b", "description": "Library B description"},
                ],
            },
            Version("1.3.0"): {
                "file_format": 0.2,
                "libraries": [
                    {"name": "lib-a", "display_name": "Library A"},
                    {
                        "name": "lib-b",
                        "display_name": "Library B",
                        "description": "Library B description",
                        "library_link": "https://example.com",
                    },
                ],
            },
        }

        def load_fn(version):
            return inventories[version]

        result = backfill_metadata(versions, load_fn)

        lib_a_1_1 = result[Version("1.1.0")]["libraries"][0]
        assert lib_a_1_1["display_name"] == "Library A"

        lib_b_1_1 = result[Version("1.1.0")]["libraries"][1]
        assert lib_b_1_1["display_name"] == "Library B"
        assert lib_b_1_1["description"] == "Library B description"
        assert lib_b_1_1["library_link"] == "https://example.com"

        lib_b_1_2 = result[Version("1.2.0")]["libraries"][1]
        assert lib_b_1_2["display_name"] == "Library B"
        assert lib_b_1_2["library_link"] == "https://example.com"

    def test_library_appearing_mid_timeline(self):
        """Library appearing mid-timeline doesn't backfill to non-existent earlier versions."""
        versions = [Version("1.1.0"), Version("1.2.0"), Version("1.3.0")]

        inventories = {
            Version("1.1.0"): {
                "file_format": 0.2,
                "libraries": [{"name": "existing-lib", "display_name": "Existing"}],
            },
            Version("1.2.0"): {
                "file_format": 0.2,
                "libraries": [
                    {"name": "existing-lib", "display_name": "Existing"},
                    {"name": "new-lib"},
                ],
            },
            Version("1.3.0"): {
                "file_format": 0.2,
                "libraries": [
                    {"name": "existing-lib", "display_name": "Existing"},
                    {"name": "new-lib", "display_name": "New Library"},
                ],
            },
        }

        def load_fn(version):
            return inventories[version]

        result = backfill_metadata(versions, load_fn)

        assert len(result[Version("1.1.0")]["libraries"]) == 1
        assert result[Version("1.1.0")]["libraries"][0]["name"] == "existing-lib"

        assert len(result[Version("1.2.0")]["libraries"]) == 2
        assert result[Version("1.2.0")]["libraries"][1]["display_name"] == "New Library"

    def test_field_removal(self):
        """Field removed in later version is not backfilled beyond removal point."""
        versions = [Version("1.1.0"), Version("1.2.0"), Version("1.3.0")]

        inventories = {
            Version("1.1.0"): {
                "file_format": 0.2,
                "libraries": [{"name": "test-lib"}],
            },
            Version("1.2.0"): {
                "file_format": 0.2,
                "libraries": [{"name": "test-lib", "display_name": "Test Library"}],
            },
            Version("1.3.0"): {
                "file_format": 0.2,
                "libraries": [{"name": "test-lib"}],
            },
        }

        def load_fn(version):
            return inventories[version]

        result = backfill_metadata(versions, load_fn)

        assert result[Version("1.1.0")]["libraries"][0]["display_name"] == "Test Library"
        assert result[Version("1.2.0")]["libraries"][0]["display_name"] == "Test Library"
        assert "display_name" not in result[Version("1.3.0")]["libraries"][0]

    def test_empty_string_treated_as_missing(self):
        """Empty strings are treated as missing and backfilled."""
        versions = [Version("1.1.0"), Version("1.2.0")]

        inventories = {
            Version("1.1.0"): {
                "file_format": 0.2,
                "libraries": [{"name": "test-lib", "display_name": ""}],
            },
            Version("1.2.0"): {
                "file_format": 0.2,
                "libraries": [{"name": "test-lib", "display_name": "Test Library"}],
            },
        }

        def load_fn(version):
            return inventories[version]

        result = backfill_metadata(versions, load_fn)

        assert result[Version("1.1.0")]["libraries"][0]["display_name"] == "Test Library"
        assert result[Version("1.2.0")]["libraries"][0]["display_name"] == "Test Library"
