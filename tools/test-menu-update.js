const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testMenuUpdate() {
  try {
    // 登录获取token
    console.log('Testing login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    const token = loginResponse.data.data.token;
    console.log('Login success\n');

    // 获取当前菜单
    console.log('Getting current menu...');
    const menuResponse = await axios.get(`${API_BASE_URL}/users/menu`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const currentMenu = menuResponse.data.data;
    console.log('Current menu:', currentMenu.map(m => ({ name: m.name, isVisible: m.isVisible })));
    console.log();

    // 修改第一个菜单项的可见性
    const updatedMenu = currentMenu.map((item, index) => ({
      name: item.name,
      key: item.key,
      isVisible: index === 0 ? !item.isVisible : item.isVisible,
      order: item.order
    }));
    
    console.log('Updating menu...');
    console.log('New menu state:', updatedMenu.map(m => ({ name: m.name, isVisible: m.isVisible })));
    console.log();

    // 发送更新请求 - 不包含id和userId
    const updateResponse = await axios.patch(
      `${API_BASE_URL}/users/menu`,
      updatedMenu,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    console.log('Update response:', updateResponse.data);
    console.log();

    // 验证更新
    console.log('Verifying update...');
    const verifyResponse = await axios.get(`${API_BASE_URL}/users/menu`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Updated menu:', verifyResponse.data.data.map(m => ({ name: m.name, isVisible: m.isVisible })));

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testMenuUpdate();