import { acceptHMRUpdate, defineStore } from "pinia";
import { ref, computed } from "vue";

// 消息类型定义
export interface ChatMessage {
    id: number | string;
    role: string;
    type: string;
    content?: string;
    choices?: any[];
    loading?: boolean;
    pauseing?: boolean;
    isSpread?: boolean;
    thinkTime?: number | null;
    isThink?: boolean;
    isRepository?: boolean;
    tools?: string[];
    docs?: any;
}

// 会话消息状态接口
interface ChatMessagesState {
    messages: Record<string, ChatMessage[]>; // 按会话ID存储消息列表
    loading: Record<string, boolean>; // 按会话ID存储加载状态
    spinning: Record<string, boolean>; // 按会话ID存储spinning状态
    pauseing: Record<string, boolean>; // 按会话ID存储pauseing状态
}

/**
 * 会话消息管理Store
 * 用于管理各个会话的消息内容，实现会话消息隔离
 */
export const useChatMessagesStore = defineStore("chatMessages", () => {
    // 所有会话的消息管理
    const state = ref<ChatMessagesState>({
        messages: {},
        loading: {},
        spinning: {},
        pauseing: {},
    });

    /**
     * 初始化会话
     * @param chatId 会话ID
     */
    function initChat(chatId: string) {
        if (!state.value.messages[chatId]) {
            state.value.messages[chatId] = [];
        }
        if (state.value.loading[chatId] === undefined) {
            state.value.loading[chatId] = false;
        }
        if (state.value.spinning[chatId] === undefined) {
            state.value.spinning[chatId] = false;
        }
        if (state.value.pauseing[chatId] === undefined) {
            state.value.pauseing[chatId] = true;
        }
    }

    /**
     * 获取指定会话的消息列表
     * @param chatId 会话ID
     */
    function getMessages(chatId: string): ChatMessage[] {
        initChat(chatId);
        return state.value.messages[chatId];
    }

    /**
     * 设置指定会话的消息列表
     * @param chatId 会话ID
     * @param messages 消息列表
     */
    function setMessages(chatId: string, messages: ChatMessage[]) {
        initChat(chatId);
        state.value.messages[chatId] = messages;
    }

    /**
     * 添加消息到指定会话
     * @param chatId 会话ID
     * @param message 新消息
     */
    function addMessage(chatId: string, message: ChatMessage) {
        initChat(chatId);
        state.value.messages[chatId].push(message);
    }

    /**
     * 更新指定会话的最后一条消息
     * @param chatId 会话ID
     * @param message 更新的消息内容
     */
    function updateLastMessage(chatId: string, message: Partial<ChatMessage>) {
        initChat(chatId);
        const messages = state.value.messages[chatId];
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            state.value.messages[chatId][messages.length - 1] = {
                ...lastMessage,
                ...message,
            };
        }
    }

    /**
     * 获取指定会话的loading状态
     * @param chatId 会话ID
     */
    function getLoading(chatId: string): boolean {
        initChat(chatId);
        return state.value.loading[chatId];
    }

    /**
     * 设置指定会话的loading状态
     * @param chatId 会话ID
     * @param loading 是否加载中
     */
    function setLoading(chatId: string, loading: boolean) {
        initChat(chatId);
        state.value.loading[chatId] = loading;
    }

    /**
     * 获取指定会话的spinning状态
     * @param chatId 会话ID
     */
    function getSpinning(chatId: string): boolean {
        initChat(chatId);
        return state.value.spinning[chatId];
    }

    /**
     * 设置指定会话的spinning状态
     * @param chatId 会话ID
     * @param spinning 是否spinning
     */
    function setSpinning(chatId: string, spinning: boolean) {
        initChat(chatId);
        state.value.spinning[chatId] = spinning;
    }

    /**
     * 获取指定会话的pauseing状态
     * @param chatId 会话ID
     */
    function getPauseing(chatId: string): boolean {
        initChat(chatId);
        return state.value.pauseing[chatId];
    }

    /**
     * 设置指定会话的pauseing状态
     * @param chatId 会话ID
     * @param pauseing 是否pauseing
     */
    function setPauseing(chatId: string, pauseing: boolean) {
        initChat(chatId);
        state.value.pauseing[chatId] = pauseing;
    }

    /**
     * 清空指定会话的消息
     * @param chatId 会话ID
     */
    function clearMessages(chatId: string) {
        initChat(chatId);
        state.value.messages[chatId] = [];
    }

    /**
     * 清空所有会话的消息
     */
    function clearAllMessages() {
        state.value.messages = {};
        state.value.loading = {};
        state.value.spinning = {};
        state.value.pauseing = {};
    }

    return {
        state,
        initChat,
        getMessages,
        setMessages,
        addMessage,
        updateLastMessage,
        getLoading,
        setLoading,
        getSpinning,
        setSpinning,
        getPauseing,
        setPauseing,
        clearMessages,
        clearAllMessages,
    };
});

if (import.meta.hot) {
    import.meta.hot.accept(
        acceptHMRUpdate(useChatMessagesStore, import.meta.hot),
    );
}
