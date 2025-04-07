import { Client } from 'ssh2';
import fs from 'fs/promises';
export class SSHConnection {
    constructor(config) {
        this.isConnected = false;
        this.reconnectTimer = null;
        this.lastActivity = Date.now();
        this.client = new Client();
        this.config = config;
        this.setupClientEvents();
    }
    setupClientEvents() {
        this.client
            .on('error', (err) => {
            console.error(`SSH connection error for ${this.config.host}:`, err.message);
            this.isConnected = false;
            this.scheduleReconnect();
        })
            .on('end', () => {
            console.error(`SSH connection ended for ${this.config.host}`);
            this.isConnected = false;
            this.scheduleReconnect();
        })
            .on('close', () => {
            console.error(`SSH connection closed for ${this.config.host}`);
            this.isConnected = false;
            this.scheduleReconnect();
        });
    }
    scheduleReconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        // Only attempt reconnect if there was recent activity
        const timeSinceLastActivity = Date.now() - this.lastActivity;
        if (timeSinceLastActivity < 30 * 60 * 1000) { // 30 minutes
            this.reconnectTimer = setTimeout(() => {
                console.error(`Attempting to reconnect to ${this.config.host}...`);
                this.connect().catch(err => {
                    console.error(`Reconnection failed for ${this.config.host}:`, err.message);
                });
            }, 5000); // Wait 5 seconds before reconnecting
        }
    }
    async connect() {
        if (this.isConnected) {
            return;
        }
        return new Promise(async (resolve, reject) => {
            try {
                const connectionConfig = {
                    host: this.config.host,
                    port: this.config.port,
                    username: this.config.username,
                    keepaliveInterval: this.config.keepaliveInterval || 10000,
                    keepaliveCountMax: this.config.keepaliveCountMax || 3,
                    readyTimeout: this.config.readyTimeout || 20000,
                };
                // Handle authentication
                if (this.config.privateKeyPath) {
                    const privateKey = await fs.readFile(this.config.privateKeyPath, 'utf8');
                    connectionConfig.privateKey = privateKey;
                }
                else if (this.config.password) {
                    connectionConfig.password = this.config.password;
                }
                else {
                    throw new Error('No authentication method provided');
                }
                this.client
                    .on('ready', () => {
                    this.isConnected = true;
                    this.lastActivity = Date.now();
                    resolve();
                })
                    .on('error', (err) => {
                    reject(err);
                })
                    .connect(connectionConfig);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async executeCommand(command) {
        this.lastActivity = Date.now();
        // Check connection and attempt reconnect if needed
        if (!this.isConnected) {
            await this.connect();
        }
        return new Promise((resolve, reject) => {
            this.client.exec(command, (err, stream) => {
                if (err) {
                    reject(err);
                    return;
                }
                let output = '';
                let errorOutput = '';
                stream
                    .on('data', (data) => {
                    output += data.toString();
                })
                    .stderr.on('data', (data) => {
                    errorOutput += data.toString();
                });
                stream.on('close', (code) => {
                    this.lastActivity = Date.now();
                    resolve({
                        output: output || errorOutput,
                        exitCode: code || 0
                    });
                });
            });
        });
    }
    disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.isConnected) {
            this.client.end();
            this.isConnected = false;
        }
    }
    isActive() {
        return this.isConnected;
    }
}
// Connection pool to manage multiple SSH connections
export class SSHConnectionPool {
    constructor() {
        this.connections = new Map();
    }
    async getConnection(connectionId, config) {
        let connection = this.connections.get(connectionId);
        if (!connection) {
            connection = new SSHConnection(config);
            this.connections.set(connectionId, connection);
            await connection.connect();
        }
        else if (!connection.isActive()) {
            await connection.connect();
        }
        return connection;
    }
    async closeConnection(connectionId) {
        const connection = this.connections.get(connectionId);
        if (connection) {
            connection.disconnect();
            this.connections.delete(connectionId);
        }
    }
    closeAll() {
        for (const connection of this.connections.values()) {
            connection.disconnect();
        }
        this.connections.clear();
    }
}
