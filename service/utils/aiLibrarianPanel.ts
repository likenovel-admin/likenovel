import {
  getLocalStorage,
  removeLocalStorage,
  setLocalStorage,
  STORAGE_KEYS,
} from "@/utils/localStorage";

type AiLibrarianRouter = {
  push: (href: string, options?: { scroll?: boolean }) => void;
};

interface OpenAiLibrarianPanelOptions {
  isAuthenticated: boolean;
  router: AiLibrarianRouter;
  setIsOpen: (isOpen: boolean) => void;
  pendingProductQuestion?: AiLibrarianProductQuestion;
}

export interface AiLibrarianProductQuestion {
  productId: number;
  prompt: string;
}

export const hasAiLibrarianAuthToken = () => {
  if (typeof window === "undefined") return false;

  return !!(
    localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  );
};

export const queueAiLibrarianProductQuestionForLogin = (
  pendingProductQuestion: AiLibrarianProductQuestion
) => {
  if (!pendingProductQuestion.productId || !pendingProductQuestion.prompt.trim()) {
    return false;
  }

  return setLocalStorage(
    STORAGE_KEYS.AI_PENDING_PRODUCT_QUESTION,
    pendingProductQuestion
  );
};

export const consumeQueuedAiLibrarianProductQuestion = (
  expectedProductId?: number
): AiLibrarianProductQuestion | null => {
  const queued = getLocalStorage<AiLibrarianProductQuestion>(
    STORAGE_KEYS.AI_PENDING_PRODUCT_QUESTION
  );
  const productId = Number(queued?.productId);
  const prompt = typeof queued?.prompt === "string" ? queued.prompt.trim() : "";

  if (!productId || !prompt) {
    removeLocalStorage(STORAGE_KEYS.AI_PENDING_PRODUCT_QUESTION);
    return null;
  }

  if (expectedProductId && productId !== expectedProductId) return null;

  removeLocalStorage(STORAGE_KEYS.AI_PENDING_PRODUCT_QUESTION);
  return { productId, prompt };
};

export const redirectToAiLibrarianLogin = (router: AiLibrarianRouter) => {
  if (typeof window === "undefined") return;

  const currentPath = window.location.pathname + window.location.search;
  setLocalStorage(STORAGE_KEYS.PREVIOUS_PAGE, currentPath);
  setLocalStorage(STORAGE_KEYS.AI_RECOMMEND_OPEN_AFTER_LOGIN, "Y");
  router.push("/login?modal=open", { scroll: false });
};

export const openAiLibrarianPanelOrLogin = ({
  isAuthenticated,
  router,
  setIsOpen,
  pendingProductQuestion,
}: OpenAiLibrarianPanelOptions) => {
  const isAuthNow = isAuthenticated || hasAiLibrarianAuthToken();
  if (!isAuthNow) {
    if (pendingProductQuestion) {
      queueAiLibrarianProductQuestionForLogin(pendingProductQuestion);
    }
    redirectToAiLibrarianLogin(router);
    return false;
  }

  setIsOpen(true);
  return true;
};
