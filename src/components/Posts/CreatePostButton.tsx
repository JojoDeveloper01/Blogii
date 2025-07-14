import { component$, useSignal, $ } from "@builder.io/qwik";
import { icons } from "@/components/Editing/icons";
import { ErrorMessage } from "@/components/ErrorMessage";
import { upgradeToCreateMoreBlogsAndPosts, signInToAccessAllFeatures } from "@/lib/consts";
import { AskAuthentication } from "@/components/AskAuthentication";

interface Props {
  blogId: string;
  lang: string;
  checkPostLimit: string;
}

export const CreatePostButton = component$<Props>(({ blogId, lang, checkPostLimit }) => {
  const showError = useSignal(false);
  const errorMessage = useSignal("");

  const handleClick = $(async () => {
    showError.value = false;
    await new Promise(resolve => setTimeout(resolve, 50));

    if (checkPostLimit === "post_limit") {
      errorMessage.value = upgradeToCreateMoreBlogsAndPosts(lang);
      showError.value = true;
      return;
    } else if (checkPostLimit === "sign_in") {
      errorMessage.value = signInToAccessAllFeatures;
      showError.value = true;
      return;
    } else if (checkPostLimit) {
      errorMessage.value = checkPostLimit;
      showError.value = true;
      return;
    }

    window.location.href = `/${lang}/dashboard/${blogId}/new`;
  });

  return (
    <>
      <button
        type="button"
        onClick$={handleClick}
        class="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-white rounded-md border border-gray-100/20 dark:border-white/10 hover:bg-[--primary] font-medium transition-colors duration-200"
      >
        <span dangerouslySetInnerHTML={icons.add}></span>
        <span>New</span>
      </button>

      <ErrorMessage
        className="text-sm"
        showError={{ value: showError.value }}
        showFloating={true}
      >
        {errorMessage.value === signInToAccessAllFeatures ? (
          <div class="flex items-center gap-2">
            <span>{errorMessage.value}</span>
            <AskAuthentication className="text-[--primary]" />
          </div>
        ) : (
          <div dangerouslySetInnerHTML={errorMessage.value} />
        )}
      </ErrorMessage>
    </>
  )
})
