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

    <!-- 主内容区域 -->
    <div class="content">
      <div style="margin-bottom: 20px">
        <el-input
            v-model="query"
            placeholder="请输入需要查询的用户"
            style="width: 300px; margin-right: 10px"
            @keyup.enter="handleQuery"
        />
        <el-button
            type="primary"
            @click="handleQuery"
            style="margin-right: 650px"
        >
          查询
        </el-button>
        <el-button type="primary" @click="showAddUserDialog = true">
          新增用户
        </el-button>
        <el-button type="danger" @click="clearAllUsers">
          清空用户库
        </el-button>
      </div>

      <!-- 用户表格 -->
      <el-table :data="pagedUsers" style="width: 100%">
        <!-- 用户ID列 -->
        <el-table-column label="用户" prop="name">

          <!-- 下拉栏：图片ID列表 -->
          <!--        <el-table-column label="图片列表">-->
          <template #default="scope">
            <el-collapse>
              <el-collapse-item
                  :title="`${scope.row.name} (${scope.row.picId.length} 张)`"
                  style="width: 100%"
              >
                <el-table
                    :data="scope.row.picId.map((pic: string) => ({ picId: pic }))"
                    border
                    style="margin-bottom: 10px"
                >
                  <el-table-column label="image_id" prop="picId"/>
                  <el-table-column label="操作">
                    <template #default="props">
                      <el-button
                          size="small"
                          type="danger"
                          @click="deletePicture(scope.row, props.row.picId)"
                      >
                        删除图片
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-collapse-item>
            </el-collapse>
          </template>

        </el-table-column>

        <!-- 操作列 -->
        <el-table-column label="操作">
          <template #default="scope">
            <div style="display: flex; align-items: center; gap: 10px">
              <el-button
                  size="small"
                  type="primary"
                  @click="renameUser(scope.row)"
              >
                重命名
              </el-button>
              <!--             TODO -->
              <!--              <el-upload-->
              <!--                  :data="{}"-->
              <!--                  :action="`http://localhost:5000/api/user/${addUserForm.name}/photo/upload`"-->

              <!--                  :headers="{-->
              <!--        'X-Requested-With': 'XMLHttpRequest'-->
              <!--    }"-->
              <!--                  name="photo"-->
              <!--                  :show-file-list="false"-->
              <!--                  :on-success="(res: ApiResponse) => handleUploadSuccess(scope.row, res)"-->
              <!--                  :on-error="handleUploadError"-->
              <!--                  :before-upload="(file:File) => beforeUpload(file, scope.row.name)"-->
              <!--              >-->
              <!--                <el-button size="small" type="success">上传图片</el-button>-->
              <!--              </el-upload>-->
              <!-- 修改 el-upload 组件：用 http-request 覆盖默认上传 -->
              <el-upload
                  :action="`http://localhost:5000/api/user/${scope.row.name}/photo/upload`"
                  :headers="{ 'Content-Type': 'application/json' }"
                  :http-request="handleCustomUpload"
                  :show-file-list="false"
              >
                <el-button size="small" type="success">上传图片</el-button>
              </el-upload>
              <el-button
                  size="small"
                  type="warning"
                  @click="clearPictures(scope.row)"
              >
                清空图片
              </el-button>
              <el-button
                  size="small"
                  type="danger"
                  @click="deleteUser(scope.row)"
              >
                删除用户
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="users.length"
          :page-sizes="[5, 10, 20, 50]"
          :page-size="pageSize"
          :current-page="currentPage"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          style="margin-top: 20px"
      />
    </div>

    <!-- 新增用户对话框 -->
    <el-dialog v-model="showAddUserDialog" title="新增用户">
      <el-form
          ref="addUserFormRef"
          :model="addUserForm"
          :rules="addUserRules"
          label-width="100px"
      >
        <el-form-item label="用户" prop="name">
          <el-input v-model="addUserForm.name" placeholder="请输入用户名"/>
        </el-form-item>
        <!--TODO-->
        <el-form-item label="上传图片">
          <!--新增用户-->
          <el-upload
              class="upload-demo"
              name="photo"
              :show-file-list="false"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
              :before-upload="(file) => beforeUploadBase64(file, addUserForm.name)"
          >
            <el-button size="small" type="primary">选择图片</el-button>
            <template #tip>
              <div class="el-upload__tip">仅支持上传一张图片</div>
            </template>
          </el-upload>
          <!--           修改新增用户的 el-upload -->
          <!--          <el-upload-->
          <!--              class="upload-demo"-->
          <!--              :http-request="handleAddUserUpload"-->
          <!--          :show-file-list="false"-->
          <!--          >-->
          <!--          <el-button size="small" type="primary">选择图片</el-button>-->
          <!--          <template #tip>-->
          <!--            <div class="el-upload__tip">仅支持上传一张图片</div>-->
          <!--          </template>-->
          <!--          </el-upload>-->


        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddUserDialog = false">取消</el-button>
          <el-button type="primary" @click="handleAddUser">新增</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">

