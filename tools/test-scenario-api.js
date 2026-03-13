const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testScenarioAPI() {
  try {
    // 测试登录
    console.log('Testing login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));

    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;

      // 测试获取剧本列表
      console.log('\nTesting get scenarios...');
      const scenariosResponse = await axios.get(`${API_BASE_URL}/scenarios`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Scenarios response:', JSON.stringify(scenariosResponse.data, null, 2));

      if (scenariosResponse.data.success && scenariosResponse.data.data.length > 0) {
        const scenarioId = scenariosResponse.data.data[0].id;
        
        // 测试更新剧本状态
        console.log('\nTesting update scenario status:', scenarioId);
        const updateResponse = await axios.patch(`${API_BASE_URL}/scenarios/${scenarioId}/status`, 
          { isActive: false },
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        console.log('Update status response:', JSON.stringify(updateResponse.data, null, 2));

        // 测试删除剧本
        console.log('\nTesting delete scenario:', scenarioId);
        const deleteResponse = await axios.delete(`${API_BASE_URL}/scenarios/${scenarioId}`, {
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

testScenarioAPI();