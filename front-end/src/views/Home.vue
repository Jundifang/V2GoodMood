<template>
  <div class="layout">
    <div class="simple-sidebar">
      <div class="logo">
        <h2>V2GoodMood</h2>
      </div>
      <nav>
        <router-link to="/" class="nav-link active">
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
      <div class="welcome-container">
        <h1 class="welcome-text">每日好心情，从现在开始</h1>

        <!-- 主要操作区 -->
        <div class="action-area">
          <!-- 拍照按钮 -->
          <el-button
              type="primary"
              size="large"
              class="action-button"
              @click="startCamera"
          >
            <el-icon class="button-icon">
              <Camera/>
            </el-icon>
            拍照
          </el-button>

          <!-- 文件上传按钮 -->
          <el-upload
              class="upload-button"
              :show-file-list="false"
              :before-upload="handleFileSelect"
              accept="image/*"
          >
            <el-button
                type="success"
                size="large"
                class="action-button"
            >
              <el-icon class="button-icon">
                <Upload/>
              </el-icon>
              上传文件
            </el-button>
          </el-upload>
        </div>

        <!-- 摄像头对话框 -->
        <el-dialog
            v-model="showCamera"
            title="拍照"
            width="700px"
            :close-on-click-modal="false"
            :show-close="true"
        >
          <div class="camera-container">
            <video
                v-if="!capturedImage"
                ref="videoRef"
                class="camera-preview"
                autoplay
                playsinline
            ></video>
            <img
                v-else
                :src="capturedImage"
                class="camera-preview"
            />
          </div>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="closeCamera">取消</el-button>
              <el-button
                  v-if="!capturedImage"
                  type="primary"
                  @click="takePhoto"
              >
                拍照
              </el-button>
              <el-button
                  v-else
                  type="success"
                  @click="confirmPhoto"
              >
                确认使用
              </el-button>
            </span>
          </template>
        </el-dialog>
      </div>
    </div>
  </div>
</template>

<script>
import {ref} from 'vue'
import {Camera, HomeFilled, Management, Upload} from '@element-plus/icons-vue'
import {useRouter} from 'vue-router'
import {useStore} from 'vuex'
import {ElMessage} from 'element-plus'
// import socket from '../api/socket' // 导入 Socket.IO 实例
// import socketio from "socket.io-client";
import socket from "@/socket"

export default {
  name: 'Home',
  components: {
    Camera,
    HomeFilled,
    Management,
    Upload,
    // ImageUpload
  },
  setup() {
    const router = useRouter();
    const store = useStore();
    const showCamera = ref(false);
    const videoRef = ref(null);
    const stream = ref(null);
    const capturedImage = ref('');
    const analysisResult = ref(null);
    // const socket = socketio("http://localhost:5000"); // 连接到后端的socketio服务器

    // 启动摄像头
    const startCamera = async () => {
      try {
        showCamera.value = true;
        stream.value = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        if (videoRef.value) {
          videoRef.value.srcObject = stream.value;
        }
      } catch (error) {
        ElMessage.error('无法访问摄像头：' + error.message);
        showCamera.value = false;
      }
    };

    // 拍照
    const takePhoto = () => {
      capturedImage.value = '';
      const video = videoRef.value;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      let imageDataUrl = canvas.toDataURL('image/jpeg', 1.0); // 压缩图片至400KB以下

      const compressImage = (dataUrl, maxSizeKB, callback) => {
        let quality = 1.0;
        const maxSizeBytes = maxSizeKB * 1024;

        const compress = () => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            if (compressedDataUrl.length > maxSizeBytes && quality > 0.1) {
              quality -= 0.1;
              compress();
            } else {
              callback(compressedDataUrl);
            }
          };
          img.src = dataUrl;
        };

        compress();
      };

      compressImage(imageDataUrl, 400, (compressedDataUrl) => {
        capturedImage.value = compressedDataUrl;
      });
    };


    // 确认使用照片,跳转页面
    const confirmPhoto = () => {
      closeCamera();
      // 发送图片到后端
      socket.emit('image_upload', capturedImage.value);
      router.push('/camera');
      capturedImage.value = '';
    };

    // 关闭摄像头
    const closeCamera = () => {
      if (stream.value) {
        stream.value.getTracks().forEach(track => track.stop());
        stream.value = null;
      }
      showCamera.value = false;
      store.commit('setImageData', capturedImage.value);
    };

    // 处理文件选择
    const handleFileSelect = (file) => {
      if (!file.type.startsWith('image/')) {
        ElMessage.error('请上传图片文件！');
        return false;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target.result;

        // 发送图片到后端
        socket.emit('image_upload', base64Image);

        store.commit('setImageData', base64Image);
        await router.push('/camera');
      };
      reader.readAsDataURL(file);
      return false;
    };

    // 监听图片上传成功事件
    const onImageUploaded = (response) => {
      // 处理上传成功的逻辑
      console.log('图片上传成功:', response);
      ElMessage.success('图片上传成功');
    };

    // 监听图片上传失败事件
    const onImageUploadFailed = (error) => {
      // 处理上传失败的逻辑
      console.error('图片上传失败:', error);
      ElMessage.error('图片上传失败');
    };
    //  TODO 有结果后再跳转
    // // 监听来自后端的消息
    // socket.on('module1_result', (response) => {
    //   if (response.error) {
    //     ElMessage.error(response.error)
    //   } else {
    //     analysisResult.value = response
    //     ElMessage.success('图片上传成功')
    //     router.push('/camera')
    //   }
    // })

    return {
      showCamera,
      videoRef,
      capturedImage,
      startCamera,
      takePhoto,
      confirmPhoto,
      closeCamera,
      handleFileSelect,
      analysisResult
    }
  }
}
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

/* 添加侧边栏样式 */
.simple-sidebar {
  width: 200px;
  background-color: #f8f9fa;
  padding: 2rem 0;
  border-right: 1px solid #e0e0e0;
}

.logo {
  padding: 0 1.5rem;
  margin-bottom: 2rem;
}

.logo h2 {
  margin: 0;
  color: var(--primary-color);
  font-size: 1.5rem;
}

nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  color: var(--text-color);
  text-decoration: none;
  transition: all 0.3s ease;
}

.nav-link:hover,
.nav-link.active {
  background-color: var(--primary-color);
  color: white;
}

.nav-link .el-icon {
  font-size: 1.2rem;
}

/* 内容区样式 */
.content {
  flex: 1;
  padding: 2rem;
}

.welcome-container {
  text-align: center;
  margin-top: 10vh;
  padding: 10px;
}

.welcome-text {
  font-size: 2.5rem;
  color: var(--primary-color);
  margin-bottom: 3rem;
}

.action-area {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.action-button {
  padding: 1rem 2rem;
  font-size: 1.2rem;
}

.button-icon {
  margin-right: 8px;
}

.camera-container {
  display: flex;
  justify-content: center;
  padding: 1rem;
}

.camera-preview {
  width: 640px;
  height: 480px;
  object-fit: cover;
  border-radius: 8px;
}

:deep(.el-upload) {
  display: block;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
