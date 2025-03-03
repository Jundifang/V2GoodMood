import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 15000
})

export const emotionAPI = {
  // 分析图片并识别用户
  analyzeImage: async (imageData) => {
    const formData = new FormData()
    formData.append('image', imageData)
    return await api.post('/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // 与AI对话
  chat: async (message) => {
    return await api.post('/chat', { message })
  }
} 