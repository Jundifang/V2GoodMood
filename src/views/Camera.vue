<template>
  <div class="layout">
    <div class="simple-sidebar">
      <div class="logo">
        <h2>V2GoodMood</h2>
      </div>
      <nav>
        <router-link to="/" class="nav-link">
          <el-icon>
            <HomeFilled/>
          </el-icon>
          主页
        </router-link>
        <router-link to="/database" class="nav-link">
          <el-icon>
            <Management/>
          </el-icon>
          数据管理
        </router-link>
      </nav>
    </div>

    <div class="content">
      <div class="camera-container">
        <div class="main-content">
          <!-- 左侧：用户信息 -->
          <div class="image-section">
            <div class="user-info-container">
              <div class="user-info">
                <h2 class="welcome-title">欢迎 {{ userName || '访客' }}</h2>
                <p class="info-item">身份准确率：{{ user_probability || 'Unknown' }}</p>
                <p class="info-item">性别：{{ userGender || 'Unknown' }}</p>
                <p class="info-item">年龄：{{ userAgeLow || 'Unknown' }}-{{ userAgeHigh }}</p>
                <p class="info-item">
                  口罩状态：
                  <span :class="['mask-status', getMaskStatusClass]">
                    {{
                      maskStatus === null ? 'Unknown' : (maskStatus === 'without_mask' ? '未佩戴口罩' : '已佩戴口罩')
                    }}
                  </span>
                </p>
              </div>
            </div>

            <!-- 情绪识别结果框 -->
            <div class="emotion-box">
              <h4>情绪识别结果</h4>
              <div v-if="emotionResult" class="emotion-content">
                <p>{{ emotionResult }}</p>
                <div class="emotion-image-container">
                  <el-image :src="emotionPic" class="emotion-image"></el-image>
                </div>
              </div>
              <div v-else class="emotion-placeholder">
                等待分析结果...
              </div>
            </div>
          </div>

          <!-- 右侧：AI对话 -->
          <div class="ai-chat">
            <div class="flex flex-col h-full">
              <!-- 使用 sticky 而不是 fixed -->
              <div
                  class="flex flex-nowrap sticky w-full items-baseline top-0 px-6 py-4 bg-gray-100 z-10"
              >
                <div class="ml-4 text-sm text-gray-500 header ">
                  情绪建议小助手
                </div>
                <!--                <div
                                    class="ml-auto px-3 py-2 text-sm cursor-pointer hover:bg-white rounded-md"
                                    @click="clickConfig()"
                                >
                                  设置
                                </div>-->
              </div>
              <!-- 对话内容区域 -->
              <div class="flex-1 mx-2 mt-20 mb-2" ref="chatListDom">
                <div
                    class="group flex flex-col px-4 py-3 hover:bg-slate-100 rounded-lg"
                    v-for="(item, index) of messageList.filter(
                    (v) => v.role !== 'system'
                  )"
                    :key="item.id || index"
                >
                  <!-- 使用 item.id 作为 key，如果不存在则使用 index -->
                  <div class="flex justify-between items-center mb-2">
                    <div class="font-bold">{{ roleAlias[item.role] }}：</div>
                    <Copy
                        class="invisible group-hover:visible"
                        :content="item.content"
                    />
                  </div>
                  <div>
                    <div
                        class="prose text-sm text-slate-600 leading-relaxed"
                        v-if="item.content"
                        v-html="md.render(item.content)"
                    ></div>
                    <Loding v-else/>
                  </div>
                </div>
              </div>
              <!-- 底部输入区域 -->
              <div class="sticky bottom-0 w-full p-6 pb-8 bg-gray-100">
                <div class="flex ">
                  <input
                      class="input rounded-lg "
                      :type="isConfig ? 'password' : 'text'"
                      :placeholder="isConfig ? 'sk-xxxxxxxxxx' : '你有什么困惑呀'"
                      v-model="messageContent"
                      @keydown.enter="isTalking || sendOrSave()"
                  />
                  <button
                      class="btn"
                      :disabled="isTalking"
                      @click="sendOrSave()"
                  >
                    {{ isConfig ? "保存" : "发送" }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, reactive, onMounted, computed, onBeforeUnmount, watch, nextTick} from 'vue';
