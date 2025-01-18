// 智谱API配置
const API_CONFIG = {
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    apiKey: '10b89125689b4f2b8e1bd3cbfcd47312.4IZF3wRASVgBWC2m',
    model: 'glm-4-flash'
};

// 生成请求头
function generateHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.apiKey}`
    };
}

// 构建prompt
function buildPrompt(englishName, gender) {
    const genderText = gender === 'male' ? '男' : '女';
    return `你现在是一位专业的中文姓名专家，请为一个英文名为 ${englishName} 的${genderText}性设计4个富有文化内涵的中文名字。

要求：
1. 姓氏选择原则：
   - 必须选择常见的中国姓氏
   - 优先选择与英文名发音相近或相关的姓氏（例如：英文名 "Swift" 可以选择发音相近的姓氏如"司"、"史"等）
   - 姓氏拼音必须使用标准的汉语拼音，首字母大写（如：Si、Shi）
   - 解释姓氏时要说明音译关联："Family name [姓] chosen for its sound similarity to [对应英文]"

2. 名字要求：
   - 名字要体现中国传统文化特色
   - 要考虑性别特征，为${genderText}性选择合适的字
   - 名字发音要优美
   - 生成4个不同风格的名字，体现不同的文化内涵

3. 整体原则：
   - 音译与文化意义要平衡
   - 确保名字整体读起来自然、优美
   - 避免生僻字或罕见姓氏

请按以下JSON格式返回结果（不要包含任何其他文字）：
{
  "names": [
    {
      "chinese": "完整中文名",
      "pinyin": "完整拼音（姓氏首字母大写）",
      "characters": {
        "姓": "Family name [姓] chosen for its sound similarity to [对应英文部分], meaning: [含义]",
        "名1": "第一个字的含义",
        "名2": "第二个字的含义"
      },
      "cultural": "文化内涵解释（限50字）",
      "personality": "个性特征描述（限50字）",
      "english": "英文说明（限50字）"
    }
  ]
}`;
}

// 调用智谱API生成名字
async function generateChineseNames(englishName, gender) {
    try {
        const response = await fetch(API_CONFIG.baseUrl, {
            method: 'POST',
            headers: generateHeaders(),
            body: JSON.stringify({
                model: API_CONFIG.model,
                messages: [
                    {
                        role: "user",
                        content: buildPrompt(englishName, gender)
                    }
                ],
                temperature: 0.7,
                top_p: 0.9,
                max_tokens: 2000,
                stream: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API请求失败: ${response.status}`);
        }

        const data = await response.json();
        
        // 解析API返回的JSON字符串
        try {
            const content = data.choices[0].message.content;
            return JSON.parse(content);
        } catch (e) {
            console.error('解析API返回结果失败:', e);
            throw new Error('无法解析API返回的结果');
        }
    } catch (error) {
        console.error('生成名字时出错:', error);
        throw error;
    }
}

export { generateChineseNames };
