const axios = require('axios');
const jwt = require('jsonwebtoken');

const API_BASE_URL = 'http://localhost:3001/api';

async function testMenuDebug() {
  try {
    // 登录获取token
    console.log('Testing login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    const token = loginResponse.data.data.token;
    console.log('Login success');
    console.log('Token:', token.substring(0, 50) + '...');
    
    // 解码token查看用户信息
    const decoded = jwt.decode(token);
    console.log('Decoded token:', decoded);
    console.log('UserId from token:', decoded.userId);
    console.log();

    // 获取当前用户信息
    console.log('Getting current user info...');
    const userResponse = await axios.get(`${API_BASE_URL}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Current user:', userResponse.data.data);
    console.log();

    // 获取菜单
    console.log('Getting menu...');
    const menuResponse = await axios.get(`${API_BASE_URL}/users/menu`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Menu items count:', menuResponse.data.data.length);
    console.log('First menu item userId:', menuResponse.data.data[0]?.userId);
    console.log();

    // 尝试更新菜单（简化版）
    console.log('Testing update menu with minimal data...');
    const simpleMenu = [
      { name: '仪表盘', key: 'dashboard', isVisible: true, order: 0 }
    ];
    
    try {
      const updateResponse = await axios.patch(
        `${API_BASE_URL}/users/menu`,
        simpleMenu,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      console.log('Update success:', updateResponse.data);
    } catch (updateError) {
      console.error('Update failed:', updateError.response?.status);
      console.error('Error data:', updateError.response?.data);
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testMenuDebug();