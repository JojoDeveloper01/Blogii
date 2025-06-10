import { component$, type Signal, $ } from '@builder.io/qwik';
import { TITLE_REGEX, validateTitle } from '@lib/utils';

interface TitleInputBaseProps {
    value: Signal<string>;
    placeholder?: string;
    onInput$: (value: string) => void;
    onEnter$?: () => void; // Add this prop
}

export const TitleInputBase = component$<TitleInputBaseProps>(({
    value,
    placeholder = "Start your idea here...",
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
            class="flex-1 px-4 py-2 text-lg font-medium border-2 border-transparent focus:outline-none focus:ring-0 rounded-md transition-colors hover:border-gray-300"
            placeholder={placeholder}
        />
    );
});
