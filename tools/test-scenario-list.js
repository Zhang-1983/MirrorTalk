const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testScenarioList() {
  try {
    // 测试管理员登录
    console.log('Testing admin login...');
    const adminLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    const adminToken = adminLoginResponse.data.data.token;
    console.log('Admin login success');

    // 管理员获取剧本列表
    console.log('\nAdmin getting scenarios...');
    const adminScenariosResponse = await axios.get(`${API_BASE_URL}/scenarios`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    console.log(`Admin sees ${adminScenariosResponse.data.data.length} scenarios`);
    console.log('Scenarios:', adminScenariosResponse.data.data.map((s) => ({ 
      title: s.title, 
      isActive: s.isActive 
    })));

    // 测试普通用户登录
    console.log('\nTesting user login...');
    const userLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'manager1@example.com',
      password: 'password123'
    });
    const userToken = userLoginResponse.data.data.token;
    console.log('User login success');

    // 普通用户获取剧本列表
    console.log('\nUser getting scenarios...');
    const userScenariosResponse = await axios.get(`${API_BASE_URL}/scenarios`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    console.log(`User sees ${userScenariosResponse.data.data.length} scenarios`);
    console.log('Scenarios:', userScenariosResponse.data.data.map((s) => ({ 
      title: s.title, 
      isActive: s.isActive 
    })));

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testScenarioList();