interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  // 这里可以添加其他环境变量
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 