/**
 * 内存存储实现（用于开发和测试）
 */

class MemoryStorage {
  constructor(config) {
    this.config = {
      type: 'memory',
      maxSize: config.maxSize || 10000,
      ...config
    };
    
    this.storage = new Map();
    this.isInitialized = false;
  }
  
  async initialize() {
    this.isInitialized = true;
    console.log('✅ 内存存储已初始化');
  }
  
  async save(key, data) {
    await this.initialize();
    
    if (this.storage.size >= this.config.maxSize) {
      // 简单的LRU策略：删除第一个键
      const firstKey = this.storage.keys().next().value;
      this.storage.delete(firstKey);
    }
    
    this.storage.set(key, data);
    return key;
  }
  
  async get(key) {
    await this.initialize();
    return this.storage.get(key) || null;
  }
  
  async delete(key) {
    await this.initialize();
    return this.storage.delete(key);
  }
  
  async createAgentSpace(agentId) {
    return `agents/${agentId}/`;
  }
  
  async close() {
    this.storage.clear();
    console.log('👋 内存存储已关闭');
  }
}

module.exports = MemoryStorage;