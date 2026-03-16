# Memory Skill - 多Agent实时记忆系统

![ClawHub](https://img.shields.io/badge/ClawHub-ready-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)

一个强大的实时记忆系统，支持多Agent协作，将记忆保存到对象存储（S3兼容）。

## 🎯 功能概述

### **核心功能**
- **实时记忆存储** - 实时保存和检索记忆
- **多Agent支持** - 支持多个Agent共享和访问记忆
- **对象存储集成** - 支持S3兼容的对象存储
- **记忆分类** - 按类型、标签、时间分类记忆
- **记忆检索** - 智能搜索和检索相关记忆

### **高级功能**
- **记忆关联** - 自动关联相关记忆
- **记忆过期** - 支持TTL（生存时间）
- **记忆版本控制** - 跟踪记忆变化历史
- **记忆加密** - 可选的内存加密
- **记忆备份** - 自动备份到多个存储

## 🚀 快速开始

### 安装
```bash
# 使用clawhub安装
clawhub install opencc2026/memory-skill

# 或从源码安装
git clone https://github.com/opencc2026/memory-skill.git
cd memory-skill
npm install
```

### 基本使用
```javascript
const MemorySkill = require('memory-skill');

// 初始化记忆系统
const memory = new MemorySkill({
  storage: {
    type: 's3',
    endpoint: 'https://s3.example.com',
    accessKey: 'your-access-key',
    secretKey: 'your-secret-key',
    bucket: 'memory-bucket'
  }
});

// 保存记忆
await memory.save({
  agentId: 'agent-1',
  content: '用户喜欢喝咖啡',
  tags: ['preference', 'coffee'],
  type: 'preference'
});

// 检索记忆
const memories = await memory.search({
  agentId: 'agent-1',
  query: '咖啡',
  limit: 10
});
```

## 📁 项目结构
```
memory-skill/
├── README.md
├── SKILL.md
├── package.json
├── src/
│   ├── index.js              # 主入口
│   ├── memory-core.js        # 核心记忆逻辑
│   ├── storage/
│   │   ├── s3-storage.js     # S3存储
│   │   ├── local-storage.js  # 本地存储
│   │   └── memory-storage.js # 内存存储
│   ├── agents/
│   │   ├── agent-manager.js  # Agent管理
│   │   └── collaboration.js  # 协作逻辑
│   └── utils/
│       ├── encryption.js     # 加密工具
│       ├── search.js         # 搜索工具
│       └── validation.js     # 验证工具
├── examples/
│   ├── basic-usage.js        # 基础使用示例
│   ├── multi-agent.js        # 多Agent示例
│   └── s3-integration.js     # S3集成示例
└── tests/
    ├── memory-core.test.js
    ├── storage.test.js
    └── agents.test.js
```

## 🔧 配置选项

### 存储配置
```javascript
{
  // 存储类型: s3, local, memory
  storage: {
    type: 's3',
    
    // S3配置
    endpoint: 'https://s3.example.com',
    accessKey: 'your-access-key',
    secretKey: 'your-secret-key',
    bucket: 'memory-bucket',
    region: 'us-east-1',
    
    // 本地存储配置
    path: './memory-data',
    
    // 内存存储配置
    maxSize: 10000
  },
  
  // 记忆配置
  memory: {
    ttl: 86400000, // 24小时
    encryption: false,
    compression: true,
    maxEntries: 1000
  },
  
  // Agent配置
  agents: {
    maxAgents: 100,
    collaboration: true,
    sharedMemory: true
  }
}
```

## 🤝 多Agent协作

### Agent间记忆共享
```javascript
// Agent A保存记忆
await memory.save({
  agentId: 'agent-a',
  content: '项目进度: 完成80%',
  shared: true  // 标记为共享记忆
});

// Agent B检索共享记忆
const sharedMemories = await memory.getSharedMemories({
  agentId: 'agent-b'
});
```

### 记忆协作
```javascript
// 协作记忆更新
await memory.collaborate({
  agents: ['agent-a', 'agent-b', 'agent-c'],
  content: '团队决策: 使用React框架',
  type: 'decision'
});
```

## 🔌 对象存储集成

### 支持的对象存储
- **AWS S3** - Amazon S3
- **MinIO** - 自托管的S3兼容存储
- **Google Cloud Storage** - GCS
- **阿里云OSS** - 阿里云对象存储
- **腾讯云COS** - 腾讯云对象存储

### 存储结构
```
memory-bucket/
├── agents/
│   ├── agent-1/
│   │   ├── memories/
│   │   │   ├── memory-001.json
│   │   │   └── memory-002.json
│   │   └── metadata.json
│   └── agent-2/
│       └── ...
├── shared/
│   ├── collaboration-001.json
│   └── ...
└── system/
    ├── indexes.json
    └── stats.json
```

## 📊 性能特性

### 存储性能
- **实时写入** - < 100ms 写入延迟
- **批量操作** - 支持批量读写
- **缓存层** - 内存缓存加速访问
- **压缩存储** - 减少存储空间

### 搜索性能
- **全文搜索** - 支持关键词搜索
- **语义搜索** - 基于向量相似度
- **过滤搜索** - 按标签、类型、时间过滤
- **关联搜索** - 查找相关记忆

## 🔒 安全特性

### 数据安全
- **可选加密** - AES-256加密存储
- **访问控制** - 基于Agent的权限控制
- **数据隔离** - Agent间数据隔离
- **审计日志** - 完整的操作日志

### 隐私保护
- **敏感数据过滤** - 自动过滤敏感信息
- **数据脱敏** - 可选的数据脱敏
- **合规性** - 支持GDPR等合规要求

## 🚀 部署指南

### 本地部署
```bash
# 1. 克隆仓库
git clone https://github.com/opencc2026/memory-skill.git

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑.env文件配置存储

# 4. 启动服务
npm start
```

### Docker部署
```bash
# 使用Docker运行
docker run -d \
  -e STORAGE_TYPE=s3 \
  -e S3_ENDPOINT=https://s3.example.com \
  -e S3_ACCESS_KEY=your-key \
  -e S3_SECRET_KEY=your-secret \
  -p 3000:3000 \
  opencc2026/memory-skill
```

### Kubernetes部署
```yaml
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
        env:
        - name: STORAGE_TYPE
          value: "s3"
```

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 创建Pull Request

## 📄 许可证

MIT License - 详见LICENSE文件

## 🆘 支持

- 问题报告: [GitHub Issues](https://github.com/opencc2026/memory-skill/issues)
- 讨论: [GitHub Discussions](https://github.com/opencc2026/memory-skill/discussions)
- 文档: [项目Wiki](https://github.com/opencc2026/memory-skill/wiki)

---

**呷呷！让多Agent协作记忆变得简单高效！** 🧠🚀