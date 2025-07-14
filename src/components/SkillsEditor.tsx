import { component$, useSignal, $, useTask$, type QRL } from '@builder.io/qwik';
import { icons } from './Editing/icons';

interface SkillsEditorProps {
    value: string;
    onInput$: QRL<(value: string) => void>;
    error?: string;
    isSaving?: boolean;
    showSaved?: boolean;
}

export const SkillsEditor = component$<SkillsEditorProps>(({ value, onInput$, error, isSaving, showSaved }) => {
    const skills = useSignal<string[]>([]);
    const newSkill = useSignal('');

    // Inicializar skills do JSON quando o valor mudar
    useTask$(({ track }) => {
        track(() => value);

        try {
            // Se for uma string que representa um array JSON
            if (value.startsWith('[')) {
                skills.value = JSON.parse(value);
            }
            // Se for uma string com valores separados por vírgula
            else if (typeof value === 'string' && value.includes(',')) {
                skills.value = value.split(',').map(s => s.trim()).filter(Boolean);
            }
            // Se for uma string única
            else if (typeof value === 'string' && value.trim()) {
                skills.value = [value.trim()];
            }
            // Caso contrário, array vazio
            else {
                skills.value = [];
            }
        } catch {
            skills.value = [];
        }
    });

    const handleSaveSkills = $(() => {
        // Garante que estamos salvando um array JSON válido
        const cleanSkills = skills.value
            .map(s => s.trim())
            .filter(Boolean)
            .filter((s, i, arr) => arr.indexOf(s) === i); // Remove duplicatas
        onInput$(JSON.stringify(cleanSkills));
    });

    const handleAddSkill = $(() => {
        if (!newSkill.value.trim()) return;
        
        // Verifica se a skill já existe
        if (skills.value.includes(newSkill.value.trim())) {
            return;
        }
        
        const updatedSkills = [...skills.value, newSkill.value.trim()];
        skills.value = updatedSkills;
        newSkill.value = '';
        
        handleSaveSkills();
    });

    const handleRemoveSkill = $((index: number) => {
        const updatedSkills = [...skills.value];
        updatedSkills.splice(index, 1);
        skills.value = updatedSkills;
        
        handleSaveSkills();
    });

    return (
        <div class="space-y-4">
            {/* Lista de habilidades como inputs */}
            <div class="grid gap-3">
                {skills.value.map((skill, index) => (
                    <div key={index} class="flex items-center gap-3">
                        <div class="flex-1 relative">
                            <input
                                type="text"
                                value={skill}
                                onInput$={(e) => {
                                    const target = e.target as HTMLInputElement;
                                    const updatedSkills = [...skills.value];
                                    updatedSkills[index] = target.value;
                                    skills.value = updatedSkills;
                                    handleSaveSkills();
                                }}
                                class="w-full px-4 py-3 bg-[--noir-core] rounded-lg border-2 border-gray-600 hover:border-[--secondary] focus:border-[--secondary] text-[--blanc-core] focus:outline-none transition-all duration-300 placeholder-gray-500"
                                placeholder="Digite uma habilidade"
                            />
                        </div>
                        <button
                            type="button"
                            onClick$={() => handleRemoveSkill(index)}
                            class="p-3 rounded-lg text-gray-400 hover:text-[--error] transition-colors duration-300"
                            title="Remover habilidade"
                        >
                            <span dangerouslySetInnerHTML={icons.close} />
                        </button>
                    </div>
                ))}
                {/* Input para adicionar nova habilidade */}
                <div class="flex items-center gap-3">
                    <div class="flex-1 relative">
                        <input
                            type="text"
                            value={newSkill.value}
                            onInput$={(e) => {
                                const target = e.target as HTMLInputElement;
                                newSkill.value = target.value;
                            }}
                            onKeyUp$={(e) => {
                                const event = e as KeyboardEvent;
                                if (event.key === 'Enter' && newSkill.value.trim()) {
                                    handleAddSkill();
                                }
                            }}
                            class="w-full px-4 py-3 bg-[--noir-core] rounded-lg border-2 border-dashed border-gray-600 hover:border-[--secondary] focus:border-[--secondary] text-[--blanc-core] focus:outline-none transition-all duration-300 placeholder-gray-500"
                            placeholder="+ Adicionar nova habilidade"
                        />
                    </div>
                    <button
                        type="button"
                        onClick$={handleAddSkill}
                        class="p-3 rounded-lg text-gray-400 hover:text-[--secondary] transition-colors duration-300"
                        title="Adicionar habilidade"
                    >
                        <span dangerouslySetInnerHTML={icons.add} />
                    </button>
                </div>
            </div>


            {error && <p class="text-[--error] text-sm">{error}</p>}

            <div class={`flex items-center gap-2 text-sm transition-all duration-300 ${(isSaving || showSaved) && !error ? 'opacity-100' : 'opacity-0'}`}>
                {isSaving ? (
                    <span class="text-gray-500 font-medium">saving...</span>
                ) : showSaved ? (
                    <span class="text-green-500 font-medium flex items-center gap-1">
                        <span dangerouslySetInnerHTML={icons.check} />
                        saved
                    </span>
                ) : null}
            </div>
        </div>
    );
});
