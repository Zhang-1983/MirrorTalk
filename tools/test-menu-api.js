const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testMenuApi() {
  try {
    // 登录获取token
    console.log('Testing login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    const token = loginResponse.data.data.token;
    console.log('Login success\n');

    // 测试获取菜单
    console.log('Testing get menu...');
    const getMenuResponse = await axios.get(`${API_BASE_URL}/users/menu`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Get menu response:', JSON.stringify(getMenuResponse.data, null, 2));

    if (getMenuResponse.data.success) {
      const menuItems = getMenuResponse.data.data;
      console.log(`\nFound ${menuItems.length} menu items`);
      
      // 修改第一个菜单项的可见性
      if (menuItems.length > 0) {
        const updatedMenu = menuItems.map((item, index) => ({
          ...item,
          isVisible: index === 0 ? !item.isVisible : item.isVisible
        }));

        // 测试更新菜单
        console.log('\nTesting update menu...');
        console.log('Sending menu items:', JSON.stringify(updatedMenu, null, 2));
        
        const updateResponse = await axios.patch(
          `${API_BASE_URL}/users/menu`,
          updatedMenu,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        console.log('Update menu response:', JSON.stringify(updateResponse.data, null, 2));

        // 再次获取菜单验证
        console.log('\nVerifying update...');
        const verifyResponse = await axios.get(`${API_BASE_URL}/users/menu`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Updated menu:', JSON.stringify(verifyResponse.data.data[0], null, 2));
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testMenuApi();