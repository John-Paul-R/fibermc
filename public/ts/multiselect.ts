type FiberElement = HTMLElement & {
    _fibermc_initialized?: boolean;
};

type MultiSelectValueElement<TValue> = HTMLLabelElement & {
    _fibermc_optionValue: TValue;
    _fibermc_onSelect: () => void;
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
            element._fibermc_optionValue = optionValue;
            element._fibermc_onSelect = () =>
                setSelectedValues((curValues) =>
                    toggleValue(optionValue, curValues)
                );
            const check = document.createElement("input");
            check.type = "checkbox";
            element.textContent = (optionValue as any) ?? "unknown";
            element.appendChild(check);
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
