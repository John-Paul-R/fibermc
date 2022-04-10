type FiberElement = HTMLElement & {
    _fibermc_initialized?: boolean;
};

type MultiSelectValueElement<TValue> = HTMLLabelElement & {
    _fibermc_optionValue: TValue;
    _fibermc_onSelect: () => void;
    _fibermc_setChecked: (checked: boolean) => void;
};

type MultiSelectProps<TValue> = Readonly<{
    rootElement: HTMLElement;
    options: TValue[];
    setSelectedValues: (
        setValues: (currentValues: TValue[]) => TValue[]
    ) => void;
    currentValues: TValue[] | undefined;
}>;

export function initMultiselectElement<TValue>({
    rootElement: _rootElement,
    options,
    setSelectedValues,
    currentValues,
}: MultiSelectProps<TValue>) {
    const root = _rootElement as FiberElement;

    const toggleValue = (val: TValue, curValues: TValue[]) =>
        curValues.includes(val)
            ? curValues.filter((el) => el != val)
            : [...curValues, val];

    options
        .map((optionValue) => {
            const element = document.createElement(
                "label"
            ) as MultiSelectValueElement<TValue>;

            const check = document.createElement("input");
            check.type = "checkbox";
            element.appendChild(check);

            const labelTextSpan = document.createElement("span");
            labelTextSpan.textContent = (optionValue as any) ?? "unknown";
            element.appendChild(labelTextSpan);

            element._fibermc_optionValue = optionValue;
            element._fibermc_setChecked = (checked: boolean) =>
                (check.checked = checked);

            //@ts-expect-error
            element._fibermc_onSelect = (e) => {
                let newValuesAsSet: Set<TValue>;
                setSelectedValues((curValues) => {
                    const newValues = toggleValue(optionValue, curValues);
                    newValuesAsSet = new Set(newValues);
                    return newValues;
                });
                (
                    [
                        ..._rootElement.children,
                    ] as MultiSelectValueElement<TValue>[]
                ).forEach((el) => {
                    if (newValuesAsSet.has(el._fibermc_optionValue)) {
                        el._fibermc_setChecked(true);
                    } else {
                        el._fibermc_setChecked(false);
                    }
                });
                console.log(e);
            };
            check.addEventListener("change", element._fibermc_onSelect);

            element.classList.add("button");
            return element;
        })
        .forEach((el) => root.appendChild(el));
}

export function MultiSelect<TValue>({
    rootElement: _rootElement,
    options,
    setSelectedValues,
    currentValues,
}: MultiSelectProps<TValue>) {
    const rootElement = _rootElement as FiberElement;
    if (!rootElement._fibermc_initialized) {
        rootElement._fibermc_initialized = true;
    }
}
