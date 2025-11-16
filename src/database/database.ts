import { User } from '../types/user';
import cluster from 'cluster';

class Database {
  private users: User[] = [];

  getAllUsers(): User[] {
    return [...this.users];
  }

  getUserById(id: string): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  createUser(user: User): User {
    this.users.push(user);
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex === -1) {
      return undefined;
    }
    this.users[userIndex] = { ...this.users[userIndex], ...updates };
    return this.users[userIndex];
  }

  deleteUser(id: string): boolean {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex === -1) {
      return false;
    }
    this.users.splice(userIndex, 1);
    return true;
  }

  // Get all users data (for IPC)
  getUsersData(): User[] {
    return this.users;
  }

  // Set users data (for IPC)
  setUsersData(users: User[]): void {
    this.users = users;
  }
}

// For cluster mode: if in worker, use IPC to communicate with primary
class ClusterDatabase {
  private isWorker: boolean;

  constructor() {
    this.isWorker = cluster.isWorker;
  }

  private async sendToPrimary(action: string, ...args: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.isWorker || !process.send) {
        reject(new Error('Not in worker process'));
        return;
      }

      const messageId = Math.random().toString(36).substring(7);
      const message = { type: 'db-request', action, args, messageId };

      const timeout = setTimeout(() => {
        reject(new Error('Database request timeout'));
      }, 5000);

      const handler = (response: any) => {
        if (response && response.type === 'db-response' && response.messageId === messageId) {
          clearTimeout(timeout);
          process.removeListener('message', handler);
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.result);
          }
        }
      };

      process.on('message', handler);
      process.send(message);
    });
  }

  async getAllUsers(): Promise<User[]> {
    if (this.isWorker) {
      return this.sendToPrimary('getAllUsers');
    }
    return database.getAllUsers();
  }

  async getUserById(id: string): Promise<User | undefined> {
    if (this.isWorker) {
      return this.sendToPrimary('getUserById', id);
    }
    return database.getUserById(id);
  }

  async createUser(user: User): Promise<User> {
    if (this.isWorker) {
      return this.sendToPrimary('createUser', user);
    }
    return database.createUser(user);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    if (this.isWorker) {
      return this.sendToPrimary('updateUser', id, updates);
    }
    return database.updateUser(id, updates);
  }

  async deleteUser(id: string): Promise<boolean> {
    if (this.isWorker) {
      return this.sendToPrimary('deleteUser', id);
    }
    return database.deleteUser(id);
  }
}

export const database = new Database();
export const clusterDatabase = new ClusterDatabase();

// Handle IPC messages in primary process
if (cluster.isPrimary) {
  cluster.on('message', (worker, message) => {
    if (message && message.type === 'db-request') {
      const { action, args, messageId } = message;
      let result: any;
      let error: string | null = null;

      try {
        switch (action) {
          case 'getAllUsers':
            result = database.getAllUsers();
            break;
          case 'getUserById':
            result = database.getUserById(args[0]);
            break;
          case 'createUser':
            result = database.createUser(args[0]);
            break;
          case 'updateUser':
            result = database.updateUser(args[0], args[1]);
            break;
          case 'deleteUser':
            result = database.deleteUser(args[0]);
            break;
          default:
            error = `Unknown action: ${action}`;
        }
      } catch (err) {
        error = err instanceof Error ? err.message : 'Unknown error';
      }

      worker.send({
        type: 'db-response',
        messageId,
        result,
        error,
      });
    }
  });
}
