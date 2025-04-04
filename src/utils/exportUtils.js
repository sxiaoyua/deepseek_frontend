/**
 * 导出工具类 - 用于将对话导出为不同格式
 */

/**
 * 将对话导出为纯文本格式
 * @param {Object} conversation - 对话对象
 * @returns {string} - 纯文本格式的对话内容
 */
export const exportAsText = (conversation) => {
  if (!conversation || !conversation.messages || !conversation.messages.length) {
    return '';
  }

  const title = `标题：${conversation.title || '未命名对话'}\n`;
  const date = `日期：${new Date(conversation.createdAt).toLocaleString()}\n\n`;
  
  const messages = conversation.messages.map(msg => {
    const sender = msg.role === 'user' ? '你' : 'DeepSeek AI';
    return `${sender}：${msg.content}\n`;
  }).join('\n');
  
  return `${title}${date}${messages}`;
};

/**
 * 将对话导出为Markdown格式
 * @param {Object} conversation - 对话对象
 * @returns {string} - Markdown格式的对话内容
 */
export const exportAsMarkdown = (conversation) => {
  if (!conversation || !conversation.messages || !conversation.messages.length) {
    return '';
  }

  const title = `# ${conversation.title || '未命名对话'}\n`;
  const date = `*创建于：${new Date(conversation.createdAt).toLocaleString()}*\n\n`;
  
  const messages = conversation.messages.map(msg => {
    const sender = msg.role === 'user' ? '**你**' : '**DeepSeek AI**';
    // 对AI的回复使用引用块，使其在Markdown中更易区分
    if (msg.role === 'assistant') {
      return `${sender}：\n> ${msg.content.replace(/\n/g, '\n> ')}\n`;
    }
    return `${sender}：\n${msg.content}\n`;
  }).join('\n');
  
  return `${title}${date}${messages}`;
};

/**
 * 将对话导出为JSON格式
 * @param {Object} conversation - 对话对象
 * @returns {string} - JSON格式的对话内容
 */
export const exportAsJson = (conversation) => {
  if (!conversation) {
    return '{}';
  }

  const exportData = {
    title: conversation.title || '未命名对话',
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    messages: conversation.messages || []
  };
  
  return JSON.stringify(exportData, null, 2);
};

/**
 * 根据指定格式导出对话
 * @param {Object} conversation - 对话对象
 * @param {string} format - 导出格式 ('txt', 'markdown', 'json')
 * @returns {Object} - 包含导出内容和文件名的对象
 */
export const exportConversation = (conversation, format) => {
  if (!conversation) {
    throw new Error('对话数据不能为空');
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const title = (conversation.title || '未命名对话').replace(/[\\/:*?"<>|]/g, '_');
  let content = '';
  let filename = '';
  
  switch (format) {
    case 'txt':
      content = exportAsText(conversation);
      filename = `${title}_${timestamp}.txt`;
      break;
    case 'markdown':
    case 'md':
      content = exportAsMarkdown(conversation);
      filename = `${title}_${timestamp}.md`;
      break;
    case 'json':
      content = exportAsJson(conversation);
      filename = `${title}_${timestamp}.json`;
      break;
    default:
      throw new Error(`不支持的导出格式: ${format}`);
  }
  
  return { content, filename };
};

/**
 * 触发文件下载
 * @param {string} content - 文件内容
 * @param {string} filename - 文件名
 * @param {string} type - MIME类型
 */
export const downloadFile = (content, filename, type = 'text/plain') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  
  document.body.appendChild(a);
  a.click();
  
  // 清理
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};

/**
 * 导出并下载对话
 * @param {Object} conversation - 对话对象
 * @param {string} format - 导出格式
 */
export const exportAndDownload = (conversation, format) => {
  try {
    const { content, filename } = exportConversation(conversation, format);
    
    let mimeType = 'text/plain';
    if (format === 'json') {
      mimeType = 'application/json';
    } else if (format === 'markdown' || format === 'md') {
      mimeType = 'text/markdown';
    }
    
    downloadFile(content, filename, mimeType);
    return true;
  } catch (error) {
    console.error('导出对话失败:', error);
    return false;
  }
};
