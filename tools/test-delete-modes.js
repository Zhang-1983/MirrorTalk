const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testDeleteModes() {
  try {
    // 管理员登录
    console.log('Testing admin login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    const token = loginResponse.data.data.token;
    console.log('Admin login success\n');

    // 获取所有剧本
    console.log('Getting all scenarios...');
    const scenariosResponse = await axios.get(`${API_BASE_URL}/scenarios`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const scenarios = scenariosResponse.data.data;
    console.log(`Found ${scenarios.length} scenarios`);
    
    // 找一个自定义剧本进行测试
    const customScenario = scenarios.find(s => s.title.includes('自定义'));
    if (!customScenario) {
      console.log('No custom scenario found for testing');
      return;
    }
    
    console.log(`\nTesting with scenario: ${customScenario.title} (ID: ${customScenario.id})`);
    console.log(`Current status: ${customScenario.isActive ? 'Active' : 'Inactive'}`);

    // 测试软删除
    console.log('\n--- Testing Soft Delete ---');
    const softDeleteResponse = await axios.delete(
      `${API_BASE_URL}/scenarios/${customScenario.id}?mode=soft`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    console.log('Soft delete response:', softDeleteResponse.data);

    // 验证软删除结果
    const afterSoftDelete = await axios.get(`${API_BASE_URL}/scenarios`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const softDeletedScenario = afterSoftDelete.data.data.find(s => s.id === customScenario.id);
    console.log(`After soft delete - isActive: ${softDeletedScenario.isActive}`);

    // 恢复剧本以便测试硬删除
    console.log('\n--- Restoring scenario for hard delete test ---');
    await axios.patch(
      `${API_BASE_URL}/scenarios/${customScenario.id}/status`,
      { isActive: true },
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    console.log('Scenario restored');

    // 测试硬删除
    console.log('\n--- Testing Hard Delete ---');
    const hardDeleteResponse = await axios.delete(
      `${API_BASE_URL}/scenarios/${customScenario.id}?mode=hard`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    console.log('Hard delete response:', hardDeleteResponse.data);

    // 验证硬删除结果
    const afterHardDelete = await axios.get(`${API_BASE_URL}/scenarios`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const hardDeletedScenario = afterHardDelete.data.data.find(s => s.id === customScenario.id);
    if (!hardDeletedScenario) {
      console.log('✅ Hard delete successful - scenario completely removed');
    } else {
      console.log('❌ Hard delete failed - scenario still exists');
    }

    console.log(`\nFinal scenario count: ${afterHardDelete.data.data.length}`);

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testDeleteModes();