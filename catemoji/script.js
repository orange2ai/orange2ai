// API配置
const API_CONFIG = {
    url: 'https://api.coze.cn/v3/chat',
    token: 'pat_l3kdaWugbGcJ2unXtzSw6e4wG6kJmU9EGbCnpMreJIqzqQJNA8MV6eHVDWAeLVmr',
    bot_id: '7461173780279902247',
    user_id: '123456789'
};

let currentImageUrl = ''; // 保存当前图片URL

async function sendRequest() {
    const inputText = document.getElementById('input').value.trim();
    const responseDiv = document.getElementById('response');
    const imagePreview = document.getElementById('imagePreview');
    const loading = document.getElementById('loading');
    const resultSection = document.getElementById('resultSection');
    const saveButton = document.getElementById('saveButton');
    
    if (!inputText) {
        alert('请输入表情包描述！');
        return;
    }

    // 清空之前的响应和图片
    responseDiv.textContent = '';
    imagePreview.innerHTML = '';
    resultSection.classList.remove('active');
    loading.style.display = 'block';
    saveButton.disabled = true;
    currentImageUrl = '';

    try {
        const response = await fetch(API_CONFIG.url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_CONFIG.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bot_id: API_CONFIG.bot_id,
                user_id: API_CONFIG.user_id,
                stream: true,
                auto_save_history: true,
                additional_messages: [
                    {
                        role: 'user',
                        content: inputText,
                        content_type: 'text'
                    }
                ]
            })
        });

        // 检查响应状态
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 获取响应的可读流
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let finalContent = '';

        // 处理流式响应
        while (true) {
            const {value, done} = await reader.read();
            if (done) break;
            
            // 解码响应数据
            buffer += decoder.decode(value, {stream: true});
            
            // 处理完整的事件
            const events = buffer.split('\n\n');
            buffer = events.pop() || ''; // 保留最后一个不完整的事件

            for (const event of events) {
                if (!event.trim()) continue;
                
                const lines = event.split('\n');
                const eventType = lines[0].replace('event:', '');
                const dataStr = lines[1].replace('data:', '');

                try {
                    if (eventType === 'conversation.message.delta') {
                        const data = JSON.parse(dataStr);
                        if (data.type === 'answer' && data.content) {
                            finalContent = data.content;
                            // 如果是图片链接，创建图片预览
                            if (finalContent.startsWith('http')) {
                                resultSection.classList.add('active');
                                const img = document.createElement('img');
                                img.src = finalContent;
                                img.alt = '生成的表情包';
                                img.title = '点击查看原图';
                                img.onclick = () => window.open(finalContent, '_blank');
                                imagePreview.innerHTML = '';
                                imagePreview.appendChild(img);
                                currentImageUrl = finalContent;
                                saveButton.disabled = false;
                            }
                        }
                    } else if (eventType === 'done') {
                        loading.style.display = 'none';
                    }
                } catch (e) {
                    console.error('解析事件数据失败:', e);
                }
            }
        }

        if (!finalContent) {
            resultSection.classList.add('active');
            responseDiv.textContent = '未能生成表情包，请重试';
            saveButton.disabled = true;
        }

    } catch (error) {
        console.error('Error:', error);
        resultSection.classList.add('active');
        responseDiv.textContent = `生成失败：${error.message}`;
        loading.style.display = 'none';
        saveButton.disabled = true;
    }
}

async function saveImage() {
    if (!currentImageUrl) {
        alert('没有可保存的图片！');
        return;
    }

    try {
        // 获取原始图片
        const response = await fetch(currentImageUrl);
        const blob = await response.blob();
        
        // 创建一个Image对象来加载图片
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });
        
        // 创建canvas来转换图片格式
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 在canvas上绘制图片
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // 将canvas内容转换为jpg格式
        const jpgUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        // 创建下载链接
        const link = document.createElement('a');
        link.href = jpgUrl;
        
        // 使用本地时间并格式化文件名
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');
        const second = String(now.getSeconds()).padStart(2, '0');
        
        const fileName = `猫猫表情包_${year}${month}${day}_${hour}${minute}${second}.jpg`;
        link.download = fileName;
        
        // 模拟点击下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 清理资源
        URL.revokeObjectURL(img.src);
    } catch (error) {
        console.error('保存图片失败:', error);
        alert('保存失败，请重试！');
    }
}
