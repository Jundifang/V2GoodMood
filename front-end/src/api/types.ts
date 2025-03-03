// 情绪分析响应接口
export interface EmotionAnalysisResponse {
  name: string;          // 识别出的用户名
  emotion: string;       // 识别出的情绪
  suggestion: string;    // AI 给出的建议
}

// AI 对话请求接口
export interface ChatRequest {
  message: string;       // 用户发送的消息
  emotion?: string;      // 当前情绪状态（可选）
}

// AI 对话响应接口
export interface ChatResponse {
  reply: string;         // AI 的回复
}

// 错误响应接口
export interface ErrorResponse {
  error: string;
  code?: number;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}