// 类型定义
interface User {
  /*userId: string*/
  name: string
  picId: string[]
}

interface ApiResponse {
  message?: string
  error?: string
}

import {ref, computed, onMounted} from 'vue'
import {ElMessage} from 'element-plus'
import {useRouter, useRoute} from 'vue-router'
// import axios from 'axios'
import my_axios from "@/api/index.ts";
import {HomeFilled, Document} from '@element-plus/icons-vue'
import type {FormInstance} from 'element-plus'
import type {UploadFile} from 'element-plus'

const router = useRouter()
const route = useRoute()
const activeMenu = computed(() => route.path)

// 修改类型声明
const users = ref<User[]>([])
const currentUser = ref<User | null>(null)

// 添加菜单选择处理函数
const handleMenuSelect = (index: string) => {
  router.push(index)
}

// 响应式状态
const query = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const showAddUserDialog = ref(false)
const addUserFormRef = ref<FormInstance | null>(null)
const addUserForm = ref({
  name: '',
  file: null
})
const fileList = ref<UploadFile[]>([])
const uploadAction = '/api/upload'

// 表单校验规则
const addUserRules = {
  name: [
    {required: true, message: '用户不能为空', trigger: 'blur'}
  ],
  file: [
    {required: false, message: '请上传图片文件', trigger: 'change'}
  ]
}




// 新增用户时的图片上传
const addUserFile = ref<File | null>(null); // 用于临时存储文件
const handleAddUserUpload = async (options: any) => {
  addUserFile.value = options.file; // 暂存文件
  return false; // 阻止默认上传
};
const handleUploadBase64 = async (base64String: string, name: string) => {
  try {
    const response = await my_axios.post<{
      id: string,
      message?: string,
      code?: number
    }>(`/api/user/${name}/photo/upload`, {
      base64: base64String
    });

    if (response.data.id) {
      if (!currentUser.value?.picId) {
        // currentUser.picId = [];
      }
      // currentUser.picId.push(response.data.id);
      ElMessage.success('上传成功！');
    } else if (response.data.message && response.data.code) {
      ElMessage.error(response.data.message);
    } else {
      ElMessage.error('接收格式出错！');
    }
  } catch (error) {
    console.error('上传失败:', error);
    // const errorMessage = error.response?.data?.error || error.message || '未知错误';
    // ElMessage.error('上传失败：' + errorMessage);
  }
};

// 计算属性
const pagedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return users.value.slice(start, end)
})

//done

const fetchUsers = async () => {
  try {
    console.log('Fetching users...');  // 添加调试日志
    // const response = await my_axios.get<User[]>('/api/users');
    const response = await my_axios.get<{
      faces: { image_id: string, subject: string }[],
      page_size: number,
      page_number: number,
      total_elements: number,
      total_pages: number
    }>('/api/users');
    console.log('Response:', response.data);  // 添加调试日志

    // 处理 response 数据
    const faces = response.data.faces;
    const userMap: { [key: string]: User } = {};

    faces.forEach(face => {
      const {image_id, subject} = face;
      if (!userMap[subject]) {
        userMap[subject] = {
          picId: [],
          name: subject
        };
      }
      userMap[subject].picId.push(image_id);
    });
    users.value = Object.values(userMap);
    // users.value = response.data || [];
  } catch (error: any) {
    console.error('获取用户列表失败:', error);
    ElMessage.error(error.response?.data?.error || '获取用户列表失败');
  }
};
//done

