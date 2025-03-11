<template>
  <div class="layout">
    <!-- 左侧导航栏 -->
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
        <router-link to="/database" class="nav-link active">
          <el-icon>
            <Document/>
          </el-icon>
          数据管理
        </router-link>
      </nav>
    </div>

    <div class="content">
      <div class="camera-container">
        <div class="main-content">
          <!-- 左侧：用户信息 -->
          <div class="user-info-section">
            <div class="user-info">
              <h2 class="welcome-title">欢迎 {{ userName || '(访✪ω✪客)' }} 🥳</h2>
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
            <h4>情绪识别结果📄</h4>
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
          <div class="chat-header">
            <h2>情绪建议小助手🥴</h2>
          </div>
          <div class="chat-messages" ref="chatListDom">
            <div
                class="message"
                v-for="(item, index) of messageList.filter((v) => v.role !== 'system')"
                :key="item.id || index"
            >
              <div class="message-header">
                <span class="role">{{ roleAlias[item.role] }}：</span>
                <Copy
                    class="copy-button"
                    :content="item.content"
                />
              </div>
              <div class="message-content">
                <div
                    class="prose"
                    v-if="item.content"
                >
                  <el-image
                      :src="item.content"
                      v-if="item.content.startsWith('http')"
                      class="emotion-image"
                      lazy
                  >
                    <template #error>
                      <div class="image-slot">
                        <el-icon><icon-picture /></el-icon>
                      </div>
                    </template>
                  </el-image>
                  <div
                      v-else
                      v-html="md.render(item.content)">
                  </div>
                </div>
                <Loding v-else/>
              </div>
            </div>
          </div>
          <div class="chat-input">
            <div class="icon-group">
              <el-tooltip content="文本对话" placement="bottom" effect="light" hide-after="50">
                <el-icon
                    class="hov"
                    :color="whichModel === 0 ? 'purple' : undefined"
                    size="30px"
                    @click="whichModel = 0"
                >
                  <ChatDotRound/>
                </el-icon>
              </el-tooltip>
              <el-tooltip content="图像生成" placement="bottom" effect="light" hide-after="50">
                <el-icon
                    class="hov"
                    :color="whichModel === 1 ? 'purple' : undefined"
                    size="30px"
                    @click="whichModel = 1"
                >
                  <PictureRounded/>
                </el-icon>
              </el-tooltip>

            </div>
            <input
                class="input"
                type="text"
                placeholder="有什么我可以帮你的嘛✔️"
                v-model="messageContent"
                @keydown.enter="isTalking || sendOrSave()"
            />
            <button
                class="btn"
                :disabled="isTalking"
                @click="sendOrSave()"
            >
              发送
            </button>
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
import {HomeFilled, Management} from '@element-plus/icons-vue';
import {ElMessage} from 'element-plus';
import socket from "@/socket";
import {chat} from "@/libs/gpt";
import cryptoJS from "crypto-js";
import Loding from "@/components/Loding.vue";
import Copy from "@/components/Copy.vue";
import {md} from "@/libs/markdown";
import {draw} from "@/libs/cogview"

const getSecretKey = () => "jun";

let apiKey = "6197c7ea87dc726d57a420e616cca003.0llw045tuvuNUTky";
let isTalking = ref(false);
let messageContent = ref("");
const chatListDom = ref(null);
const decoder = new TextDecoder("utf-8");
const roleAlias = {user: "(访✪ω✪客)", assistant: "小助手🥴", system: "System"};
const messageList = ref([
  {
    role: "system",
    content: "你是一个情感分析专家与心理健康大师，你需要根据人物的情绪和心情，给出健康建议。",
  },
]);
const router = useRouter();
const store = useStore();

const whichModel = ref(0);

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
      analysis_context.value = response.answer;
      messageList.value.push({role: "assistant", content: response.answer});
      ElMessage.success('建议分析成功');
      apiKey = response.api_key;
    }
  });

});

