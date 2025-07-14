import type { UserField, UserInfo } from '@/lib/types';
import { component$, useSignal, $, useTask$ } from '@builder.io/qwik';
import { actions } from 'astro:actions';
import { ConfirmDialog } from './shared/ConfirmDialog';
import { SocialLinksEditor } from './SocialLinksEditor';
import { SkillsEditor } from './SkillsEditor';
import { icons } from './Editing/icons';

interface ValidationResponse {
    valid: boolean;
    message?: string;
}

interface ActionResponse<T = any> {
    data?: T;
    error?: {
        message: string;
        code?: string;
    };
}

interface EditableFieldProps {
    userID: string;
    field: UserField;
    name: string;
    type: string;
    value: any;
}

export const EditableField = component$<EditableFieldProps>(({ userID, field, name, type, value: initialValue }) => {
    const dialogRef = useSignal<HTMLDialogElement>();
    const value = useSignal(type === 'json' && field === 'skills' ? (Array.isArray(initialValue) ? JSON.stringify(initialValue) : '[]') : type === 'json' ? JSON.stringify(initialValue, null, 2) : initialValue);
    const error = useSignal('');
    const isValid = useSignal(true);
    const isDirty = useSignal(false);
    const isSaving = useSignal(false);
    const showSaved = useSignal(false);
    const saveTimeout = useSignal<number>();
    const updateTimeout = useSignal<number>();
    const savingIndex = useSignal<number>(-1);

    // Validar o campo quando o valor mudar
    useTask$(async ({ track }) => {
        track(() => value.value);

        if (!isDirty.value) return;

        try {
            let valueToValidate = value.value;
            if (type === 'json') {
                try {
                    valueToValidate = JSON.parse(value.value);
                } catch {
                    error.value = 'Invalid JSON format';
                    isValid.value = false;
                    return;
                }
            }

            const result = await actions.user.validateUserField({
                field,
                value: valueToValidate
            }) as ActionResponse<ValidationResponse>;

            if (result.error) {
                error.value = result.error.message;
                isValid.value = false;
                return;
            }

            isValid.value = result.data?.valid ?? false;
            error.value = isValid.value ? '' : (result.data?.message || 'Invalid value');
        } catch (err) {
            error.value = 'Validation failed';
            isValid.value = false;
        }
    });

    // Handler para mudança de valor
    const handleChange = $(async (event: Event) => {
        const target = event.target as HTMLInputElement;
        value.value = target.value;
        isDirty.value = true;
        showSaved.value = false;

        // Limpar timeout anterior
        window.clearTimeout(updateTimeout.value);

        // Mostrar saving imediatamente
        isSaving.value = true;

        // Esperar um pouco antes de salvar
        updateTimeout.value = window.setTimeout(async () => {
            // Validar e salvar enquanto digita
            if (!isDirty.value || !isValid.value) {
                isSaving.value = false;
                return;
            }

            const updateData: any = {
                id: userID
            };

            // Validar JSON antes de salvar
            if (type === 'json') {
                try {
                    updateData[field] = JSON.parse(value.value);
                } catch {
                    error.value = 'Invalid JSON format';
                    isSaving.value = false;
                    return;
                }
            } else {
                updateData[field] = value.value;
            }

            try {
                const result = await actions.user.updateUser(updateData) as ActionResponse<UserInfo>;

                if (result.error) {
                    error.value = result.error.message;
                    isSaving.value = false;
                    return;
                }

                isDirty.value = false;
                error.value = '';

                // Mostrar indicador de salvo
                isSaving.value = false;
                showSaved.value = true;
                window.clearTimeout(saveTimeout.value);
                saveTimeout.value = window.setTimeout(() => {
                    if (!error.value) {
                        showSaved.value = false;
                    }
                }, 1000);
            } catch (err) {
                error.value = 'Failed to update';
                isSaving.value = false;
            }
        }, 300);
    });

    return (
        <div class="relative group mb-6">
            <label class="block text-sm font-medium mb-2 text-[--secondary]">{name}</label>
            <div class="relative">
                <div class="relative">
                    {type === 'json' && field === 'social_links' ? (
                        <SocialLinksEditor
                            value={value.value || ''}
                            onInput$={(newValue, index) => {
                                savingIndex.value = index ?? -1;
                                const event = { target: { value: newValue } } as any;
                                handleChange(event);
                            }}
                            error={error.value}
                            isSaving={isSaving.value}
                            showSaved={showSaved.value}
                            savingIndex={savingIndex.value}
                        />
                    ) : type === 'json' && field === 'skills' ? (
                        <SkillsEditor
                            value={value.value || '[]'}
                            onInput$={(newValue) => {
                                const event = { target: { value: newValue } } as any;
                                handleChange(event);
                            }}
                            error={error.value}
                            isSaving={isSaving.value}
                            showSaved={showSaved.value}
                        />
                    ) : (
                        <div class="flex items-center gap-3">
                            <div class="relative flex-1">
                                <input
                                    type={type}
                                    value={value.value}
                                    onInput$={handleChange}
                                    class={`w-full px-4 py-3 bg-[--noir-core] rounded-lg border-2 ${error.value ? 'border-[--error]' : 'border-gray-600 hover:border-[--secondary] focus:border-[--secondary]'} text-[--blanc-core] focus:outline-none transition-all duration-300 placeholder-gray-500`}
                                />
                                <div class={`absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-sm transition-all duration-300 z-10 pointer-events-none ${(isSaving.value || showSaved.value) && !error.value ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}>
                                    {isSaving.value ? (
                                        <span class="text-gray-500 font-medium">saving...</span>
                                    ) : showSaved.value ? (
                                        <span class="text-green-500 font-medium flex items-center gap-1">
                                            <span dangerouslySetInnerHTML={icons.check} />
                                            saved
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                            {type === 'url' && field === 'avatar_url' && (
                                <button
                                    type="button"
                                    onClick$={() => (document.getElementById('preview-dialog') as HTMLDialogElement)?.showModal()}
                                    class="size-14 rounded-full border-2 border-transparent hover:border-[--secondary] overflow-hidden"
                                >
                                    <img src={value.value} alt="" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {type === 'url' && field === 'avatar_url' && (
                <ConfirmDialog
                    id="preview-dialog"
                    title="Profile Preview"
                    css="flex-col"
                >
                    <div class="p-4 bg-[--noir-core]">
                        <img
                            src={value.value}
                            alt="Profile Preview"
                            class="w-full rounded-lg shadow-xl border-2 border-[--blanc-core]/10"
                        />
                    </div>
                </ConfirmDialog>
            )}
            {error.value && <p class="text-[--error] text-sm mt-2 font-medium">{error.value}</p>}
        </div>
    );
});
