/**
 * Agent管理器
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class AgentManager extends EventEmitter {
  constructor(config) {
    super();
    this.config = {
      maxAgents: config.maxAgents || 100,
      defaultPermissions: config.defaultPermissions || ['read', 'write'],
      ...config
    };
    
    this.agents = new Map(); // agentId -> agentInfo
    this.agentSessions = new Map(); // sessionId -> agentId
  }
  
  /**
   * 注册新Agent
   */
  async register(agentInfo) {
    const agentId = agentInfo.id || `agent-${uuidv4()}`;
    
    const agent = {
      id: agentId,
      name: agentInfo.name || `Agent ${agentId}`,
      capabilities: agentInfo.capabilities || [],
      permissions: agentInfo.permissions || this.config.defaultPermissions,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      metadata: agentInfo.metadata || {},
      status: 'active'
    };
    
    // 检查是否达到最大Agent数
    if (this.agents.size >= this.config.maxAgents) {
      throw new Error(`达到最大Agent数量限制: ${this.config.maxAgents}`);
    }
    
    this.agents.set(agentId, agent);
    
    this.emit('agent:registered', agent);
    console.log(`👤 Agent已注册: ${agentId} (${agent.name})`);
    
    return agent;
  }
  
  /**
   * 获取Agent信息
   */
  async get(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent未找到: ${agentId}`);
    }
    return agent;
  }
  
  /**
   * 更新Agent
   */
  async update(agentId, updates) {
    const agent = await this.get(agentId);
    
    const updatedAgent = {
      ...agent,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.agents.set(agentId, updatedAgent);
    
    this.emit('agent:updated', updatedAgent);
    console.log(`🔄 Agent已更新: ${agentId}`);
    
    return updatedAgent;
  }
  
  /**
   * 列出所有Agent
   */
  async list() {
    return Array.from(this.agents.values());
  }
  
  /**
   * 移除Agent
   */
  async remove(agentId) {
    const existed = this.agents.delete(agentId);
    
    if (existed) {
      this.emit('agent:removed', agentId);
      console.log(`🗑️  Agent已移除: ${agentId}`);
    }
    
    return existed;
  }
  
  /**
   * 创建Agent会话
   */
  async createSession(agentId) {
    const agent = await this.get(agentId);
    
    const sessionId = `session-${uuidv4()}`;
    this.agentSessions.set(sessionId, agentId);
    
    // 更新Agent活跃时间
    await this.update(agentId, {
      lastActive: new Date().toISOString()
    });
    
    this.emit('session:created', { sessionId, agentId });
    
    return sessionId;
  }
  
  /**
   * 验证会话
   */
  async validateSession(sessionId) {
    const agentId = this.agentSessions.get(sessionId);
    if (!agentId) return null;
    
    const agent = await this.get(agentId);
    return agent;
  }
  
  /**
   * 结束会话
   */
  async endSession(sessionId) {
    const existed = this.agentSessions.delete(sessionId);
    
    if (existed) {
      this.emit('session:ended', sessionId);
    }
    
    return existed;
  }
  
  /**
   * 检查Agent权限
   */
  async checkPermission(agentId, permission) {
    const agent = await this.get(agentId);
    return agent.permissions.includes(permission);
  }
  
  /**
   * 获取Agent统计
   */
  async getStats() {
    const agents = await this.list();
    
    const stats = {
      total: agents.length,
      active: agents.filter(a => a.status === 'active').length,
      inactive: agents.filter(a => a.status === 'inactive').length,
      byCapability: {},
      sessions: this.agentSessions.size
    };
    
    // 按能力统计
    agents.forEach(agent => {
      agent.capabilities.forEach(cap => {
        stats.byCapability[cap] = (stats.byCapability[cap] || 0) + 1;
      });
    });
    
    return stats;
  }
}

module.exports = AgentManager;