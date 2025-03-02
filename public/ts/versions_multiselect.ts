import { Signal } from "signal-polyfill";
import {
    getSearchOptionsFromState,
    getSearchOptionsFromUrl,
    searchTextChanged,
    updateUrlFromSearchOptions,
} from "./mod_search_logic";
import { Mod } from "./mod_types";
import { initMultiselectElement } from "./multiselect";
import { clearInner, getElementById } from "./util";

export var SELECTED_VERSIONS = new Signal.State<[string, number][]>([]);

export function initVersionsMultiSelect(mod_data: Mod[]): void {
    const versionNums = new Set<number>();
    const versions: [string, number][] = [];
    for (let i = 0; i < mod_data.length; i++) {
        const m = mod_data[i];
        if (!versionNums.has(m.s_latestMCVersion)) {
            versions.push([m.latestMCVersion, m.s_latestMCVersion]);
        }
        versionNums.add(m.s_latestMCVersion);
    }

    versions.sort((a, b) => b[1] - a[1]); // descending
    // var options = ["option a", "option b", "option c"];
    getSearchOptionsFromUrl().versions;

    const showSnapshotsLabel = document.createElement("label");
    showSnapshotsLabel.textContent = "show snapshots";
    showSnapshotsLabel.classList.add("button");
    const showSnapshotsCheckbox = document.createElement("input");
    showSnapshotsCheckbox.type = "checkbox";
    showSnapshotsCheckbox.id = "snapshot_toggle";
    const getSnapshotsLabel = () => {
        showSnapshotsLabel.textContent = "show snapshots";
        showSnapshotsLabel.appendChild(showSnapshotsCheckbox);
        return showSnapshotsLabel;
    };

    const setSelectedVersions = (newVersions: [string, number][]) => {
        SELECTED_VERSIONS.set(newVersions);
        searchTextChanged(undefined, true);
        updateUrlFromSearchOptions({
            ...getSearchOptionsFromState(),
        });

        console.log(SELECTED_VERSIONS.get());
    };
    const initVersionsMultiselect = (
        versionsForMultiselect: [string, number][]
    ) => {
        clearInner(getElementById("version_multiselect"))
        initMultiselectElement({
            rootElement: getElementById("version_multiselect"),
            options: versionsForMultiselect,
            setSelectedValues: (setter) => {
                setSelectedVersions(setter(SELECTED_VERSIONS.get()));
            },
            currentValues: SELECTED_VERSIONS.get(),
            renderValue: (val) => val[0],
            key: (val) => val[1], // gets the version in num form,
            leadingChildren: [getSnapshotsLabel()],
        });
    };
    const snapshotRegex = /[a-z]/i;
    const anyAreSnapshots = (versionsToTest: [string, number][]) =>
        versionsToTest.some((v) => snapshotRegex.test(v[0]));
    const initialAreAnySnapshots = anyAreSnapshots(SELECTED_VERSIONS.get());
    initVersionsMultiselect(
        initialAreAnySnapshots
            ? versions
            : versions.filter((v) => !snapshotRegex.test(v[0]))
    );

    showSnapshotsCheckbox.checked = initialAreAnySnapshots;
    showSnapshotsCheckbox.addEventListener("change", (e) => {
        const shouldShowSnapshots = (e.target as HTMLInputElement).checked;
        clearInner(getElementById("version_multiselect"));

        const versionsForMultiselect = shouldShowSnapshots
            ? versions
            : versions.filter((v) => !snapshotRegex.test(v[0]));

        setSelectedVersions(
            shouldShowSnapshots
                ? SELECTED_VERSIONS.get()
                : SELECTED_VERSIONS.get().filter(
                      (v) => !snapshotRegex.test(v[0])
                  )
        );
        initVersionsMultiselect(versionsForMultiselect);
        console.log(shouldShowSnapshots, versionsForMultiselect, versions);
    });
}
export const filterByVersion = (results: Mod[]) => {
    if (SELECTED_VERSIONS.get() && SELECTED_VERSIONS.get().length > 0) {
        const selectedVersionStrings = SELECTED_VERSIONS.get().map(
            ([str, num]) => str
        );

        switch ((window as any).fiberVersionFilterMode) {
            case "allMatch":
                return results.filter((mod) =>
                    mod.mc_versions.every((val) =>
                        selectedVersionStrings.includes(val)
                    )
                );
            case "noneMatch":
                return results.filter((mod) =>
                    mod.mc_versions.every(
                        (val) => !selectedVersionStrings.includes(val)
                    )
                );
            default:
                return results.filter((mod) =>
                    mod.mc_versions.some((val) =>
                        selectedVersionStrings.includes(val)
                    )
                );
        }
    }
    return results;
};