import {useRouter} from 'vue-router';
import {useStore} from 'vuex';
import {ChatLineSquare, HomeFilled, Management, VideoPlay} from '@element-plus/icons-vue';
import {ElMessage} from 'element-plus';
import socket from "@/socket";
import {chat} from "@/libs/gpt";
import cryptoJS from "crypto-js";
import Loding from "@/components/Loding.vue";
import Copy from "@/components/Copy.vue";
import {md} from "@/libs/markdown";

// 将 getSecretKey 函数移到文件顶部或其他合适的位置，确保只声明一次
const getSecretKey = () => "jun";

let apiKey = "";
let isConfig = ref(true);
let isTalking = ref(false);
let messageContent = ref("");
const chatListDom = ref(null);
const decoder = new TextDecoder("utf-8");
const roleAlias = {user: "", assistant: "情绪小助手", system: "System"};
const messageList = ref([
  {
    role: "system",
    content: "你是一个情感分析专家与心理健康大师，你需要根据人物的情绪和心情，给出健康建议。",
  },
]);

const router = useRouter();
const store = useStore();

const userName = ref('');
const emotionResult = ref('');
const userGender = ref('');
const user_probability = ref('');
const emotionPic = ref('');
const userAgeLow = ref(null);
const userAgeHigh = ref(null);
const maskStatus = ref(null);
const analysis_context = ref('');

onBeforeUnmount(() => {
  userName.value = '';
  emotionResult.value = '';
  userGender.value = '';
  user_probability.value = '';
  emotionPic.value = '';
  userAgeLow.value = null;
  userAgeHigh.value = null;
  maskStatus.value = null;
  store.commit("CLEAR_IMAGE_DATA");
  ElMessage("已重置");
  console.log("已重置");
});

onMounted(async () => {
  const image = store.state.imageData;
  if (!image) return;

  socket.on('module1_result', (response) => {
    if (response.error) {
      ElMessage.error(response.error);
    } else {
      userAgeLow.value = response.result[0]['age']['low'];
      userAgeHigh.value = response.result[0]['age']['high'];
      userName.value = response.result[0]['subjects'][0]['subject'];
      maskStatus.value = response.result[0]['mask']['value'];
      userGender.value = response.result[0]['gender']['value'];
      user_probability.value = response.result[0]['subjects'][0]['similarity'];
      roleAlias.user = userName.value;
      ElMessage.success('人脸分析成功');
    }
  });

  socket.on('module2_result', (response) => {
    if (response.error) {
      ElMessage.error(response.error);
    } else {
      emotionResult.value = response.result;
      emotionPic.value = response.picture;
      ElMessage.success('表情分析成功');
    }
  });

  socket.on('module3_result', (response) => {
    if (response.error) {
      ElMessage.error(response.error);
    } else {
      analysis_context.value = response;
      messageList.value.push({role: "assistant", content: response});
      ElMessage.success('建议分析成功');
    }
  });

  if (getAPIKey()) {
    switchConfigStatus();
  }
});

const sendChatMessage = async (content = messageContent.value) => {
  try {
    isTalking.value = true;
    // if (messageList.value.length === 2) {
    //   messageList.value.pop();
    // }
    messageList.value.push({role: "user", content});
    clearMessageContent();
    messageList.value.push({role: "assistant", content: ""});

    const {body, status} = await chat(messageList.value, getAPIKey());
    if (body) {
      const reader = body.getReader();
      await readStream(reader, status);
    }
  } catch (error) {
    appendLastMessageContent(error);
  } finally {
    isTalking.value = false;
  }
};

