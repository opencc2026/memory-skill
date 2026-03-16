/**
 * S3兼容对象存储实现
 * 支持AWS S3、MinIO、阿里云OSS、腾讯云COS等
 */

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const fs = require('fs-extra');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

class S3Storage {
  /**
   * 创建S3存储实例
   * @param {Object} config - S3配置
   */
  constructor(config) {
    this.config = {
      type: 's3',
      endpoint: config.endpoint || 'https://s3.amazonaws.com',
      accessKey: config.accessKey || process.env.S3_ACCESS_KEY,
      secretKey: config.secretKey || process.env.S3_SECRET_KEY,
      bucket: config.bucket || process.env.S3_BUCKET || 'memory-storage',
      region: config.region || process.env.S3_REGION || 'us-east-1',
      pathStyle: config.pathStyle || false,
      sslEnabled: config.sslEnabled !== false,
      compression: config.compression !== false,
      encryption: config.encryption || false,
      maxFileSize: config.maxFileSize || 10 * 1024 * 1024, // 10MB
      ...config
    };
    
    // 验证配置
    this._validateConfig();
    
    // 初始化S3客户端
    this._initializeS3Client();
    
    this.isInitialized = false;
    this.stats = {
      objectsStored: 0,
      objectsRetrieved: 0,
      objectsDeleted: 0,
      totalSize: 0
    };
  }
  
  /**
   * 验证配置
   * @private
   */
  _validateConfig() {
    const required = ['accessKey', 'secretKey', 'bucket'];
    for (const field of required) {
      if (!this.config[field]) {
        throw new Error(`S3配置缺少必要字段: ${field}`);
      }
    }
  }
  
  /**
   * 初始化S3客户端
   * @private
   */
  _initializeS3Client() {
    const s3Config = {
      region: this.config.region,
      endpoint: this.config.endpoint,
      forcePathStyle: this.config.pathStyle,
      sslEnabled: this.config.sslEnabled,
      credentials: {
        accessKeyId: this.config.accessKey,
        secretAccessKey: this.config.secretKey
      }
    };
    
    // 如果是MinIO，需要特殊配置
    if (this.config.endpoint.includes('minio')) {
      s3Config.forcePathStyle = true;
    }
    
    this.s3Client = new S3Client(s3Config);
    console.log(`🔗 S3客户端已连接到: ${this.config.endpoint}`);
  }
  
