/**
 * Memory Skill - 多Agent实时记忆系统
 * 支持对象存储（S3兼容）和多Agent协作
 */

const MemoryCore = require('./memory-core');
const S3Storage = require('./storage/s3-storage');
const LocalStorage = require('./storage/local-storage');
const MemoryStorage = require('./storage/memory-storage');
const AgentManager = require('./agents/agent-manager');
const CollaborationEngine = require('./agents/collaboration');
const { validateConfig, validateMemoryData } = require('./utils/validation');
const { encrypt, decrypt } = require('./utils/encryption');
const SearchEngine = require('./utils/search');

class MemorySkill {
  /**
   * 创建MemorySkill实例
   * @param {Object} config - 配置对象
   */
  constructor(config = {}) {
    // 验证配置
    this.config = validateConfig(config);
    
    // 初始化组件
    this._initializeStorage();
    this._initializeMemoryCore();
    this._initializeAgents();
    this._initializeSearch();
    
    // 状态跟踪
    this.isInitialized = false;
    this.stats = {
      memoriesStored: 0,
      agentsRegistered: 0,
      searchesPerformed: 0,
      collaborations: 0
    };
    
    // 事件发射器
    this.events = new (require('eventemitter3'))();
    
    console.log('🧠 Memory Skill initialized with config:', {
      storageType: this.config.storage.type,
      agentsEnabled: this.config.agents.collaboration,
      encryption: this.config.memory.encryption.enabled
    });
  }
  
  /**
   * 初始化存储后端
   * @private
   */
  _initializeStorage() {
    const { storage } = this.config;
    
    switch (storage.type) {
      case 's3':
        this.storage = new S3Storage(storage);
        break;
      case 'local':
        this.storage = new LocalStorage(storage);
        break;
      case 'memory':
        this.storage = new MemoryStorage(storage);
        break;
      default:
        throw new Error(`Unsupported storage type: ${storage.type}`);
    }
    
    console.log(`📦 Storage initialized: ${storage.type}`);
  }
  
  /**
   * 初始化记忆核心
   * @private
   */
  _initializeMemoryCore() {
    this.memoryCore = new MemoryCore({
      storage: this.storage,
      config: this.config.memory
    });
    
    // 监听记忆事件
    this.memoryCore.on('memory:saved', (memory) => {
      this.stats.memoriesStored++;
      this.events.emit('memory:saved', memory);
    });
    
    this.memoryCore.on('memory:retrieved', (memory) => {
      this.events.emit('memory:retrieved', memory);
    });
  }
  
  /**
   * 初始化Agent管理
   * @private
   */
  _initializeAgents() {
    this.agentManager = new AgentManager({
      maxAgents: this.config.agents.maxAgents,
      defaultPermissions: this.config.agents.defaultPermissions
    });
    
    this.collaborationEngine = new CollaborationEngine({
      enabled: this.config.agents.collaboration.enabled,
      requireApproval: this.config.agents.collaboration.requireApproval,
      maxCollaborators: this.config.agents.collaboration.maxCollaborators
    });
    
    // 监听Agent事件
    this.agentManager.on('agent:registered', (agent) => {
      this.stats.agentsRegistered++;
      this.events.emit('agent:registered', agent);
    });
  }
  
  /**
   * 初始化搜索引擎
   * @private
   */
  _initializeSearch() {
    this.searchEngine = new SearchEngine({
      indexing: this.config.memory.indexing
    });
  }
  
  /**
   * 异步初始化
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }
    
    try {
      // 初始化存储
      await this.storage.initialize();
      
      // 加载现有数据
      await this._loadExistingData();
      
      this.isInitialized = true;
      console.log('✅ Memory Skill fully initialized');
      this.events.emit('initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Memory Skill:', error);
      throw error;
    }
  }
  
  /**
   * 加载现有数据
   * @private
   */
  async _loadExistingData() {
    // 这里可以加载缓存、索引等
    console.log('📂 Loading existing data...');
  }
  
  // ==================== 记忆操作 API ====================
  
  /**
   * 保存记忆
   * @param {Object} memoryData - 记忆数据
   * @returns {Promise<Object>} 保存的记忆
   */
  async save(memoryData) {
    await this.initialize();
    
    // 验证记忆数据
    const validatedData = validateMemoryData(memoryData);
    
    // 处理加密
    if (this.config.memory.encryption.enabled) {
      validatedData.content = encrypt(
        validatedData.content,
        this.config.memory.encryption.key
      );
      validatedData.encrypted = true;
    }
    
    // 处理压缩
    if (this.config.memory.compression) {
      // 这里可以添加压缩逻辑
      validatedData.compressed = true;
    }
    
    // 保存记忆
    const savedMemory = await this.memoryCore.save(validatedData);
    
    // 更新搜索索引
    if (this.config.memory.indexing.enabled) {
      await this.searchEngine.indexMemory(savedMemory);
    }
    
    return savedMemory;
  }
  
