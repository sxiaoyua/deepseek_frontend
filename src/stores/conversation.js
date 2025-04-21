import { defineStore } from 'pinia';
import axios from 'axios';

// 设置基础URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useConversationStore = defineStore('conversation', {
  state: () => ({
    conversations: [],
    currentConversation: null,
    loading: false,
    error: null,
    // 新增模型相关状态
    availableModels: [],
    currentModel: null,
    modelCapabilities: {},
    // 新增：流式响应状态
    streamingMessage: null,
    isStreaming: true,
    streamController: null
  }),
  
  getters: {
    // 保留原有getter用于兼容性
    conversationList: (state) => state.conversations,
    currentMessages: (state) => state.currentConversation?.messages || [],
    // 新增getter，获取当前模型是否支持图像
    supportsImages: (state) => {
      return state.currentModel && state.modelCapabilities[state.currentModel]?.supportsImages || false;
    }
  },
  
  actions: {
    // 获取可用的AI模型列表
    async getModels() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.get(`${API_URL}/chat/models`);
        const { current, available, capabilities } = response.data.data;
        
        this.currentModel = current;
        this.availableModels = available;
        this.modelCapabilities = capabilities;
        
        // 确保模型能力对象包含所有可用模型
        if (available && capabilities) {
          // 添加文本模型的能力信息
          if (available.textModels && Array.isArray(available.textModels)) {
            available.textModels.forEach(model => {
              if (!this.modelCapabilities[model.id]) {
                this.modelCapabilities[model.id] = { supportsImages: false };
              }
            });
          }
          
          // 添加多模态模型的能力信息
          if (available.multimodalModels && Array.isArray(available.multimodalModels)) {
            available.multimodalModels.forEach(model => {
              if (!this.modelCapabilities[model.id]) {
                this.modelCapabilities[model.id] = { supportsImages: true };
              }
            });
          }
        }
        
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || '获取模型列表失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 设置当前使用的AI模型
    async setModel(modelId) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.post(`${API_URL}/chat/models/set`, { modelId });
        const { model, supportsImages } = response.data.data;
        
        this.currentModel = model;
        // 更新此模型的能力
        if (this.modelCapabilities[model]) {
          this.modelCapabilities[model].supportsImages = supportsImages;
        } else {
          this.modelCapabilities[model] = { supportsImages };
        }
        
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || '设置模型失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 获取所有对话列表 (新方法名，兼容Chat.vue修改)
    async getConversations() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.get(`${API_URL}/conversations`);
        this.conversations = response.data.data;
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || '获取对话列表失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 兼容旧方法名，调用新方法
    async fetchConversations() {
      return this.getConversations();
    },
    
    // 获取单个对话详情 (新方法名，兼容Chat.vue修改)
    async getConversation(id) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.get(`${API_URL}/conversations/${id}`);
        this.currentConversation = response.data.data;
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || '获取对话详情失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 获取完整对话，包括所有消息（适用于导出功能）
    async getFullConversation(id) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.get(`${API_URL}/conversations/${id}/full`);
        return response.data.data;
      } catch (error) {
        this.error = error.response?.data?.message || '获取完整对话失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 兼容旧方法名，调用新方法
    async fetchConversation(id) {
      return this.getConversation(id);
    },
    
    // 创建新对话
    async createConversation(title = '新对话') {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.post(`${API_URL}/conversations`, { title });
        const newConversation = response.data.data;
        this.conversations.unshift(newConversation);
        this.currentConversation = newConversation;
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || '创建对话失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 更新对话标题和其他信息
    async updateConversation(id, data) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.put(`${API_URL}/conversations/${id}`, data);
        const updatedConversation = response.data.data;
        
        // 更新状态中的对话
        const index = this.conversations.findIndex(conv => conv._id === id);
        if (index !== -1) {
          this.conversations[index] = updatedConversation;
        }
        
        // 如果是当前对话，也更新当前对话
        if (this.currentConversation && this.currentConversation._id === id) {
          this.currentConversation = updatedConversation;
        }
        
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || '更新对话失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 删除对话
    async deleteConversation(id) {
      this.loading = true;
      this.error = null;
      
      try {
        await axios.delete(`${API_URL}/conversations/${id}`);
        
        // 从状态中移除对话
        this.conversations = this.conversations.filter(conv => conv._id !== id);
        
        // 如果删除的是当前对话，重置当前对话
        if (this.currentConversation && this.currentConversation._id === id) {
          this.currentConversation = null;
        }
        
        return { success: true };
      } catch (error) {
        this.error = error.response?.data?.message || '删除对话失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 发送消息到AI - 支持文本和图像
    async sendMessage(options) {
      this.loading = true;
      this.error = null;
      
      try {
        const { content, imageUrl } = options;
        const conversationId = this.currentConversation?._id;
        
        const payload = { 
          message: content
        };
        
        // 如果有图像URL，添加到请求中
        if (imageUrl) {
          payload.imageUrl = imageUrl;
        }
        
        if (conversationId) {
          payload.conversationId = conversationId;
        }
        
        // 判断是否使用流式响应
        const currentModel = this.currentModel;
        const useStream = true;
        
        if (useStream) {
          return this.sendStreamMessage(payload);
        } else {
          // 使用普通响应
          const response = await axios.post(`${API_URL}/chat/send`, payload);
          const data = response.data.data;
          
          // 如果是新对话，需要添加到对话列表
          if (!conversationId) {
            await this.getConversation(data.conversationId);
            await this.getConversations();
          } else {
            // 更新当前对话中的消息
            if (this.currentConversation && this.currentConversation._id === conversationId) {
              await this.getConversation(conversationId);
            }
          }
          
          return response.data;
        }
      } catch (error) {
        this.error = error.response?.data?.message || '发送消息失败';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 新增：发送流式消息
    async sendStreamMessage(payload) {
      try {
        // 初始化流式响应状态
        this.isStreaming = true;
        this.streamingMessage = {
          role: 'assistant',
          content: '',
          reasoning: '',
          hasReasoning: false,
          timestamp: new Date()
        };
        
        // 创建AbortController以便在需要时中断请求
        this.streamController = new AbortController();
        const { signal } = this.streamController;
        
        // 发起fetch请求
        const response = await fetch(`${API_URL}/chat/send-stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(payload),
          signal
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // 处理返回的流
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let conversationId = null;
        
        // 处理数据流
        const processStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                console.log('流结束');
                break;
              }
              
              // 解码并添加到缓冲区
              buffer += decoder.decode(value, { stream: true });
              
              // 处理完整的SSE事件
              const events = buffer.split('\n\n');
              buffer = events.pop() || ''; // 保留最后一个不完整的事件
              
              for (const event of events) {
                if (!event.trim()) continue;
                
                const lines = event.split('\n');
                const eventType = lines[0].replace('event: ', '');
                const eventData = lines[1].replace('data: ', '');
                
                try {
                  const data = JSON.parse(eventData);
                  
                  switch (eventType) {
                    case 'start':
                      console.log('开始事件:', data);
                      if (data.conversationId) {
                        conversationId = data.conversationId;
                      }
                      break;
                      
                    case 'reasoning':
                      // 接收到思考过程
                      this.streamingMessage.hasReasoning = true;
                      this.streamingMessage.reasoning += data.chunk;
                      break;
                      
                    case 'content':
                      // 接收到内容
                      this.streamingMessage.content += data.chunk;
                      break;
                      
                    case 'complete':
                      console.log('完成事件:', data);
                      // 完成后更新对话
                      if (data.conversationId) {
                        conversationId = data.conversationId;
                      }
                      
                      // 保存最终消息
                      const finalMessage = { ...this.streamingMessage };
                      
                      // 重置流式状态
                      this.streamingMessage = null;
                      this.isStreaming = false;
                      
                      // 更新对话和列表的ID（但不重新获取内容）
                      if (conversationId) {
                        // 如果是新建的对话，需要更新列表（轻量更新方式）
                        if (!this.currentConversation || this.currentConversation._id !== conversationId) {
                          // 如果是新对话，只获取对话列表
                          await this.getConversations();
                          
                          // 设置当前对话ID
                          if (!this.currentConversation) {
                            this.currentConversation = { _id: conversationId };
                          }
                        }
                        
                        // 注意：不再调用getConversation(id)获取详情，避免额外请求和UI闪烁
                      }
                      break;
                      
                    case 'error':
                      console.error('错误事件:', data);
                      throw new Error(data.error || '流式响应错误');
                  }
                } catch (e) {
                  console.error('解析事件数据错误:', e);
                }
              }
            }
          } catch (error) {
            console.error('流处理错误:', error);
            // 重置流式状态
            this.streamingMessage = null;
            this.isStreaming = false;
            throw error;
          }
        };
        
        // 处理流
        await processStream();
        
        return {
          success: true,
          data: { conversationId }
        };
      } catch (error) {
        this.isStreaming = false;
        this.streamingMessage = null;
        this.error = error.message || '流式响应失败';
        throw error;
      }
    },
    
    // 新增：取消流式响应
    cancelStreamResponse() {
      if (this.streamController) {
        this.streamController.abort();
        this.streamController = null;
      }
      this.resetStreamState();
    },
    
    // 新增：重置流式状态
    resetStreamState() {
      this.isStreaming = false;
      this.streamingMessage = null;
    },
    
    // 清除当前对话
    clearCurrentConversation() {
      this.currentConversation = null;
      this.resetStreamState();
    },
    
    // 新增：直接分析图像，不保存对话历史
    async analyzeImage(prompt, imageUrl) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.post(`${API_URL}/chat/analyze-image`, {
          prompt,
          imageUrl
        });
        
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || '图像分析失败';
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
});
