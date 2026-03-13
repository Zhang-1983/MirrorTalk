const axios = require('axios');

// 测试后端API端点
async function testBackendAPI() {
  console.log('=== 测试后端API端点 ===');
  
  // 测试1：健康检查端点
  console.log('\n1. 测试健康检查端点:');
  try {
    const response = await axios.get('http://localhost:3003/health');
    console.log('Health check response:', response.data);
  } catch (error) {
    console.error('Health check error:', error.message);
  }
  
  // 测试2：根路径
  console.log('\n2. 测试根路径:');
  try {
    const response = await axios.get('http://localhost:3003/');
    console.log('Root path response:', response.data);
  } catch (error) {
    console.error('Root path error:', error.message);
  }
  
  // 测试3：登录API
  console.log('\n3. 测试登录API:');
  try {
    const response = await axios.post('http://localhost:3003/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('Login response:', response.data);
    
    // 测试4：生成剧本API（带token）
    if (response.data.success) {
      const token = response.data.data.token;
      console.log('\n4. 测试生成剧本API（带token）:');
      try {
        const generateResponse = await axios.post('http://localhost:3003/api/scenarios/generate', {
          prompt: '测试剧本生成：管理者与绩效下滑员工的沟通'
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('Generate scenario response:', generateResponse.data);
      } catch (error) {
        console.error('Generate scenario error:', error.response ? error.response.data : error.message);
      }
    }
  } catch (error) {
    console.error('Login error:', error.response ? error.response.data : error.message);
  }
}

testBackendAPI();