const readStream = async (reader, status) => {
  let partialLine = "";

  while (true) {
    const {value, done} = await reader.read();
    if (done) break;

    const decodedText = decoder.decode(value, {stream: true});

    if (status !== 200) {
      const json = JSON.parse(decodedText);
      const content = json.error.message ?? decodedText;
      appendLastMessageContent(content);
      return;
    }

    const chunk = partialLine + decodedText;
    const newLines = chunk.split(/\r?\n/);

    partialLine = newLines.pop() ?? "";

    for (const line of newLines) {
      if (line.length === 0 || line.startsWith(":") || line === "data: [DONE]") continue;

      const json = JSON.parse(line.substring(6));
      const content = status === 200 ? json.choices[0].delta.content ?? "" : json.error.message;
      appendLastMessageContent(content);
    }
  }
};

const appendLastMessageContent = (content) => {
  messageList.value[messageList.value.length - 1].content += content;
};

const sendOrSave = () => {
  if (!messageContent.value.length) return;
  if (isConfig.value) {
    if (saveAPIKey(messageContent.value.trim())) {
      switchConfigStatus();
    }
    clearMessageContent();
  } else {
    sendChatMessage();
  }
};

/*const clickConfig = () => {
  if (!isConfig.value) {
    messageContent.value = getAPIKey();
  } else {
    clearMessageContent();
  }
  switchConfigStatus();
};*/

const saveAPIKey = (apiKey) => {
  const aesAPIKey = cryptoJS.AES.encrypt(apiKey, getSecretKey()).toString();
  localStorage.setItem("apiKey", aesAPIKey);
  return true;
};

const getAPIKey = () => {
  if (apiKey) return apiKey; // 修复后的代码
  const aesAPIKey = localStorage.getItem("apiKey") ?? "";
  apiKey = cryptoJS.AES.decrypt(aesAPIKey, getSecretKey()).toString(
      cryptoJS.enc.Utf8
  );
  return apiKey;
};

const switchConfigStatus = () => (isConfig.value = !isConfig.value);

const clearMessageContent = () => (messageContent.value = "");

const scrollToBottom = () => {
  if (!chatListDom.value) return;
  chatListDom.value.scrollTop = chatListDom.value.scrollHeight;
};

watch(messageList, () => nextTick(() => scrollToBottom()));
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.simple-sidebar {
  width: 200px;
  padding: 1rem;
  background-color: #f8f9fa;
}

.logo h2 {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  color: var(--primary-color);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  color: var(--text-color);
  text-decoration: none;
  font-size: 1rem;
}

.nav-link:hover {
  color: var(--primary-color);
}

.content {
  flex: 1;
  padding: 2rem;
}

.camera-container {
  max-width: 1400px; /* 增加最大宽度以适应新布局 */
  margin: 0 auto;
  /*padding: 2rem;*/
}

/* 新增头部区域样式 */
.header-section {
  text-align: center;
  margin-bottom: 3rem;
}

.welcome-title {
  font-size: 2.5rem;
  color: var(--primary-color);
  font-weight: 600;
  margin: 0;
}

.user-info {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  gap: 2rem;
}

