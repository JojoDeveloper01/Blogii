import { component$, type Signal, $ } from '@builder.io/qwik';
import { TITLE_REGEX, validateTitle } from '@lib/utils';

interface TitleInputBaseProps {
    value: Signal<string>;
    placeholder?: string;
    className?: string;
    onInput$: (value: string) => void;
    onEnter$?: () => void; // Add this prop
}

export const TitleInputBase = component$<TitleInputBaseProps>(({
    value,
    placeholder = "Start your idea here...",
    className = "",
    onInput$,
    onEnter$
}) => {
    const handleBeforeInput = $((event: InputEvent) => {
        const input = event.data;
        if (input && !TITLE_REGEX.test(input)) {
            event.preventDefault();
        }
    });

    const handleInput = $((e: Event) => {
        const input = (e.target as HTMLInputElement).value;
        const { sanitized } = validateTitle(input);
        value.value = sanitized;
        onInput$(sanitized);
    });

    const handlePaste = $((e: ClipboardEvent) => {
        e.preventDefault();
        const pastedText = e.clipboardData?.getData('text') || '';
        const { sanitized } = validateTitle(pastedText);
        value.value = sanitized;
        onInput$(sanitized);
    });

    const handleKeyDown = $((e: KeyboardEvent) => {
        if (e.key === 'Enter' && onEnter$) {
            e.preventDefault();
            onEnter$();
        }
    });

    return (
        <input
            type="text"
            value={value.value}
            onBeforeInput$={handleBeforeInput}
            onInput$={handleInput}
            onPaste$={handlePaste}
            onKeyDown$={handleKeyDown}
            class={className}
            placeholder={placeholder}
        />
    );
});
