import { defineStore, acceptHMRUpdate } from "pinia";
import { ref, reactive } from "vue";
import { SEND_USER_MESSAGE_SERVICE } from "@/service/chat/index";
import { AI_IDENTITY_AI_VALUE } from "@/constant/enum";

interface ChatSession {
    controller: AbortController | null;
    loading: boolean;
    buffer: string;
    reader: ReadableStreamDefaultReader<Uint8Array> | null;
    response: Response | null;
    textDecoder: TextDecoder;
    lastChatItem: any;
    isPaused: boolean;
    isDone: boolean;
    startTime: number;
    model: string;
    isProcessing: boolean;
    docs: any[] | null;
    useNativeStream: boolean;
}

export const useChatStore = defineStore("chat", () => {
    // 存储每个会话ID对应的会话状态
    const chatSessions = reactive<Record<string, ChatSession>>({});

    // 当前活跃的会话ID
    const activeSessionId = ref<string>("");

    // 初始化一个会话
    function initSession(sessionId: string, model: string) {
        if (!chatSessions[sessionId]) {
            chatSessions[sessionId] = {
                controller: new AbortController(),
                loading: false,
                buffer: "",
                reader: null,
                response: null,
                textDecoder: new TextDecoder(),
                lastChatItem: null,
                isPaused: true,
                isDone: false,
                startTime: Date.now(),
                model,
                isProcessing: false,
                docs: null,
                useNativeStream: true,
            };
        }
        return chatSessions[sessionId];
    }

    // 开始一个会话的AI响应
    async function startChatSession(
        sessionId: string,
        messages: any[],
        userStore: any,
        model: string,
        docs = null,
    ) {
        console.log("开始会话:", sessionId, "模型:", model);
        const session = initSession(sessionId, model);
        session.loading = true;
        session.isPaused = false;
        session.isDone = false;
        session.isProcessing = false;
        session.startTime = Date.now();
        session.controller = new AbortController();
        session.docs = docs;
        session.useNativeStream = true;

        // 确保我们获取了有效的消息列表
        const validMessages = messages.filter((item) => item && item.content);
        console.log("有效消息数量:", validMessages.length);

        try {
            console.log("发送请求到:", SEND_USER_MESSAGE_SERVICE.url);
            session.response = await fetch(SEND_USER_MESSAGE_SERVICE.url, {
                signal: session.controller.signal,
                method: SEND_USER_MESSAGE_SERVICE.method,
                headers: {
                    ...SEND_USER_MESSAGE_SERVICE.headers,
                    Authorization: userStore.token,
                },
                body: JSON.stringify({
                    model,
                    messages: validMessages,
                    stream: true,
                }),
            });

            console.log("收到响应，状态:", session.response.status);

            // 检查HTTP状态码，处理认证失败等错误
            if (!session.response.ok) {
                const errorText = await session.response.text();
                let errorMessage = `请求失败: ${session.response.status} ${session.response.statusText}`;
                
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch {
                    errorMessage = errorText || errorMessage;
                }
                
                console.error("API请求失败:", session.response.status, errorMessage);
                
                // 抛出错误，让调用方处理
                throw new Error(`HTTP ${session.response.status}: ${errorMessage}`);
            }

            if (
                session.response.body &&
                typeof session.response.body.getReader === "function"
            ) {
                session.reader = session.response.body.getReader();
                session.useNativeStream = true;
                console.log("使用流式API读取数据");
            } else {
                // 对于不支持流式API的浏览器，直接获取完整响应
                console.log("浏览器不支持流式API，使用完整响应");
                session.useNativeStream = false;
                const text = await session.response.text();
                processFullResponse(text, sessionId, null);
            }

            return session;
        } catch (error: any) {
            console.error("开始会话失败:", error);
            session.loading = false;
            session.isPaused = true;
            return null;
        }
    }

    // 处理完整响应（非流式）
    function processFullResponse(
        text: string,
        sessionId: string,
        chatMessageList: any[] | null,
    ) {
        const session = chatSessions[sessionId];
        if (!session || !chatMessageList) return;

        const lines = text.split("\n");

        for (const line of lines) {
            if (line.trim()) {
                const data = parseJsonLikeData(line);
                if (data && !data.done && chatMessageList.length > 0) {
                    // 找到最后一个AI消息
                    const lastChatItem =
                        chatMessageList[chatMessageList.length - 1];
                    if (lastChatItem?.role === AI_IDENTITY_AI_VALUE) {
                        // 处理数据并更新UI
                        processChunk(
                            data,
                            lastChatItem,
                            session,
                            chatMessageList,
                        );
                    }
                }
            }
        }

        session.isDone = true;
        session.loading = false;
        session.isPaused = true;

        // 更新最后一条消息状态
        if (chatMessageList.length > 0) {
            const lastMessage = chatMessageList[chatMessageList.length - 1];
            if (lastMessage) {
                lastMessage.loading = false;
                lastMessage.pauseing = true;
                lastMessage.thinkTime = (Date.now() - session.startTime) / 1000;
            }
        }
    }

    // 暂停会话
    function pauseSession(sessionId: string) {
        console.log("暂停会话:", sessionId);
        const session = chatSessions[sessionId];
        if (session && !session.isPaused) {
            session.isPaused = true;
            if (session.controller && !session.controller.signal.aborted) {
                session.controller.abort();
                console.log("已中止请求");
            }
        }
    }

    // 处理单个数据块
    function processChunk(
        data: any,
        lastChatItem: any,
        session: ChatSession,
        chatMessageList: any[],
    ) {
        if (!data?.choices?.length || !lastChatItem) return;

        // 创建一个新的消息对象
        const newData = JSON.parse(JSON.stringify(lastChatItem));

        // 确保choices数组存在
        if (!newData.choices) {
            newData.choices = [];
        }

        // 处理每个选择项
        data.choices.forEach((choice: any, index: number) => {
            if (!newData.choices[index]) {
                newData.choices[index] = {
                    delta: { content: "", reasoning_content: "" },
                    _thinkContent: [],
                    _content: "",
                };
            }

            // 修正累加逻辑，确保 content 正确累加
            if (typeof newData.choices[index].delta.content !== 'string') {
                newData.choices[index].delta.content = "";
            }
            if (choice.delta?.content) {
                newData.choices[index].delta.content += choice.delta.content;
                newData.choices[index]._content = newData.choices[index].delta.content;
            }

            // 处理推理内容（如果有）
            if (choice.delta?.reasoning_content) {
                const curReasoning =
                    newData.choices[index].delta.reasoning_content || "";
                newData.choices[index].delta.reasoning_content =
                    curReasoning + choice.delta.reasoning_content;
                newData.choices[index]._thinkContent =
                    newData.choices[index].delta.reasoning_content.split("\n");
            }
        });

        // 日志：每次累加后打印 choices[0]._content
        if (newData.choices[0]) {
            console.log('choices[0]._content:', newData.choices[0]._content);
        }

        // 更新UI属性
        newData.loading = true;
        newData.pauseing = false;
        newData.isSpread = true;
        newData.thinkTime = (Date.now() - session.startTime) / 1000;
        newData.isThink = session.model.includes("reasoner");
        newData.isRepository = Boolean(session.docs);
        newData.tools = ["copy"];
        newData.docs = session.docs;

        // 更新会话列表中的最后一条消息
        if (chatMessageList && chatMessageList.length > 0) {
            chatMessageList.splice(chatMessageList.length - 1, 1, newData);
        }

        // 保存最后处理的消息
        session.lastChatItem = newData;
    }

    // 继续处理会话数据
    async function processChatSession(
        sessionId: string,
        chatMessageList: any[],
    ) {
        const session = chatSessions[sessionId];
        if (
            !session ||
            session.isDone ||
            session.isPaused ||
            session.isProcessing
        ) {
            return;
        }

        try {
            session.isProcessing = true;

            // 对于非流式API的处理已经在startChatSession中完成
            if (!session.useNativeStream) {
                session.isProcessing = false;
                return true;
            }

            // 处理支持ReadableStream的情况
            if (!session.reader) {
                console.error("无法获取reader");
                session.isProcessing = false;
                return;
            }

            const { done, value } = await session.reader.read();

            if (done) {
                console.log("流处理完成");
                session.isDone = true;
                session.loading = false;
                session.isPaused = true;

                // 更新最后一条消息状态
                if (chatMessageList && chatMessageList.length > 0) {
                    const lastMessage = chatMessageList[chatMessageList.length - 1];
                    if (lastMessage) {
                        lastMessage.loading = false;
                        lastMessage.pauseing = true;
                        lastMessage.thinkTime = (Date.now() - session.startTime) / 1000;
                    }
                }

                session.isProcessing = false;
                return true;
            }

            if (!value) {
                console.log("获取到空值");
                session.isProcessing = false;
                return false;
            }

            session.buffer += session.textDecoder.decode(value, {
                stream: true,
            });
            const lines = session.buffer.split("\n");
            session.buffer = lines.pop() || "";

            // 处理返回的数据
            for (const line of lines) {
                if (line.trim()) {
                    const data = parseJsonLikeData(line);
                    console.log('解析到数据:', data ? '有效数据' : '无效数据', data?.choices?.[0]?.delta?.content?.substring(0, 50));
                    if (data) {
                        if (data.done) {
                            console.log("接收到[DONE]标记");
                            session.isDone = true;
                            if (chatMessageList && chatMessageList.length > 0) {
                                const lastMessage = chatMessageList[chatMessageList.length - 1];
                                if (lastMessage) {
                                    lastMessage.loading = false;
                                    lastMessage.pauseing = true;
                                }
                            }
                            break;
                        }

                        console.log('处理数据chunk, choices数量:', data.choices?.length, 'finish_reason:', data.choices?.[0]?.finish_reason);
                        if (chatMessageList && chatMessageList.length > 0) {
                            // 找到最后一个AI消息
                            const lastChatItem = chatMessageList[chatMessageList.length - 1];
                            console.log('最后一条消息role:', lastChatItem?.role, '期望role:', AI_IDENTITY_AI_VALUE);
                            if (lastChatItem?.role === AI_IDENTITY_AI_VALUE) {
                                // 处理数据并更新UI
                                console.log('调用processChunk处理数据');
                                processChunk(data, lastChatItem, session, chatMessageList);
                            } else {
                                // 如果最后一条不是AI消息，检查是否有必要添加AI消息
                                console.log("最后一条不是AI消息，检查是否需要添加AI消息");
                                if (session.lastChatItem) {
                                    // 如果会话中有缓存的AI消息，直接添加到聊天列表
                                    chatMessageList.push(session.lastChatItem);
                                    processChunk(data, session.lastChatItem, session, chatMessageList);
                                } else {
                                    // 如果没有缓存的AI消息，创建一个新的AI消息
                                    const newAiMessage = generatorAiChatList({});
                                    chatMessageList.push(newAiMessage);
                                    processChunk(data, newAiMessage, session, chatMessageList);
                                }
                            }
                        }
                    }
                }
            }

            session.isProcessing = false;
            return session.isDone; // 返回是否完成
        } catch (error: any) {
            console.error("处理会话数据失败:", error);
            session.isProcessing = false;
            if (error.name !== "AbortError") {
                // 非中止错误，可能需要重试或终止
                console.error("处理会话数据失败:", error);
                session.isDone = true;
                if (chatMessageList && chatMessageList.length > 0) {
                    const lastMessage = chatMessageList[chatMessageList.length - 1];
                    if (lastMessage) {
                        lastMessage.loading = false;
                        lastMessage.pauseing = true;
                    }
                }
            }
            return error.name === "AbortError" ? null : true;
        }
    }

    // 清理不活跃的会话
    function cleanupSession(sessionId: string) {
        if (chatSessions[sessionId]) {
            if (
                chatSessions[sessionId].controller &&
                !chatSessions[sessionId].controller.signal.aborted
            ) {
                chatSessions[sessionId].controller.abort();
            }

            delete chatSessions[sessionId];
        }
    }

    // 设置活跃会话
    function setActiveSession(sessionId: string) {
        activeSessionId.value = sessionId;
    }

    // 获取会话状态
    function getSessionStatus(sessionId: string) {
        return chatSessions[sessionId] || null;
    }

    // 辅助函数：解析数据
    function parseJsonLikeData(content: string) {
        if (content?.startsWith("data: ")) {
            const dataString = content.substring(6).trim();

            if (dataString === "[DONE]") {
                return { done: true };
            }

            try {
                return JSON.parse(dataString);
            } catch (error) {
                console.error(
                    "JSON parsing error:",
                    error,
                    "content:",
                    content,
                );
            }
        }
        return null;
    }

    // 在此处添加 generatorAiChatList 函数，供本文件内部使用
    function generatorAiChatList(data: any) {
        return {
            choices: data?.choices || [],
            role: AI_IDENTITY_AI_VALUE,
            id: data?.id || +new Date().getTime(),
            type: "robot",
            loading: true,
            pauseing: false,
            isSpread: true,
            thinkTime: null,
            isThink: false,
            isRepository: false,
            tools: ["copy"],
            docs: data?.docs,
        };
    }

    return {
        initSession,
        startChatSession,
        processChatSession,
        pauseSession,
        cleanupSession,
        setActiveSession,
        getSessionStatus,
        chatSessions,
        activeSessionId,
    };
});

if (import.meta.hot) {
    import.meta.hot.accept(
        acceptHMRUpdate(useChatStore as any, import.meta.hot),
    );
}
