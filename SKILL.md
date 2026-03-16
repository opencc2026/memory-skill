name: memory-skill
description: 多Agent实时记忆系统，支持对象存储
version: 0.1.0
author: opencc2026
license: MIT
keywords:
  - memory
  - storage
  - s3
  - multi-agent
  - real-time
categories:
  - storage
  - memory
  - collaboration
  - infrastructure

# Memory Skill - 多Agent实时记忆系统

## 概述

一个强大的实时记忆系统，支持多Agent协作，将记忆保存到对象存储（S3兼容）。提供完整的记忆管理、存储、检索和协作功能。

## 功能特性

### 核心功能
- **实时记忆存储** - 毫秒级记忆保存和检索
- **多Agent支持** - 支持无限多个Agent共享记忆
- **对象存储集成** - 原生支持S3兼容存储
- **智能搜索** - 全文搜索和语义搜索
- **记忆分类** - 按标签、类型、时间组织记忆

### 高级功能
- **记忆关联** - 自动发现和关联相关记忆
- **版本控制** - 完整的记忆变更历史
- **数据加密** - 可选的AES-256加密
- **自动备份** - 多存储备份策略
- **性能优化** - 内存缓存和批量操作

## 安装

### 通过ClawHub安装
```bash
clawhub install opencc2026/memory-skill
```

### 通过npm安装
```bash
npm install @opencc2026/memory-skill
```

### 从源码安装
```bash
git clone https://github.com/opencc2026/memory-skill.git
cd memory-skill
npm install
```

## 快速开始

### 基本配置
```javascript
const MemorySkill = require('memory-skill');

// 初始化记忆系统
const memory = new MemorySkill({
  // 存储配置
  storage: {
    type: 's3', // s3, local, memory
    endpoint: 'https://s3.example.com',
    accessKey: 'your-access-key',
    secretKey: 'your-secret-key',
    bucket: 'memory-bucket'
  },
  
  // 记忆配置
  memory: {
    ttl: 86400000, // 记忆生存时间（毫秒）
    encryption: true, // 启用加密
    compression: true // 启用压缩
  },
  
  // Agent配置
  agents: {
    maxAgents: 100, // 最大Agent数量
    collaboration: true, // 启用协作
    sharedMemory: true // 启用共享记忆
  }
});
```

### 保存记忆
```javascript
// 保存个人记忆
await memory.save({
  agentId: 'agent-1',
  content: '用户偏好设置：暗色主题，中文界面',
  tags: ['preference', 'ui', 'language'],
  type: 'user-preference',
  metadata: {
    importance: 'high',
    source: 'user-input'
  }
});

// 保存共享记忆
await memory.save({
  agentId: 'agent-1',
  content: '项目会议记录：决定使用React框架',
  tags: ['meeting', 'decision', 'project'],
  type: 'collaboration',
  shared: true, // 标记为共享
  collaborators: ['agent-2', 'agent-3']
});
```

### 检索记忆
```javascript
// 关键词搜索
const results = await memory.search({
  agentId: 'agent-1',
  query: 'React框架',
  limit: 10,
  filters: {
    type: 'collaboration',
    tags: ['decision']
  }
});

// 获取相关记忆
const related = await memory.getRelatedMemories({
  memoryId: 'memory-123',
  depth: 2 // 关联深度
});

// 时间范围查询
const timeline = await memory.getTimeline({
  agentId: 'agent-1',
  startTime: '2026-03-01',
  endTime: '2026-03-17'
});
```

## 多Agent协作

### Agent注册和管理
```javascript
// 注册新Agent
await memory.registerAgent({
  agentId: 'agent-1',
  name: '客服助手',
  capabilities: ['customer-service', 'chinese'],
  permissions: ['read', 'write', 'share']
});

// 获取Agent信息
const agentInfo = await memory.getAgentInfo('agent-1');

// 列出所有Agent
const allAgents = await memory.listAgents();
```

### 记忆共享和协作
```javascript
// 共享记忆给其他Agent
await memory.shareMemory({
  memoryId: 'memory-123',
  fromAgent: 'agent-1',
  toAgents: ['agent-2', 'agent-3'],
  permissions: ['read', 'comment']
});

// 协作编辑记忆
await memory.collaborate({
  memoryId: 'memory-123',
  agentId: 'agent-2',
  action: 'update',
  content: '补充信息：React版本要求18.0+',
  comment: '根据最新技术栈要求更新'
});

// 获取协作历史
const collaborationHistory = await memory.getCollaborationHistory('memory-123');
```

## 对象存储集成

### 支持的存储后端
- **AWS S3** - Amazon Simple Storage Service
- **MinIO** - 高性能自托管S3兼容存储
- **Google Cloud Storage** - Google云存储
- **阿里云OSS** - 阿里云对象存储
- **腾讯云COS** - 腾讯云对象存储
- **本地存储** - 文件系统存储
- **内存存储** - 临时内存存储（开发用）

### 存储配置示例
```javascript
// AWS S3配置
const s3Config = {
  type: 's3',
  endpoint: 'https://s3.amazonaws.com',
  accessKey: 'AKIAIOSFODNN7EXAMPLE',
  secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  bucket: 'my-memory-bucket',
  region: 'us-east-1'
};

// MinIO配置
const minioConfig = {
  type: 's3',
  endpoint: 'https://minio.example.com',
  accessKey: 'minioadmin',
  secretKey: 'minioadmin',
  bucket: 'memory-data',
  region: 'us-east-1',
  pathStyle: true // MinIO需要路径样式
};

// 本地存储配置
const localConfig = {
  type: 'local',
  path: './memory-storage',
  compression: true,
  encryption: {
    enabled: true,
    algorithm: 'aes-256-gcm',
    key: 'your-encryption-key'
  }
};
```

