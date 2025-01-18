// 配置CORS响应头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 处理OPTIONS请求
async function handleOptions(request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

// 转发流式响应
async function forwardStream(readable, writable) {
  const reader = readable.getReader();
  const writer = writable.getWriter();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      await writer.write(value);
    }
  } finally {
    writer.close();
  }
}

// 主处理函数
async function handleRequest(request) {
  // 处理OPTIONS请求
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }

  // 只接受POST请求
  if (request.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    // 获取请求内容
    const { content } = await request.json();

    if (!content) {
      return new Response('Content is required', {
        status: 400,
        headers: corsHeaders
      });
    }

    // 准备发送到Coze API的请求
    const cozeRequest = new Request('https://api.coze.cn/v3/chat', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer pat_l3kdaWugbGcJ2unXtzSw6e4wG6kJmU9EGbCnpMreJIqzqQJNA8MV6eHVDWAeLVmr',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bot_id: '7461173780279902247',
        user_id: '123456789',
        stream: true,
        auto_save_history: true,
        additional_messages: [
          {
            role: 'user',
            content: content,
            content_type: 'text'
          }
        ]
      })
    });

    // 发送请求到Coze API
    const cozeResponse = await fetch(cozeRequest);

    // 检查响应状态
    if (!cozeResponse.ok) {
      throw new Error(`Coze API error: ${cozeResponse.status}`);
    }

    // 创建新的TransformStream用于转发响应
    const { readable, writable } = new TransformStream();

    // 在后台转发流
    forwardStream(cozeResponse.body, writable);

    // 返回流式响应
    return new Response(readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
}

// 注册Worker
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
