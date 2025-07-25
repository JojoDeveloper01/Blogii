import { component$, type Signal, $ } from '@builder.io/qwik';
import { TITLE_REGEX, validateTitle } from '@/lib/utils';
import { generateShortNumericId } from '@/lib/utils';

interface TitleInputBaseProps {
    value: Signal<string>;
    placeholder?: string;
    style?: string;
    onInput$: (value: string) => void;
    onEnter$?: () => void; // Add this prop
}

export const TitleInputBase = component$<TitleInputBaseProps>(({
    value,
    placeholder = "Start your idea here...",
    style,
    onInput$,
    onEnter$
}) => {

    const generateId = generateShortNumericId();    

    const handleBeforeInput = $((event: InputEvent) => {
        const input = event.data;
        if (input && !TITLE_REGEX.test(input)) {
            event.preventDefault();
        }
    });

    const handleInput = $((e: Event) => {
        const input = (e.target as HTMLInputElement).value;
        const { isValid, sanitized } = validateTitle(input);
        if (!isValid && input.length > 0) {
            e.preventDefault();
            return;
        }
        value.value = sanitized;
        onInput$(sanitized);
    });

    const handlePaste = $((e: ClipboardEvent) => {
        e.preventDefault();
        const pastedText = e.clipboardData?.getData('text') || '';
        const { isValid, sanitized } = validateTitle(pastedText);
        if (!isValid && pastedText.length > 0) {
            return;
        }
        value.value = sanitized;
        onInput$(sanitized);
    });

    const handleKeyDown = $((e: KeyboardEvent) => {
        if (e.key === 'Enter' && onEnter$) {
            e.preventDefault();
            const { isValid } = validateTitle(value.value);
            if (!isValid) return;
            onEnter$();
        }
    });

    return (
        <>
            <label for={`blog-title-${generateId}`} class="sr-only">Blog Title</label>
            <input
                id={`blog-title-${generateId}`}
                type="text"
                value={value.value}
                onBeforeInput$={handleBeforeInput}
                onInput$={handleInput}
                onPaste$={handlePaste}
                onKeyDown$={handleKeyDown}
                class={
                    'flex-1 px-4 py-1 text-lg font-medium border-2 border-transparent focus:outline-none focus:ring-0 rounded-lg transition-colors' +
                    ' dark:bg-zinc-700 dark:text-white hover:border-secondary/50'
                }
                style={style}
                placeholder={placeholder}
            />
        </>
    );
});