const sendChatMessage = async (content = messageContent.value) => {
  try {
    isTalking.value = true;
    messageList.value.push({role: "user", content});
    clearMessageContent();
    messageList.value.push({role: "assistant", content: ""});
    let body, status;
    if (whichModel.value === 0)
      ({body, status} = await chat(messageList.value, getAPIKey()));
    else
      ({body, status} = await draw(content, getAPIKey()));
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
    if (whichModel.value) {
      const jsonObject = JSON.parse(decodedText);

      const url = jsonObject.data[0].url;
      console.log(url);
      appendLastMessageContent(url);


    } else {
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

  }
};

const appendLastMessageContent = (content) => {
  messageList.value[messageList.value.length - 1].content += content;
};

const sendOrSave = () => {
  if (!messageContent.value.length) return;

  sendChatMessage();

};

const getAPIKey = () => {
  return apiKey;
};


const clearMessageContent = () => (messageContent.value = "");

const scrollToBottom = () => {
  if (!chatListDom.value) return;
  chatListDom.value.scrollTop = chatListDom.value.scrollHeight;
};

watch(messageList, () => nextTick(() => scrollToBottom()));

const getMaskStatusClass = computed(() => {
  if (maskStatus.value === 'without_mask') return 'not-wearing';
  if (maskStatus.value === 'with_mask') return 'wearing';
  return 'undetected';
});
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  /* background-color: #f4f4f9; */
}

.simple-sidebar {
  width: 200px;
  background-color: #f8f9fa;
  padding: 2rem 0;
  border-right: 1px solid #e0e0e0;
}

.logo h2 {
  padding: 0 1.5rem;
  margin-bottom: 2rem;
  color: #333333;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  color: var(--text-color);
  text-decoration: none;
  transition: all 0.3s ease;
}

.nav-link:hover {
  background-color: #f0f0f0;
}

.nav-link.active {
  background-color: var(--primary-color);
  color: white;
}

.content {
  flex: 1;
  height: 80vh;
  padding: 2rem;
}

.camera-container {
  max-width: 1400px;
  height: 80vh;
  margin: 0 auto;
  display: flex;
  gap: 2rem;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 50%;
}

.user-info-section {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.welcome-title {
  font-size: 1.8rem;
  margin: 0;
  color: #333333;
}

.info-item {
  margin: 0.5rem 0;
  font-size: 1.2rem;
  color: #666666;
}

.mask-status {
  font-weight: 500;
}

.mask-status.wearing {
  color: #4caf50;
}

.mask-status.not-wearing {
  color: #f44336;
}

.mask-status.undetected {
  color: #999999;
}

.emotion-box {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.emotion-box h4 {
  margin: 0;
  color: #333333;
  font-size: 1.4rem;
}

.emotion-content {
  margin-top: 1rem;
}

.emotion-image-container {
  margin-top: 1rem;
  text-align: center;
}

.emotion-image {
  max-width: 100%;
  border-radius: 8px;
}

.emotion-placeholder {
  margin-top: 1rem;
  height: 53vh;
  text-align: center;
  color: #999999;
}

.ai-chat {
  height: 85vh;
  width: 50%;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

.chat-header {
  background-color: #f0f0f0;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  text-align: center;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.message {
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.role {
  font-weight: 600;
  color: #333333;
}

.copy-button {
  cursor: pointer;
  color: #007bff;
}

.message-content {
  font-size: 1rem;
  color: #666666;
}

.chat-input {
  display: flex;
  gap: 0.5rem;
  height: 4vh;
  align-items: center; /* 新增垂直居中 */
}

.icon-group {
  display: flex;
  align-items: center;
  gap: 3px;
  height: 100%;
  cursor: pointer;
}

.hov {

}

.hov:hover {
  color: #D3D2FF;
}

.input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}


.btn {
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn:hover {
  background-color: #0056b3;
}

.btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>
