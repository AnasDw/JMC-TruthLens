import React from "react";
import { notification } from "antd";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

export type NotificationType = "success" | "error" | "warning" | "info";

interface NotificationOptions {
  message: string;
  description?: string;
  duration?: number;
  placement?:
    | "topLeft"
    | "topRight"
    | "bottomLeft"
    | "bottomRight"
    | "top"
    | "bottom";
}

export const useNotification = () => {
  const [api, contextHolder] = notification.useNotification({
    stack: {
      threshold: 3,
    },
    placement: "bottomRight",
    maxCount: 5,
  });

  const showNotification = (
    type: NotificationType,
    options: NotificationOptions
  ) => {
    const { message, description, duration = 4.5, placement } = options;

    const config = {
      message,
      description,
      duration,
      ...(placement && { placement }),
      style: {
        borderRadius: "12px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
      },
    };

    switch (type) {
      case "success":
        api.success({
          ...config,
          icon: React.createElement(CheckCircleOutlined, {
            style: { color: "#52c41a" },
          }),
        });
        break;
      case "error":
        api.error({
          ...config,
          icon: React.createElement(CloseCircleOutlined, {
            style: { color: "#ff4d4f" },
          }),
        });
        break;
      case "warning":
        api.warning({
          ...config,
          icon: React.createElement(ExclamationCircleOutlined, {
            style: { color: "#faad14" },
          }),
        });
        break;
      case "info":
        api.info({
          ...config,
          icon: React.createElement(InfoCircleOutlined, {
            style: { color: "#1677ff" },
          }),
        });
        break;
      default:
        api.open(config);
    }
  };

  // Convenience methods for each type
  const success = (options: NotificationOptions) =>
    showNotification("success", options);
  const error = (options: NotificationOptions) =>
    showNotification("error", options);
  const warning = (options: NotificationOptions) =>
    showNotification("warning", options);
  const info = (options: NotificationOptions) =>
    showNotification("info", options);

  // Method to destroy all notifications
  const destroy = () => api.destroy();

  return {
    contextHolder,
    showNotification,
    success,
    error,
    warning,
    info,
    destroy,
  };
};

