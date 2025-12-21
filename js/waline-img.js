// Waline 自定义图片上传 - 使用 imgbb 图床
// 请将 YOUR_API_KEY 替换为你在 https://api.imgbb.com 获取的 API Key

window.walineOptions = window.walineOptions || {};
window.walineOptions.imageUploader = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    const res = await fetch('https://api.imgbb.com/1/upload?key=71de7a48dbd352fc1427d32157dd302f', {
      method: 'POST',
      body: formData
    });
    
    const data = await res.json();
    
    if (data.success) {
      return data.data.url;
    } else {
      throw new Error('上传失败');
    }
  } catch (err) {
    console.error('图片上传错误:', err);
    throw err;
  }
};
