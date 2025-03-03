<template>
  <div>
    <input type="file" @change="handleFileUpload" />
    <div v-if="result">
      <p>Name: {{ result.name }}</p>
      <p>Emotion: {{ result.emotion }}</p>
      <p>Suggestion: {{ result.suggestion }}</p>
    </div>
    <div v-if="error">{{ error }}</div>
  </div>
</template>

<script>
// import { ref } from 'vue';
// import { io, Socket } from 'socket.io-client';
//
// export default {
//   name: 'test1',
//   setup() {
//     const socket = io('http://localhost:5000');
//     const result = ref(null);
//     const error = ref(null);
//     const messages = ref([]);
//
//     const handleFileUpload = (event) => {
//       const file = event.target.files[0];
//       if (file) {
//         const reader = new FileReader();
//         reader.onload = () => {
//           const base64Image = reader.result;
//           socket.emit('analyzeImage', base64Image, (response) => {
//             if (response && response.name && response.emotion && response.suggestion) {
//               result.value = response;
//               error.value = null;
//             } else {
//               error.value = 'Invalid response from server';
//             }
//           });
//         };
//         reader.onerror = () => {
//           error.value = 'Failed to read file';
//         };
//         reader.readAsDataURL(file);
//       }
//       messages.value.push('File uploaded'); // 新增：将消息添加到 messages 数组中
//     };
//
//     socket.on('emotionAnalysisResult', (response) => {
//       result.value = response;
//       error.value = null;
//     });
//
//     socket.on('emotionAnalysisError', (errorData) => {
//       error.value = errorData.error;
//     });
//
//     return {
//       result,
//       error,
//       messages, // 新增：将 messages 暴露给模板
//       handleFileUpload,
//     };
//   },
// };
</script>