const queryUser = async (name: string) => {
  try {
    if (name) {
      await fetchUsers();
      // 模糊搜索 users 列表中 name 属性包含 name 的记录
      const filteredUsers = users.value.filter(user => user.name.toLowerCase().includes(name.toLowerCase()));
      if (filteredUsers.length > 0) {
        users.value = filteredUsers;
        ElMessage.success('查询成功！');
      } else {
        users.value = [];
        ElMessage.warning('未找到匹配的用户！');
      }
    } else {
      // 如果查询条件为空，获取所有用户
      await fetchUsers();
      ElMessage("查询条件为空，获取所有用户");
    }
  } catch (error) {
    console.error('查询用户失败:', error);
    ElMessage.error('查询用户失败！');
  }
};

//done

const handleQuery = () => {
  if (query.value) {
    queryUser(query.value);
  } else {
    fetchUsers(); // 如果查询条件为空，获取所有用户
    ElMessage("查询结果为空，获取所有用户")
  }
};
//done

const renameUser = async (user: User) => {
  const newName = prompt('请输入新的用户名：', user.name);
  if (!newName) {
    ElMessage("新用户名为空");
    return;
  }
  try {
    const response = await my_axios.put<{
      updated?: boolean,
      message?: string,
      code?: number
    }>(`/api/user/${user.name}/rename`, {
      newName: newName
    });

    if (response.data.updated) {
      user.name = newName;
      ElMessage.success('重命名成功！');
    } else if (response.data.message && response.data.code) {
      ElMessage.error(response.data.message);
    } else {
      ElMessage.error('接收格式出错！');
    }
    await fetchUsers();
  } catch (error) {
    console.error('重命名失败:', error);
    ElMessage.error('重命名失败！');
  }
};

//done
const deleteUser = async (user: User) => {
  try {
    const response = await my_axios.delete<{
      subject?: string,
      message?: string,
      code?: number
    }>(`/api/user/${user.name}/delete`);

    if (response.data.subject) {
      ElMessage.success('删除成功！');
    } else if (response.data.message && response.data.code) {
      ElMessage.error(response.data.message);
    } else {
      ElMessage.error('接收格式出错！');
    }
    await fetchUsers();

  } catch (error) {
    console.error('删除用户失败:', error);
    ElMessage.error('删除用户失败！');
  }
};

const clearAllUsers = async () => {
  try {
    const response = await my_axios.delete<{ deleted?: number, message?: string, code?: number }>('/api/users/clear');

    if (response.data.deleted) {
      ElMessage.success(`删除成功 ${response.data.deleted} 个用户信息！`);
    } else if (response.data.message && response.data.code) {
      ElMessage.error(response.data.message);
    } else {
      ElMessage.error('接收格式出错！');
    }
    await fetchUsers();

  } catch (error) {
    console.error('清空用户失败:', error);
    ElMessage.error('清空用户失败！');
  }
};
//done
const deletePicture = async (user: User, picId: string) => {
  try {
    const response = await my_axios.delete<{ image_id: string, subject: string }>(
        `/api/user/${user.name}/photo/${picId}/delete`
    );

    if (response.data.image_id) {
      // user.picId = user.picId.filter(id => id !== picId);

      await fetchUsers()
      ElMessage.success('图片已删除！');
    }
  } catch (error) {
    console.error('删除图片失败:', error);
    ElMessage.error('删除图片失败！');
  }
};

//done
const clearPictures = async (user: User) => {
  try {
    const response = await my_axios.delete<{ deleted: number }>(
        `/api/user/${user.name}/photos/clear`
    );
    if (response.data.deleted) {
      await fetchUsers();
      console.log("清空用户图片---------------");
      ElMessage.success(`已清空 ${response.data.deleted} 张图片！`);
    }
  } catch (error) {
    console.error('清空图片失败:', error);
    ElMessage.error('清空图片失败！');
  }
};

const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize
}

const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage
}

const handleUploadSuccess = (user: User, response: any) => {
  console.log('Upload success:', response);
  if (response && response.id) {
    if (!user.picId) {
      user.picId = [];
    }
    user.picId.push(response.id);
    ElMessage.success('上传成功！');
  }
};

