const axios = require('axios');

async function testAdminLogin() {
  try {
    console.log('测试管理员账号登录...');
    
    const response = await axios.post('http://localhost:3003/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    console.log('登录成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('登录失败:', error.response?.data || error.message);
    return null;
  }
}

testAdminLogin();
