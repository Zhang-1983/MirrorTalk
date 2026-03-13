import axios from 'axios';

// 测试删除用户功能
async function testDeleteUser() {
  try {
    // 1. 登录管理员账号获取令牌
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@mirroetalk.com',
      password: 'admin123'
    });

    if (!loginResponse.data.success) {
      console.error('❌ 登录失败:', loginResponse.data.error);
      return;
    }

    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功，获取到令牌');

    // 2. 创建一个测试用户
    const registerResponse = await axios.post('http://localhost:3001/api/auth/register', {
      email: 'testdelete2@example.com',
      password: '123456',
      name: '测试用户2'
    });

    if (!registerResponse.data.success) {
      console.error('❌ 创建测试用户失败:', registerResponse.data.error);
      return;
    }

    const testUserId = registerResponse.data.data.user.id;
    console.log('✅ 创建测试用户成功，用户ID:', testUserId);

    // 3. 尝试删除测试用户
    const deleteResponse = await axios.delete(`http://localhost:3001/api/users/${testUserId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (deleteResponse.data.success) {
      console.log('✅ 删除用户成功!');
    } else {
      console.error('❌ 删除用户失败:', deleteResponse.data.error);
    }

  } catch (error: any) {
    console.error('❌ 测试过程中出错:', error.response?.data || error.message);
  }
}

testDeleteUser();