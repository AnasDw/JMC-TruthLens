// Chrome Extension API types for TypeScript
declare namespace chrome {
  namespace tabs {
    interface Tab {
      id?: number;
      url?: string;
      title?: string;
    }

    function sendMessage(tabId: number, message: any): Promise<any>;
    function query(queryInfo: any, callback: (tabs: Tab[]) => void): void;
  }

  namespace runtime {
    interface MessageSender {
      tab?: tabs.Tab;
      id?: string;
    }

    function sendMessage(message: any): void;
    const onMessage: {
      addListener(
        callback: (
          message: any,
          sender: MessageSender,
          sendResponse: (response?: any) => void
        ) => boolean | void
      ): void;
    };
    const onInstalled: {
      addListener(callback: () => void): void;
    };
    function getURL(path: string): string;
  }

  namespace contextMenus {
    interface CreateProperties {
      id: string;
      title: string;
      contexts: string[];
    }

    interface OnClickData {
      menuItemId: string;
      selectionText: string;
    }

    function create(createProperties: CreateProperties): void;
    const onClicked: {
      addListener(callback: (info: OnClickData, tab: tabs.Tab) => void): void;
    };
  }

  namespace scripting {
    interface ScriptInjection {
      target: { tabId: number };
      files: string[];
    }

    function executeScript(injection: ScriptInjection): Promise<any>;
  }

  namespace storage {
    interface StorageChange {
      oldValue?: any;
      newValue?: any;
    }

    interface StorageArea {
      set(items: { [key: string]: any }): Promise<void>;
      get(
        keys?: string | string[] | { [key: string]: any }
      ): Promise<{ [key: string]: any }>;
      remove(keys: string | string[]): Promise<void>;
      clear(): Promise<void>;
    }

    const local: StorageArea;
    const sync: StorageArea;

    const onChanged: {
      addListener(
        callback: (
          changes: { [key: string]: StorageChange },
          areaName: string
        ) => void
      ): void;
    };
  }
}

declare const chrome: typeof chrome;

