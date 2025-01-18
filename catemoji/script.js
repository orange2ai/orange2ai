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
        const response = await fetch(currentImageUrl);
        const blob = await response.blob();
        
        // 创建一个临时的a标签用于下载
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        
        // 获取文件名
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `柴犬表情包_${timestamp}.png`;
        
        // 模拟点击下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 清理URL对象
        URL.revokeObjectURL(link.href);
    } catch (error) {
        console.error('保存图片失败:', error);
        alert('保存失败，请重试！');
    }
}
