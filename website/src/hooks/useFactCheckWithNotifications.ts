import { useFactCheck } from "./useFactCheck";
import { useNotification } from "./useNotification";

export const useFactCheckWithNotifications = () => {
  const factCheck = useFactCheck();
  const { success, error, info, warning, contextHolder } = useNotification();

  const submitFactCheckWithNotifications = async () => {
    if (!factCheck.title.trim() || !factCheck.content.trim()) {
      warning({
        message: "Missing Information",
        description: "Please provide both a title and content to fact-check.",
      });
      return;
    }

    info({
      message: "Starting Fact-Check",
      description: "Analyzing your statement for truthfulness...",
      duration: 2,
    });

    try {
      await factCheck.submitFactCheck();

      // Show success notification after fact-check completes
      setTimeout(() => {
        success({
          message: "Fact-Check Complete",
          description:
            "Your statement has been analyzed. Review the results below.",
        });
      }, 100);
    } catch {
      error({
        message: "Fact-Check Failed",
        description: "Unable to analyze the statement. Please try again.",
      });
    }
  };

  const resetWithNotification = () => {
    factCheck.resetForm();
    info({
      message: "Form Reset",
      description: "Ready for a new fact-check.",
    });
  };

  return {
    ...factCheck,
    submitFactCheck: submitFactCheckWithNotifications,
    resetForm: resetWithNotification,
    contextHolder,
    notifications: {
      success,
      error,
      info,
      warning,
    },
  };
};

