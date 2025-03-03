import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

const my_axios = axios.create({
  baseURL: 'http://localhost:5000', // 设置目标地址
  timeout: 10000,                  // 设置超时时间（可选）
});
// 用户相关接口
export const userApi = {
  // 1. 新增用户
  addUser: (userData: { name: string }) => {
    return axios.post(`${BASE_URL}/user/add`, userData);
  },

  // 2. 清空用户库
  clearUsers: () => {
    return axios.delete(`${BASE_URL}/users/clear`);
  },

  // 7. 删除用户
  deleteUser: (userId: string) => {
    return axios.delete(`${BASE_URL}/user/${userId}/delete`);
  }
};

// 照片相关接口
export const photoApi = {
  // 3. 删除照片
  deletePhoto: (userId: string, photoId: string) => {
    return axios.delete(`${BASE_URL}/user/${userId}/photo/${photoId}/delete`);
  },

  // 4. 重命名照片
  renamePhoto: (userId: string, photoId: string, newName: string) => {
    return axios.put(`${BASE_URL}/user/${userId}/photo/${photoId}/rename`, {
      newName
    });
  },

  // 5. 上传照片
  uploadPhoto: (userId: string, photoFile: File) => {
    const formData = new FormData();
    formData.append('photo', photoFile);
    return axios.post(`${BASE_URL}/user/${userId}/photo/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // 6. 清空照片
  clearPhotos: (userId: string) => {
    return axios.delete(`${BASE_URL}/user/${userId}/photos/clear`);
  }
};

// 图像分析接口
export const analyzeApi = {
  // 图像分析
  analyzeImage: (imageFile: File) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return axios.post(`${BASE_URL}/analyze`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};
export default my_axios;