# Ant Design Notifications Setup

## Custom useNotification Hook

The `useNotification` hook provides a clean interface for showing toast notifications with consistent styling.

### Basic Usage

```tsx
import { useNotification } from "@/hooks/useNotification";

const MyComponent = () => {
  const { contextHolder, success, error, warning, info } = useNotification();

  const handleSuccess = () => {
    success({
      message: "Success!",
      description: "Operation completed successfully.",
    });
  };

  return (
    <>
      {contextHolder}
      <button onClick={handleSuccess}>Show Success</button>
    </>
  );
};
```

### Notification Types

- **Success**: `success({ message, description, duration, placement })`
- **Error**: `error({ message, description, duration, placement })`
- **Warning**: `warning({ message, description, duration, placement })`
- **Info**: `info({ message, description, duration, placement })`

### Enhanced FactCheck Hook

For integrated fact-checking with notifications:

```tsx
import { useFactCheckWithNotifications } from "@/hooks/useFactCheckWithNotifications";

const FactCheckComponent = () => {
  const {
    title,
    content,
    result,
    loading,
    setTitle,
    setContent,
    submitFactCheck,
    resetForm,
    contextHolder,
  } = useFactCheckWithNotifications();

  return (
    <>
      {contextHolder}
      {/* Your component JSX */}
    </>
  );
};
```

## Features

✅ **Consistent Styling**: All notifications use the same modern design
✅ **TypeScript Support**: Fully typed for better development experience  
✅ **Multiple Types**: Success, error, warning, and info notifications
✅ **Customizable**: Duration, placement, and content options
✅ **Stack Management**: Automatically manages multiple notifications
✅ **Integration Ready**: Works seamlessly with existing components

## Implementation Notes

1. **ContextHolder**: Must be included in JSX for notifications to render
2. **Auto-dismiss**: Notifications auto-dismiss after 4.5 seconds by default
3. **Stack Limit**: Maximum 5 notifications shown at once
4. **Placement**: Default position is top-right corner
5. **Icons**: Custom colored icons for each notification type
