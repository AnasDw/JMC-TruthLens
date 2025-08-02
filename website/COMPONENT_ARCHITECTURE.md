# TruthLens AI - Component Architecture

This document outlines the refactored component structure for the TruthLens AI chat interface.

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx          # Main page component
│   └── layout.tsx        # App layout
├── components/
│   ├── ChatSidebar.tsx   # Collapsible sidebar with conversation history
│   ├── ChatHeader.tsx    # Top header with branding and user controls
│   ├── WelcomeScreen.tsx # Initial welcome screen with sample prompts
│   ├── ChatMessages.tsx  # Container for message list
│   ├── MessageBubble.tsx # Individual message component
│   ├── ChatInput.tsx     # Message input area with send button
│   ├── FloatingActions.tsx # Floating action buttons
│   └── index.ts          # Component barrel exports
├── hooks/
│   └── useChat.ts        # Custom hook for chat functionality
├── types/
│   └── index.ts          # TypeScript type definitions
└── styles/
```

## 🧩 Components Overview

### 1. **ChatSidebar** (`ChatSidebar.tsx`)
- **Purpose**: Collapsible sidebar navigation
- **Features**: 
  - New chat button
  - Search conversations
  - Conversation history list
  - Responsive collapse/expand
- **Props**: `collapsed`, `onCollapse`, `conversationHistory`, `onNewChat`

### 2. **ChatHeader** (`ChatHeader.tsx`)
- **Purpose**: Top header with branding and controls
- **Features**:
  - TruthLens AI branding
  - Share conversation button
  - History access button
  - User menu dropdown
- **Props**: `title`, `onShareConversation`, `onViewHistory`, `onUserMenuClick`

### 3. **WelcomeScreen** (`WelcomeScreen.tsx`)
- **Purpose**: Initial landing screen
- **Features**:
  - Hero section with branding
  - Sample prompt cards
  - Interactive prompt selection
- **Props**: `samplePrompts`, `onPromptClick`

### 4. **ChatMessages** (`ChatMessages.tsx`)
- **Purpose**: Container for message list
- **Features**:
  - Scrollable message area
  - Proper spacing and layout
- **Props**: `messages`

### 5. **MessageBubble** (`MessageBubble.tsx`)
- **Purpose**: Individual message display
- **Features**:
  - User vs AI styling
  - Avatar indicators
  - Timestamps
  - Proper alignment
- **Props**: `message`

### 6. **ChatInput** (`ChatInput.tsx`)
- **Purpose**: Message input interface
- **Features**:
  - Auto-expanding textarea
  - Send button with disabled state
  - Keyboard shortcuts (Enter to send)
  - Loading state support
- **Props**: `value`, `onChange`, `onSend`, `disabled`, `placeholder`

### 7. **FloatingActions** (`FloatingActions.tsx`)
- **Purpose**: Floating action buttons
- **Features**:
  - Settings access
  - Tips/help access
- **Props**: `onSettingsClick`, `onTipsClick`

## 🎣 Custom Hooks

### **useChat** (`hooks/useChat.ts`)
- **Purpose**: Manages chat state and functionality
- **Features**:
  - Message state management
  - Input handling
  - Loading states
  - Message sending logic
  - Chat reset functionality
- **Returns**: `messages`, `inputValue`, `isLoading`, `setInputValue`, `sendMessage`, `resetChat`

## 📝 Types

### **Core Types** (`types/index.ts`)
- `Message`: Individual message structure
- `ChatSidebarProps`: Sidebar component props
- `ChatHeaderProps`: Header component props
- `WelcomeScreenProps`: Welcome screen props
- `ChatMessagesProps`: Message container props
- `MessageBubbleProps`: Individual message props
- `ChatInputProps`: Input component props
- `FloatingActionsProps`: Floating actions props

## 🔄 Data Flow

1. **Main Page** (`page.tsx`) orchestrates all components
2. **useChat hook** manages chat state centrally
3. **Components** receive props and emit events
4. **Types** ensure type safety across the application

## 🛠️ Benefits of Refactoring

### **Maintainability**
- Each component has a single responsibility
- Easy to locate and modify specific features
- Clear separation of concerns

### **Reusability**
- Components can be used in different contexts
- Props interface makes components flexible
- Easy to compose new layouts

### **Type Safety**
- Centralized type definitions
- Compile-time error catching
- Better IDE support and autocomplete

### **Testing**
- Components can be tested in isolation
- Props can be easily mocked
- Clear boundaries for unit tests

### **Performance**
- Components can be memoized individually
- Reduced re-render scope
- Better React DevTools debugging

## 🚀 Usage Example

```tsx
import { 
  ChatSidebar, 
  ChatHeader, 
  ChatMessages, 
  ChatInput 
} from '@/components';
import { useChat } from '@/hooks/useChat';

export default function ChatPage() {
  const { messages, inputValue, setInputValue, sendMessage } = useChat();
  
  return (
    <Layout>
      <ChatSidebar {...sidebarProps} />
      <Layout>
        <ChatHeader {...headerProps} />
        <Content>
          <ChatMessages messages={messages} />
          <ChatInput 
            value={inputValue}
            onChange={setInputValue}
            onSend={sendMessage}
          />
        </Content>
      </Layout>
    </Layout>
  );
}
```

## 🎨 Design Patterns Used

- **Container/Presentational Pattern**: Logic separated from UI
- **Custom Hooks Pattern**: Reusable stateful logic
- **Compound Components**: Related components working together
- **Props Interface Pattern**: Clear component contracts
- **Barrel Exports**: Clean import statements

This architecture provides a solid foundation for building and maintaining a modern, scalable chat interface.
