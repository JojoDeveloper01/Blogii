import { component$, useSignal, $, useTask$, type QRL } from '@builder.io/qwik';
import { icons } from './Editing/icons';

interface SocialLink {
    platform: string;
    url: string;
    error?: string;
}

interface SocialLinksEditorProps {
    value: string;
    onInput$: QRL<(value: string, index?: number) => void>;
    error?: string;
    isSaving?: boolean;
    showSaved?: boolean;
    savingIndex?: number;
}

export const SocialLinksEditor = component$<SocialLinksEditorProps>(({ value, onInput$, error, isSaving, showSaved, savingIndex }) => {
    const links = useSignal<SocialLink[]>([]);

    // Inicializar links do JSON quando o valor mudar
    useTask$(({ track }) => {
        track(() => value);

        try {
            const parsed = value ? JSON.parse(value) : {};
            // Converte o objeto em array de links
            links.value = Object.entries(parsed).map(([platform, url]) => ({
                platform,
                url: url as string
            }));
        } catch {
            links.value = [];
        }
    });

    const handleSaveLink = $((index: number) => {
        const link = links.value[index];
        if (!link.platform || !link.url) {
            const newLinks = [...links.value];
            newLinks[index] = {
                ...newLinks[index],
                error: 'Both platform and URL are required'
            };
            links.value = newLinks;
            return;
        }

        // Converte array em objeto antes de salvar
        const socialLinksObj = links.value.reduce((acc, link) => {
            if (link.platform && link.url) {
                acc[link.platform] = link.url;
            }
            return acc;
        }, {} as Record<string, string>);

        onInput$(JSON.stringify(socialLinksObj), index);
    });

    const handleRemoveLink = $((index: number) => {
        const newLinks = [...links.value];
        newLinks.splice(index, 1);
        links.value = newLinks;

        // Converte array em objeto antes de salvar
        const socialLinksObj = newLinks.reduce((acc, link) => {
            if (link.platform && link.url) {
                acc[link.platform] = link.url;
            }
            return acc;
        }, {} as Record<string, string>);

        onInput$(JSON.stringify(socialLinksObj));
    });

    const handleAddLink = $(() => {
        const newLinks = [...links.value];
        newLinks.push({
            platform: '',
            url: ''
        });
        links.value = newLinks;
    });

    return (
        <div class="space-y-4">
            {links.value.map((link, index) => (
                <div key={index} class="flex flex-col sm:flex-row gap-3">
                    <div class="flex-1 relative">
                        <input
                            type="text"
                            value={link.platform}
                            onInput$={(e) => {
                                const target = e.target as HTMLInputElement;
                                const newLinks = [...links.value];
                                const newLink = {
                                    ...newLinks[index],
                                    platform: target.value,
                                    error: ''
                                };
                                newLinks[index] = newLink;
                                links.value = newLinks;

                                // Salva automaticamente se ambos os campos estiverem preenchidos
                                if (newLink.platform && newLink.url) {
                                    handleSaveLink(index);
                                }
                            }}
                            onKeyUp$={(e) => {
                                const event = e as KeyboardEvent;
                                if (event.key === 'Enter' && !link.error) {
                                    handleSaveLink(index);
                                }
                            }}
                            class={`w-full px-4 py-3 bg-[--noir-core] rounded-lg border-2 ${link.error ? 'border-[--error]' : 'border-[--bg-color] hover:border-[--secondary] focus:border-[--secondary]'} text-[--blanc-core] focus:outline-none transition-all duration-300 placeholder-gray-500`}
                            placeholder="Platform"
                        />
                    </div>
                    <div class="flex-[2] relative">
                        <input
                            type="url"
                            value={link.url}
                            onInput$={(e) => {
                                const target = e.target as HTMLInputElement;
                                const newLinks = [...links.value];
                                const newLink = {
                                    ...newLinks[index],
                                    url: target.value,
                                    error: ''
                                };
                                newLinks[index] = newLink;
                                links.value = newLinks;

                                // Salva automaticamente se ambos os campos estiverem preenchidos
                                if (newLink.platform && newLink.url) {
                                    handleSaveLink(index);
                                }
                            }}
                            onKeyUp$={(e) => {
                                const event = e as KeyboardEvent;
                                if (event.key === 'Enter' && !link.error) {
                                    handleSaveLink(index);
                                }
                            }}
                            class={`w-full px-4 py-3 bg-[--noir-core] rounded-lg border-2 ${link.error ? 'border-[--error]' : 'border-[--bg-color] hover:border-[--secondary] focus:border-[--secondary]'} text-[--blanc-core] focus:outline-none transition-all duration-300 placeholder-gray-500`}
                            placeholder="URL"
                        />
                        {savingIndex === index && (
                            <div class={`absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-2 text-sm transition-all duration-300 z-10 pointer-events-none ${(isSaving || showSaved) ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}>
                                {isSaving ? (
                                    <span class="text-gray-500 font-medium">saving...</span>
                                ) : showSaved ? (
                                    <span class="text-green-500 font-medium flex items-center gap-1">
                                        <span dangerouslySetInnerHTML={icons.check} />
                                        saved
                                    </span>
                                ) : null}
                            </div>
                        )}
                    </div>
                    <div class="absolute right-0 flex items-center gap-4">
                        <button
                            type="button"
                            onClick$={() => handleRemoveLink(index)}
                            class="p-3 rounded-lg text-gray-400 hover:text-[--error] transition-colors duration-300"
                            title="Remove link"
                        >
                            <span dangerouslySetInnerHTML={icons.close} />
                        </button>
                    </div>
                    {link.error && <p class="text-[--error] text-sm mt-1">{link.error}</p>}
                </div>
            ))}
            {error && <p class="text-[--error] text-sm">{error}</p>}
            <button
                type="button"
                onClick$={handleAddLink}
                class="px-6 py-3 bg-[--noir-core] rounded-lg border-2 border-[--bg-color] hover:border-[--secondary] text-[--blanc-core] hover:bg-gradient-to-r hover:from-[--primary] hover:to-[--secondary] transition-all duration-300 flex items-center gap-2"
            >
                <span dangerouslySetInnerHTML={icons.add} />
                Add Social Link
            </button>
        </div>
    );
});