const handleUploadError = (error: any) => {
  console.error('Upload error:', error);
  const errorMessage = error.response?.data?.error || error.message || '未知错误';
  ElMessage.error('上传失败：' + errorMessage);
};

const beforeUpload = (file: File, name: string) => {
  console.log('Before upload:', {name, fileName: file.name});

  if (!name) {
    ElMessage.error('请先输入用户！');
    return false;
  }
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    ElMessage.error('只能上传图片文件！');
    return false;
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB！');
    return false;
  }
  return true;
};
const beforeUploadBase64 = (file: File, name: string) => {
  console.log('Before upload base64:', {name, fileName: file.name});

  if (!name) {
    ElMessage.error('请先输入用户！');
    return false;
  }

  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    ElMessage.error('只能上传图片文件！');
    return false;
  }

  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB！');
    return false;
  }

  // 将文件转换为 Base64 编码的字符串
  const reader = new FileReader();
  reader.onload = (e: any) => {
    const base64String = e.target.result.split(',')[1]; // 去掉 data URL 的前缀
    handleUploadBase64(base64String, name);
  };
  reader.readAsDataURL(file);

  return false; // 阻止默认的上传行为
};

// 用户表格中的图片上传
const handleCustomUpload = async (options: any) => {
  const { file, action } = options;
  const user_id = action.split('/')[5]; // 从 URL 解析 user_id

  // 转 Base64
  const base64 = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result?.toString().split(',')[1]);
  });

  // 发送 JSON 请求
  try {
    const response = await my_axios.post<{
      subject: string,
      image_id: string
    }
    >(action, {
      image_base64: base64
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data.subject) {
      ElMessage.success('上传成功');
      await fetchUsers(); // 刷新数据
    }
    else throw new Error('返回值subject有误');
  } catch (error) {
    ElMessage.error('上传失败');
    await fetchUsers(); // 刷新数据

  }
};
const handleFileChange = (file: UploadFile, uploadedFiles: UploadFile[]) => {
  fileList.value = uploadedFiles
}

const handleAddUser = async () => {
  if (!addUserFormRef.value) return;

  try {
    const valid = await addUserFormRef.value.validate();
    if (!valid) {
      ElMessage.error("请填写用户名！");
      return;
    }

// 确保 addUserForm.value.name 不为 undefined
    if (!addUserForm.value.name) {
      ElMessage.error("用户名不能为空！");
      return;
    }

    const postData = {
      name: addUserForm.value.name.trim()
    };

    console.log('Sending data to API:', JSON.stringify(postData, null, 2)); // 更详细的调试日志


    // 先创建用户
    // const response = await my_axios.post<User>('/api/user/add', {
    //   name: addUserForm.value.name
    // });

    if (fileList.value.length != 0) {
      try {
        // 上传图片
        const formData = new FormData();
        formData.append('photo', fileList.value[0].raw as File);
        await my_axios.post<{
          subject: string,
          image_id: string
        }>(
            `/api/user/${addUserForm.value.name}/photo/upload`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            }
        );
        // if()
        ElMessage.success('用户+照片新增成功！');
        showAddUserDialog.value = false;
        fileList.value = []; // 清空文件列表
      } catch (error) {
        console.error('新增用户失败:', error);
        ElMessage.error(error.response?.data?.message || '用户新增失败！');
      }

    } else {
      try {
        const response = await my_axios.post<{
          subject: string
        }>('/api/user/add', postData);
        //   非空则抛出报错

        if(response.data.subject)
          ElMessage.success('用户新增成功！');
        else throw new Error("")

      } catch (error) {
        console.error('新增用户失败:', error);
        ElMessage.error(error.response?.data?.message || '用户新增失败！');
      }
    }
    await fetchUsers();
  }
  catch(error){
    console.error('新增用户失败:', error);
    ElMessage.error(error.response?.data?.message||'用户新增失败！');
  }
};

// 生命周期钩子
onMounted(() => {
  fetchUsers();

});
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

/* 侧边栏样式 */
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

/* 保留原有的其他样式... */
.el-main {
  padding: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 