  /**
   * 批量保存记忆
   * @param {Array} memories - 记忆数组
   * @returns {Promise<Array>} 保存的记忆数组
   */
  async batchSave(memories) {
    await this.initialize();
    
    const results = [];
    for (const memory of memories) {
      try {
        const saved = await this.save(memory);
        results.push(saved);
      } catch (error) {
        console.error(`Failed to save memory: ${error.message}`);
        results.push({ error: error.message, memory });
      }
    }
    
    return results;
  }
  
  /**
   * 获取记忆
   * @param {string} memoryId - 记忆ID
   * @returns {Promise<Object>} 记忆数据
   */
  async get(memoryId) {
    await this.initialize();
    
    const memory = await this.memoryCore.get(memoryId);
    
    if (!memory) {
      throw new Error(`Memory not found: ${memoryId}`);
    }
    
    // 处理解密
    if (memory.encrypted && this.config.memory.encryption.enabled) {
      memory.content = decrypt(
        memory.content,
        this.config.memory.encryption.key
      );
      memory.encrypted = false;
    }
    
    return memory;
  }
  
  /**
   * 搜索记忆
   * @param {Object} options - 搜索选项
   * @returns {Promise<Array>} 搜索结果
   */
  async search(options) {
    await this.initialize();
    
    this.stats.searchesPerformed++;
    
    const {
      agentId,
      query,
      filters = {},
      limit = 10,
      offset = 0
    } = options;
    
    // 构建搜索条件
    const searchConditions = {
      agentId,
      ...filters
    };
    
    // 如果有查询词，使用搜索引擎
    if (query && this.config.memory.indexing.enabled) {
      const searchResults = await this.searchEngine.search(query, searchConditions);
      return searchResults.slice(offset, offset + limit);
    }
    
    // 否则使用基础过滤
    const memories = await this.memoryCore.search(searchConditions);
    return memories.slice(offset, offset + limit);
  }
  
  /**
   * 更新记忆
   * @param {string} memoryId - 记忆ID
   * @param {Object} updates - 更新内容
   * @returns {Promise<Object>} 更新后的记忆
   */
  async update(memoryId, updates) {
    await this.initialize();
    
    const existingMemory = await this.get(memoryId);
    
    // 创建新版本
    const updatedMemory = {
      ...existingMemory,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: existingMemory.version + 1
    };
    
    // 保存更新
    return await this.save(updatedMemory);
  }
  
  /**
   * 删除记忆
   * @param {string} memoryId - 记忆ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(memoryId) {
    await this.initialize();
    
    const deleted = await this.memoryCore.delete(memoryId);
    
    if (deleted && this.config.memory.indexing.enabled) {
      await this.searchEngine.removeFromIndex(memoryId);
    }
    
    return deleted;
  }
  
  /**
   * 归档记忆
   * @param {string} memoryId - 记忆ID
   * @returns {Promise<Object>} 归档后的记忆
   */
  async archive(memoryId) {
    return await this.update(memoryId, {
      archived: true,
      archivedAt: new Date().toISOString()
    });
  }
  
  // ==================== Agent操作 API ====================
  
  /**
   * 注册Agent
   * @param {Object} agentInfo - Agent信息
   * @returns {Promise<Object>} 注册的Agent
   */
  async registerAgent(agentInfo) {
    await this.initialize();
    
    const agent = await this.agentManager.register(agentInfo);
    
    // 为Agent创建存储空间
    await this.storage.createAgentSpace(agent.id);
    
    return agent;
  }
  
  /**
   * 获取Agent信息
   * @param {string} agentId - Agent ID
   * @returns {Promise<Object>} Agent信息
   */
  async getAgentInfo(agentId) {
    await this.initialize();
    
    return await this.agentManager.get(agentId);
  }
  
  /**
   * 更新Agent
   * @param {string} agentId - Agent ID
   * @param {Object} updates - 更新内容
   * @returns {Promise<Object>} 更新后的Agent
   */
  async updateAgent(agentId, updates) {
    await this.initialize();
    
    return await this.agentManager.update(agentId, updates);
  }
  
  /**
   * 列出所有Agent
   * @returns {Promise<Array>} Agent列表
   */
  async listAgents() {
    await this.initialize();
    
    return await this.agentManager.list();
  }
  
  /**
   * 移除Agent
   * @param {string} agentId - Agent ID
   * @returns {Promise<boolean>} 是否移除成功
   */
  async removeAgent(agentId) {
    await this.initialize();
    
    // 清理Agent的记忆
    await this.memoryCore.deleteByAgent(agentId);
    
    // 移除Agent
    return await this.agentManager.remove(agentId);
  }
  
  // ==================== 协作操作 API ====================
  
