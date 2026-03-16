/**
 * 本地文件系统存储实现
 */

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

class LocalStorage {
  constructor(config) {
    this.config = {
      type: 'local',
      path: config.path || './memory-data',
      compression: config.compression !== false,
      encryption: config.encryption || false,
      maxFileSize: config.maxFileSize || 10 * 1024 * 1024,
      ...config
    };
    
    this.basePath = path.resolve(this.config.path);
    this.isInitialized = false;
  }
  
  async initialize() {
    if (this.isInitialized) return;
    
    await fs.ensureDir(this.basePath);
    await this._createDirectoryStructure();
    
    this.isInitialized = true;
    console.log(`✅ 本地存储已初始化: ${this.basePath}`);
  }
  
  async _createDirectoryStructure() {
    const dirs = ['agents', 'memories', 'shared', 'backups', 'system'];
    for (const dir of dirs) {
      await fs.ensureDir(path.join(this.basePath, dir));
    }
  }
  
  async save(key, data) {
    await this.initialize();
    
    const filePath = path.join(this.basePath, key);
    await fs.ensureDir(path.dirname(filePath));
    
    const content = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
    await fs.writeFile(filePath, content);
    
    return key;
  }
  
  async get(key) {
    await this.initialize();
    
    const filePath = path.join(this.basePath, key);
    if (!await fs.pathExists(filePath)) return null;
    
    const content = await fs.readFile(filePath, 'utf8');
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  }
  
  async delete(key) {
    await this.initialize();
    
    const filePath = path.join(this.basePath, key);
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      return true;
    }
    return false;
  }
  
  async createAgentSpace(agentId) {
    const agentPath = path.join(this.basePath, 'agents', agentId);
    await fs.ensureDir(agentPath);
    await fs.ensureDir(path.join(agentPath, 'memories'));
    await fs.ensureDir(path.join(agentPath, 'shared'));
    return `agents/${agentId}/`;
  }
  
  async close() {
    console.log('👋 本地存储已关闭');
  }
}

module.exports = LocalStorage;