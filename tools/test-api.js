const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testAPI() {
  try {
    // 测试健康检查
    console.log('Testing health check...');
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('Health check:', healthResponse.data);

    // 测试登录
    console.log('\nTesting login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));

    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      const user = loginResponse.data.data.user;

      console.log('\nLogged in as:', user.name, '(', user.role, ')');

      // 测试获取用户列表
      console.log('\nTesting get users...');
      const usersResponse = await axios.get(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Users response:', JSON.stringify(usersResponse.data, null, 2));

      if (usersResponse.data.success && usersResponse.data.data.length > 0) {
        const userId = usersResponse.data.data[0].id;
        
        // 测试删除用户
        console.log('\nTesting delete user:', userId);
        const deleteResponse = await axios.delete(`${API_BASE_URL}/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('Delete response:', JSON.stringify(deleteResponse.data, null, 2));
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testAPI();