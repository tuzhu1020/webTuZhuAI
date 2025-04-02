import { acceptHMRUpdate, defineStore } from "pinia";
import { ref } from "vue";

/**
 * 聊天流控制器接口
 */
interface IChatStream {
    id: string; // 会话ID
    controller: AbortController | null; // 流控制器
    active: boolean; // 是否激活
}

/**
 * 聊天流管理Store
 * 用于管理各个会话的流状态，实现会话之间的隔离
 */
export const useChatStreamsStore = defineStore("chatStreams", () => {
    // 所有聊天流的状态管理
    const chatStreams = ref<Record<string, IChatStream>>({});

    /**
     * 创建新的聊天流控制器
     * @param chatId 会话ID
     * @returns 聊天流控制器
     */
    function createStream(chatId: string): AbortController {
        // 如果当前已有流并且处于活动状态，先终止
        if (chatStreams.value[chatId]?.active) {
            abortStream(chatId);
        }

        // 创建新控制器
        const controller = new AbortController();

        // 更新状态
        chatStreams.value[chatId] = {
            id: chatId,
            controller,
            active: true,
        };

        return controller;
    }

    /**
     * 中止指定会话的流
     * @param chatId 会话ID
     */
    function abortStream(chatId: string): void {
        const stream = chatStreams.value[chatId];
        if (stream?.controller && !stream.controller.signal.aborted) {
            stream.controller.abort();
            stream.active = false;
        }
    }

    /**
     * 获取指定会话的流控制器
     * @param chatId 会话ID
     */
    function getStream(chatId: string): IChatStream | null {
        return chatStreams.value[chatId] || null;
    }

    /**
     * 检查指定会话是否有活动的流
     * @param chatId 会话ID
     */
    function hasActiveStream(chatId: string): boolean {
        const stream = chatStreams.value[chatId];
        return !!stream?.active;
    }

    /**
     * 终止所有活动的流
     */
    function abortAllStreams(): void {
        Object.keys(chatStreams.value).forEach((chatId) => {
            abortStream(chatId);
        });
    }

    return {
        chatStreams,
        createStream,
        abortStream,
        getStream,
        hasActiveStream,
        abortAllStreams,
    };
});

if (import.meta.hot) {
    import.meta.hot.accept(
        acceptHMRUpdate(useChatStreamsStore, import.meta.hot),
    );
}
