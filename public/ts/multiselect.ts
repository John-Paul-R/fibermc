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
    leadingChildren?: HTMLElement[]
}>;

function uniqueBy<T, TKey>(arr: T[], key: (val: T) => TKey): T[] {
    return [...new Map(arr.map((item) => [key(item), item])).values()];
}

export function initMultiselectElement<TValue, TKey>({
    rootElement: _rootElement,
    options,
    setSelectedValues,
    currentValues,
    renderValue,
    key,
    leadingChildren
}: MultiSelectProps<TValue, TKey>) {
    const root = _rootElement as FiberElement;
    const equals = (a: TValue, b: TValue) => (key ? key(a) == key(b) : a == b);

    const toggleValue = (val: TValue, curValues: TValue[]) =>
        curValues.some((el) => equals(val, el))
            ? curValues.filter((el) => !equals(val, el))
            : [...curValues, val];

    _rootElement.style.maxHeight = "60vh";
    _rootElement.style.overflow = "auto";

    leadingChildren?.forEach(el => root.appendChild(el));
    const getOptionElements = () => [
        ..._rootElement.children,
    ].slice(leadingChildren?.length ?? 0) as MultiSelectValueElement<TValue>[];

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
                getOptionElements().forEach((el) => {
                    const isSelected = newValues.some((val) =>
                        equals(val, el._fibermc_optionValue)
                    );
                    el._fibermc_setChecked(isSelected);
                });
                console.log(e);
            };
            check.addEventListener("change", element._fibermc_onSelect);

            if (currentValues?.some((val) => equals(val, optionValue))) {
                element._fibermc_setChecked(true);
            }

            element.classList.add("button");
            return element;
        })
        .forEach((el) => root.appendChild(el));
}

export function MultiSelect<TValue, TKey>({
    rootElement: _rootElement,
    options,
    setSelectedValues,
    currentValues,
}: MultiSelectProps<TValue, TKey>) {
    const rootElement = _rootElement as FiberElement;
    if (!rootElement._fibermc_initialized) {
        rootElement._fibermc_initialized = true;
    }
}