  /**
   * 初始化存储
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }
    
    try {
      // 检查存储桶是否存在，如果不存在则创建
      await this._ensureBucketExists();
      
      // 创建必要的目录结构
      await this._createDirectoryStructure();
      
      this.isInitialized = true;
      console.log(`✅ S3存储已初始化，存储桶: ${this.config.bucket}`);
    } catch (error) {
      console.error('❌ S3存储初始化失败:', error);
      throw error;
    }
  }
  
  /**
   * 确保存储桶存在
   * @private
   */
  async _ensureBucketExists() {
    try {
      await this.s3Client.send(new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: '.bucket-test'
      }));
    } catch (error) {
      if (error.name === 'NotFound') {
        console.log(`📦 存储桶 ${this.config.bucket} 不存在，尝试创建...`);
        // 注意：实际创建存储桶需要相应权限
        // 这里假设存储桶已存在或由其他方式创建
      }
    }
  }
  
  /**
   * 创建目录结构
   * @private
   */
  async _createDirectoryStructure() {
    const directories = [
      'agents/',
      'memories/',
      'shared/',
      'backups/',
      'system/'
    ];
    
    for (const dir of directories) {
      // 在S3中，目录是通过以斜杠结尾的对象表示的
      try {
        await this.s3Client.send(new PutObjectCommand({
          Bucket: this.config.bucket,
          Key: dir,
          Body: ''
        }));
      } catch (error) {
        // 忽略已存在的目录
        if (error.name !== 'AccessDenied') {
          console.warn(`创建目录 ${dir} 失败:`, error.message);
        }
      }
    }
  }
  
  /**
   * 保存对象
   * @param {string} key - 对象键
   * @param {any} data - 数据
   * @param {Object} options - 选项
   * @returns {Promise<string>} 对象键
   */
  async save(key, data, options = {}) {
    await this.initialize();
    
    const {
      contentType = 'application/json',
      compression = this.config.compression,
      encryption = this.config.encryption,
      metadata = {}
    } = options;
    
    let processedData = data;
    
    // 如果是对象，转换为JSON
    if (typeof data === 'object' && data !== null) {
      processedData = JSON.stringify(data);
    }
    
    // 处理压缩
    if (compression) {
      processedData = await gzip(processedData);
      metadata.compressed = 'gzip';
    }
    
    // 处理加密（这里只是标记，实际加密在应用层处理）
    if (encryption) {
      metadata.encrypted = 'true';
    }
    
    // 检查文件大小
    const dataSize = Buffer.byteLength(processedData);
    if (dataSize > this.config.maxFileSize) {
      throw new Error(`文件大小 ${dataSize} 字节超过限制 ${this.config.maxFileSize} 字节`);
    }
    
    // 上传到S3
    const uploadParams = {
      Bucket: this.config.bucket,
      Key: key,
      Body: processedData,
      ContentType: contentType,
      Metadata: metadata
    };
    
    try {
      const upload = new Upload({
        client: this.s3Client,
        params: uploadParams
      });
      
      await upload.done();
      
      this.stats.objectsStored++;
      this.stats.totalSize += dataSize;
      
      console.log(`📤 对象已保存: ${key} (${dataSize} 字节)`);
      return key;
    } catch (error) {
      console.error(`保存对象失败 ${key}:`, error);
      throw error;
    }
  }
  
  /**
   * 获取对象
   * @param {string} key - 对象键
   * @param {Object} options - 选项
   * @returns {Promise<any>} 数据
   */
  async get(key, options = {}) {
    await this.initialize();
    
    try {
      const response = await this.s3Client.send(new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key
      }));
      
      let data = await response.Body.transformToByteArray();
      data = Buffer.from(data);
      
      // 处理压缩
      if (response.Metadata?.compressed === 'gzip') {
        data = await gunzip(data);
      }
      
      // 解析数据
      let result;
      if (response.ContentType === 'application/json') {
        result = JSON.parse(data.toString());
      } else {
        result = data.toString();
      }
      
      this.stats.objectsRetrieved++;
      
      console.log(`📥 对象已获取: ${key}`);
      return result;
    } catch (error) {
      if (error.name === 'NoSuchKey' || error.name === 'NotFound') {
        return null;
      }
      console.error(`获取对象失败 ${key}:`, error);
      throw error;
    }
  }
  
  /**
   * 删除对象
   * @param {string} key - 对象键
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(key) {
    await this.initialize();
    
    try {
      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key
      }));
      
      this.stats.objectsDeleted++;
      console.log(`🗑️  对象已删除: ${key}`);
      return true;
    } catch (error) {
      console.error(`删除对象失败 ${key}:`, error);
      return false;
    }
  }
  
  /**
   * 列出对象
   * @param {string} prefix - 前缀
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 对象列表
   */
  async list(prefix = '', limit = 1000) {
    await this.initialize();
    
    try {
      const objects = [];
      let continuationToken;
      
      do {
        const params = {
          Bucket: this.config.bucket,
          Prefix: prefix,
          MaxKeys: Math.min(limit, 1000),
          ContinuationToken: continuationToken
        };
        
        const response = await this.s3Client.send(new ListObjectsV2Command(params));
        
        if (response.Contents) {
          objects.push(...response.Contents.map(obj => ({
            key: obj.Key,
            size: obj.Size,
            lastModified: obj.LastModified,
            etag: obj.ETag
          })));
        }
        
        continuationToken = response.NextContinuationToken;
        
      } while (continuationToken && objects.length < limit);
      
      return objects.slice(0, limit);
    } catch (error) {
      console.error(`列出对象失败 ${prefix}:`, error);
      return [];
    }
  }
  
  /**
   * 检查对象是否存在
   * @param {string} key - 对象键
   * @returns {Promise<boolean>} 是否存在
   */
  async exists(key) {
    await this.initialize();
    
    try {
      await this.s3Client.send(new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: key
      }));
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }
  
  /**
   * 为Agent创建存储空间
   * @param {string} agentId - Agent ID
   * @returns {Promise<string>} 空间路径
   */
  async createAgentSpace(agentId) {
    const agentPrefix = `agents/${agentId}/`;
    
    // 创建Agent目录
    await this.save(`${agentPrefix}.placeholder`, '');
    
    // 创建子目录
    const subdirs = ['memories/', 'shared/', 'config/'];
    for (const subdir of subdirs) {
      await this.save(`${agentPrefix}${subdir}.placeholder`, '');
    }
    
    console.log(`👤 为Agent创建存储空间: ${agentId}`);
    return agentPrefix;
  }
  
  /**
   * 保存备份
   * @param {string} backupId - 备份ID
   * @param {Object} data - 备份数据
   * @returns {Promise<string>} 备份键
   */
  async saveBackup(backupId, data) {
    const backupKey = `backups/${backupId}.json`;
    return await this.save(backupKey, data, {
      contentType: 'application/json',
      metadata: { type: 'backup' }
    });
  }
  
  /**
   * 获取备份
   * @param {string} backupId - 备份ID
   * @returns {Promise<Object>} 备份数据
   */
  async getBackup(backupId) {
    const backupKey = `backups/${backupId}.json`;
    return await this.get(backupKey);
  }
  
  /**
   * 获取存储统计
   * @returns {Promise<Object>} 统计信息
   */
  async getStats() {
    await this.initialize();
    
    // 获取所有对象的总大小
    const allObjects = await this.list('', 10000);
    const totalSize = allObjects.reduce((sum, obj) => sum + (obj.size || 0), 0);
    
    // 按类型统计
    const byType = {
      agents: await this.list('agents/', 1000),
      memories: await this.list('memories/', 1000),
      shared: await this.list('shared/', 1000),
      backups: await this.list('backups/', 1000)
    };
    
    return {
      ...this.stats,
      totalObjects: allObjects.length,
      totalSize,
      byType: Object.keys(byType).reduce((acc, type) => {
        acc[type] = byType[type].length;
        return acc;
      }, {})
    };
  }
  
  /**
   * 关闭存储
   * @returns {Promise<void>}
   */
  async close() {
    // S3客户端不需要特殊关闭操作
    console.log('👋 S3存储已关闭');
  }
}

module.exports = S3Storage;