.info-item {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.mask-status {
  font-weight: normal;
  color: #333;
}

.mask-status.wearing {
  color: #67c23a;
}

.mask-status.not-wearing {
  color: #f56c6c;
}

.mask-status.undetected {
  color: #333;
}

/* 新增主要内容区布局 */
.main-content {
  display: flex;
  gap: 3rem;
}

/* 左侧上传区域 */
.capture-section {
  flex: 0 0 auto; /* 保持固定宽度 */
}

.image-container {
  position: relative;
  width: 600px;
  height: 400px;
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  padding: 20px;
  color: white;
}

.welcome-title {
  font-size: 1.8rem;
  margin: 0 0 10px 0;
  color: white;
}

.info-item {
  margin: 5px 0;
  font-size: 1.1rem;
  color: white;
}

.mask-status {
  font-weight: 500;
}

.mask-status.wearing {
  color: #67c23a;
}

.mask-status.not-wearing {
  color: #f56c6c;
}

.mask-status.undetected {
  color: #e6e6e6;
}

/* 删除不需要的样式 */
.analyze-button-container,
.header-section {
  display: none;
}

.image-uploader {
  border: 2px dashed var(--secondary-color);
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.image-uploader:hover {
  border-color: var(--primary-color);
}

/* 增大上传框尺寸 */
.upload-placeholder {
  width: 600px; /* 增加宽度 */
  height: 400px; /* 增加高度 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--text-color);
}

/* 增大预览图尺寸 */
.preview-image {
  width: 600px; /* 增加宽度 */
  height: 400px; /* 增加高度 */
  object-fit: cover;
}

.upload-icon {
  font-size: 4rem; /* 增大图标尺寸 */
  margin-bottom: 1.5rem;
}

.upload-text {
  font-size: 1.2rem; /* 增大提示文字尺寸 */
}

.analyze-button-container {
  margin-top: 2rem; /* 增加与上传框的间距 */
  text-align: center;
}

.button-icon {
  margin-right: 8px;
}

.header {
  padding: 10px;
  background-color: #dfffdf;
  border-radius: 8px;

}

/* 右侧结果区域 */
.result-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  min-width: 400px;
}

.result-card {
  margin-bottom: 1rem;
}

.emotion-text {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.suggestion-text {
  color: #666;
  line-height: 1.6;
}

.chat-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chat-messages {
  flex: 1;
  min-height: 300px;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 1rem;
  background: #f9f9f9;
}

.message {
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  max-width: 80%;
}

.message.user {
  background: var(--primary-color);
  color: white;
  margin-left: auto;
}

.message.ai {
  background: white;
  border: 1px solid #ddd;
  margin-right: auto;
}

.chat-input {
  margin-top: auto;
}

:deep(.el-input-group__append) {
  padding: 0;
}

.analysis-section {
  display: flex;
  padding: 20px;
  gap: 20px;
}

.emotion-results {
  flex: 1;
  padding: 20px;
  border-right: 1px solid #eee;
}

.ai-chat {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
  border: 2px solid #000;
  border-radius: 10px;


}

.ai-chat .sticky {
  z-index: 10;
}

.ai-chat .flex-1 {
  /*margin-top: 60px;*/ /* 根据实际情况调整 */
}

.flex-1 {
  height: 600px;
  overflow-y: auto;
}

.chat-container {
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  margin-bottom: 10px;
}

.ai-chat h4 {
  margin: 0;
  color: #333;
  font-size: 16px;
  padding: 10px;
  border-bottom: 1px solid #ddd;
}

.chat-messages {
  height: 500px;
  overflow-y: auto;
  padding: 10px;
}

.chat-input {
  display: flex;
  gap: 8px;
  padding: 15px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 100%;
}

.chat-input input {
  flex: 1;
  padding: 15px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 100%;


}

.chat-input button {
  padding: 15px 25px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
}

.chat-input button:hover {
  opacity: 0.9;
}

.emotion-box {
  /*margin-top: 20px;*/
  background-color: #f8f9fa;
  width: 600px;
  border: 1px solid #000;
  border-radius: 8px;
  /*background-color: #fff;*/
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-height: 300px;
}

.emotion-box h4 {
  margin-left: 20px;
  margin-bottom: -10px;
  color: #333;
  font-size: 20px;
}

.emotion-content {
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 4px;
  min-height: 220px;
}

.emotion-placeholder {
  color: #999;
  text-align: center;
  padding: 40px 0;
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emotion-content p {
  margin: 5px 0 10px 0;
  font-size: 20px;
  line-height: 1.5;
}

.user-info-container {
  width: 600px;
  height: 300px;
  background-color: #f8f9fa;
  border: 1px solid #000;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.user-info {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.welcome-title {
  font-size: 2rem;
  color: var(--primary-color);
  margin: 0;
}

.info-item {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.mask-status {
  font-weight: 500;
}

.mask-status.wearing {
  color: #67c23a;
}

.mask-status.not-wearing {
  color: #f56c6c;
}

.mask-status.undetected {
  color: #909399;
}

/* 删除不需要的样式 */
.image-container,
.image-overlay,
.preview-image,
.analyze-button-container,
.header-section {
  display: none;
}
</style> 