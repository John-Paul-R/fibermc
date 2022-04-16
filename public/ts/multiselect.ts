type FiberElement = HTMLElement & {
    _fibermc_initialized?: boolean;
};

type MultiSelectValueElement<TValue> = HTMLLabelElement & {
    _fibermc_optionValue: TValue;
    _fibermc_onSelect: () => void;
    _fibermc_setChecked: (checked: boolean) => void;
};

type MultiSelectProps<TValue, TKey> = Readonly<{
    rootElement: HTMLElement;
    options: TValue[];
    setSelectedValues: (
        setValues: (currentValues: TValue[]) => TValue[]
    ) => void;
    currentValues: TValue[] | undefined;
    renderValue: (val: TValue) => string;
    key?: (val: TValue) => TKey;
}>;

function uniqueBy<T, TKey>(arr: T[], key: (val: T) => TKey): T[] {
    return  [...new Map(arr.map(item =>
        [key(item), item])).values()];
}

export function initMultiselectElement<TValue, TKey>({
    rootElement: _rootElement,
    options,
    setSelectedValues,
    currentValues,
    renderValue,
    key,
}: MultiSelectProps<TValue, TKey>) {
    const root = _rootElement as FiberElement;
    const equals = (a: TValue, b: TValue) => key ? key(a) == key(b) : a == b;

    const toggleValue = (val: TValue, curValues: TValue[]) =>
        curValues.some(el => equals(val, el))
            ? curValues.filter((el) => !equals(val, el))
            : [...curValues, val];

    _rootElement.style.maxHeight = "60vh";
    _rootElement.style.overflow = "auto";

    
    options
    .map((optionValue) => {
            const element = document.createElement(
                "label"
            ) as MultiSelectValueElement<TValue>;

            const check = document.createElement("input");
            check.type = "checkbox";
            element.appendChild(check);

            const labelTextSpan = document.createElement("span");
            labelTextSpan.textContent = renderValue(optionValue) ?? "unknown";
            element.appendChild(labelTextSpan);

            element._fibermc_optionValue = optionValue;
            element._fibermc_setChecked = (checked: boolean) =>
                (check.checked = checked);

            //@ts-expect-error
            element._fibermc_onSelect = (e) => {
                let newValues: Array<TValue>;
                setSelectedValues((curValues) => {
                    newValues = toggleValue(optionValue, curValues);
                    if (key) {
                        newValues = uniqueBy(newValues, key);
                    }
                    return newValues;
                });
                (
                    [
                        ..._rootElement.children,
                    ] as MultiSelectValueElement<TValue>[]
                ).forEach((el) => {
                    if (newValues?.some(val => equals(val, el._fibermc_optionValue)) {
                        el._fibermc_setChecked(true);
                    } else {
                        el._fibermc_setChecked(false);
                    }
                });
                console.log(e);
            };
            check.addEventListener("change", element._fibermc_onSelect);

            if (currentValues?.some(val => equals(val, optionValue))) {
                // element._fibermc_onSelect();
                element._fibermc_setChecked(true);
            }

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