  /**
   * 共享记忆
   * @param {Object} options - 共享选项
   * @returns {Promise<Object>} 共享结果
   */
  async shareMemory(options) {
    await this.initialize();
    
    const {
      memoryId,
      fromAgent,
      toAgents,
      permissions = ['read']
    } = options;
    
    // 验证记忆存在
    const memory = await this.get(memoryId);
    
    // 验证发送者权限
    if (memory.agentId !== fromAgent) {
      throw new Error(`Agent ${fromAgent} does not own memory ${memoryId}`);
    }
    
    // 执行共享
    const shareResult = await this.collaborationEngine.share({
      memoryId,
      fromAgent,
      toAgents,
      permissions
    });
    
    this.stats.collaborations++;
    this.events.emit('memory:shared', shareResult);
    
    return shareResult;
  }
  
  /**
   * 协作编辑
   * @param {Object} options - 协作选项
   * @returns {Promise<Object>} 协作结果
   */
  async collaborate(options) {
    await this.initialize();
    
    const collaboration = await this.collaborationEngine.collaborate(options);
    
    this.stats.collaborations++;
    this.events.emit('collaboration:created', collaboration);
    
    return collaboration;
  }
  
  /**
   * 获取共享记忆
   * @param {string} agentId - Agent ID
   * @returns {Promise<Array>} 共享记忆列表
   */
  async getSharedMemories(agentId) {
    await this.initialize();
    
    return await this.collaborationEngine.getSharedMemories(agentId);
  }
  
  /**
   * 获取协作历史
   * @param {string} memoryId - 记忆ID
   * @returns {Promise<Array>} 协作历史
   */
  async getCollaborationHistory(memoryId) {
    await this.initialize();
    
    return await this.collaborationEngine.getHistory(memoryId);
  }
  
  // ==================== 系统操作 API ====================
  
  /**
   * 创建备份
   * @returns {Promise<Object>} 备份信息
   */
  async backup() {
    await this.initialize();
    
    const backupId = `backup-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    // 备份数据
    const backupData = {
      id: backupId,
      timestamp,
      agents: await this.listAgents(),
      memories: await this.memoryCore.getAll(),
      stats: this.stats
    };
    
    // 保存备份
    await this.storage.saveBackup(backupId, backupData);
    
    console.log(`💾 Backup created: ${backupId}`);
    this.events.emit('backup:created', backupData);
    
    return backupData;
  }
  
  /**
   * 恢复备份
   * @param {string} backupId - 备份ID
   * @returns {Promise<boolean>} 是否恢复成功
   */
  async restore(backupId) {
    await this.initialize();
    
    const backupData = await this.storage.getBackup(backupId);
    
    if (!backupData) {
      throw new Error(`Backup not found: ${backupId}`);
    }
    
    // 恢复数据
    // 注意：这里需要根据实际需求实现恢复逻辑
    console.log(`🔄 Restoring from backup: ${backupId}`);
    
    this.events.emit('backup:restored', backupData);
    
    return true;
  }
  
  /**
   * 获取系统统计
   * @returns {Promise<Object>} 系统统计
   */
  async getStats() {
    await this.initialize();
    
    const memoryStats = await this.memoryCore.getStats();
    const storageStats = await this.storage.getStats();
    
    return {
      ...this.stats,
      memory: memoryStats,
      storage: storageStats,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * 清理过期记忆
   * @returns {Promise<number>} 清理的记忆数量
   */
  async cleanup() {
    await this.initialize();
    
    const ttl = this.config.memory.ttl;
    if (!ttl) {
      return 0;
    }
    
    const cutoffTime = Date.now() - ttl;
    const expiredMemories = await this.memoryCore.findExpired(cutoffTime);
    
    let cleanedCount = 0;
    for (const memory of expiredMemories) {
      await this.delete(memory.id);
      cleanedCount++;
    }
    
    console.log(`🧹 Cleaned ${cleanedCount} expired memories`);
    this.events.emit('cleanup:completed', { cleanedCount });
    
    return cleanedCount;
  }
  
  /**
   * 关闭系统
   * @returns {Promise<void>}
   */
  async close() {
    // 保存状态
    await this.backup();
    
    // 关闭组件
    await this.storage.close();
    
    this.isInitialized = false;
    console.log('👋 Memory Skill closed');
    this.events.emit('closed');
  }
  
  // ==================== 事件监听 ====================
  
  /**
   * 监听事件
   * @param {string} event - 事件名称
   * @param {Function} listener - 监听函数
   */
  on(event, listener) {
    this.events.on(event, listener);
  }
  
  /**
   * 移除事件监听
   * @param {string} event - 事件名称
   * @param {Function} listener - 监听函数
   */
  off(event, listener) {
    this.events.off(event, listener);
  }
}

module.exports = MemorySkill;