## API参考

### MemorySkill类

#### 构造函数
```javascript
new MemorySkill(config)
```

#### 方法

##### 记忆操作
- `save(memoryData)` - 保存记忆
- `get(memoryId)` - 获取单个记忆
- `search(options)` - 搜索记忆
- `update(memoryId, updates)` - 更新记忆
- `delete(memoryId)` - 删除记忆
- `archive(memoryId)` - 归档记忆

##### Agent操作
- `registerAgent(agentInfo)` - 注册Agent
- `getAgentInfo(agentId)` - 获取Agent信息
- `updateAgent(agentId, updates)` - 更新Agent
- `listAgents()` - 列出所有Agent
- `removeAgent(agentId)` - 移除Agent

##### 协作操作
- `shareMemory(options)` - 共享记忆
- `collaborate(options)` - 协作编辑
- `getSharedMemories(agentId)` - 获取共享记忆
- `getCollaborationHistory(memoryId)` - 获取协作历史

##### 系统操作
- `backup()` - 创建备份
- `restore(backupId)` - 恢复备份
- `getStats()` - 获取系统统计
- `cleanup()` - 清理过期记忆

## 配置选项

### 完整配置示例
```javascript
{
  // 存储配置
  storage: {
    type: 's3', // s3, local, memory
    endpoint: 'https://s3.example.com',
    accessKey: 'your-access-key',
    secretKey: 'your-secret-key',
    bucket: 'memory-bucket',
    region: 'us-east-1',
    pathStyle: false,
    sslEnabled: true,
    
    // 本地存储特定配置
    path: './memory-data',
    maxFileSize: 10485760, // 10MB
    
    // 内存存储特定配置
    maxSize: 10000
  },
  
  // 记忆配置
  memory: {
    ttl: 86400000, // 24小时
    maxEntries: 1000, // 每个Agent最大记忆数
    encryption: {
      enabled: false,
      algorithm: 'aes-256-gcm',
      key: 'optional-encryption-key'
    },
    compression: true,
    indexing: {
      enabled: true,
      fields: ['content', 'tags', 'type']
    }
  },
  
  // Agent配置
  agents: {
    maxAgents: 100,
    defaultPermissions: ['read', 'write'],
    collaboration: {
      enabled: true,
      requireApproval: false,
      maxCollaborators: 10
    },
    sharedMemory: {
      enabled: true,
      visibility: 'restricted' // public, restricted, private
    }
  },
  
  // 性能配置
  performance: {
    cache: {
      enabled: true,
      ttl: 300000, // 5分钟
      maxSize: 1000
    },
    batch: {
      enabled: true,
      size: 100,
      interval: 1000 // 1秒
    }
  },
  
  // 监控配置
  monitoring: {
    enabled: true,
    metrics: ['requests', 'storage', 'performance'],
    logging: {
      level: 'info', // error, warn, info, debug
      format: 'json'
    }
  }
}
```

## 部署指南

### 环境变量
```bash
# 存储配置
STORAGE_TYPE=s3
S3_ENDPOINT=https://s3.example.com
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=memory-bucket
S3_REGION=us-east-1

# 记忆配置
MEMORY_TTL=86400000
MEMORY_ENCRYPTION=false
MEMORY_COMPRESSION=true

# Agent配置
AGENTS_MAX_AGENTS=100
AGENTS_COLLABORATION=true

# 性能配置
CACHE_ENABLED=true
CACHE_TTL=300000

# 监控配置
LOGGING_LEVEL=info
METRICS_ENABLED=true
```

### Docker部署
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "src/index.js"]
```

### Kubernetes部署
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: memory-skill-config
data:
  STORAGE_TYPE: "s3"
  S3_BUCKET: "memory-bucket"
  MEMORY_TTL: "86400000"
  AGENTS_MAX_AGENTS: "100"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: memory-skill
spec:
  replicas: 3
  selector:
    matchLabels:
      app: memory-skill
  template:
    metadata:
      labels:
        app: memory-skill
    spec:
      containers:
      - name: memory-skill
        image: opencc2026/memory-skill:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: memory-skill-config
        env:
        - name: S3_ACCESS_KEY
          valueFrom:
            secretKeyRef:
              name: s3-credentials
              key: access-key
        - name: S3_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: s3-credentials
              key: secret-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

## 故障排除

### 常见问题

#### 存储连接失败
```bash
# 检查网络连接
curl https://s3.example.com

# 检查凭证
echo $S3_ACCESS_KEY
echo $S3_SECRET_KEY

# 检查存储桶权限
aws s3 ls s3://memory-bucket
```

#### 性能问题
```javascript
// 启用缓存
const memory = new MemorySkill({
  performance: {
    cache: {
      enabled: true,
      ttl: 300000
    }
  }
});

// 使用批量操作
await memory.batchSave(memoriesArray);
```

#### 内存泄漏
```bash
# 监控内存使用
node --inspect src/index.js

# 使用内存分析工具
npm install -g clinic
clinic doctor -- node src/index.js
```

## 支持与贡献

### 获取帮助
- GitHub Issues: https://github.com/opencc2026/memory-skill/issues
- 文档: https://github.com/opencc2026/memory-skill/wiki
- 示例: /examples 目录

### 贡献指南
1. Fork仓库
2. 创建功能分支
3. 编写测试
4. 提交更改
5. 创建Pull Request

## 许可证

MIT License

Copyright (c) 2026 opencc2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.