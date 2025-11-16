import request from 'supertest';
import server from '../server';
import { database } from '../database/database';

describe('Users API', () => {
  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    // Clear database before each test
    const users = database.getAllUsers();
    users.forEach((user) => {
      database.deleteUser(user.id);
    });
  });

  describe('GET /api/users', () => {
    it('should return empty array when no users exist', async () => {
      const response = await request(server).get('/api/users');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return all users', async () => {
      // Create test users directly in database
      const user1 = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'John',
        age: 30,
        hobbies: ['reading', 'coding'],
      };
      const user2 = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        username: 'Jane',
        age: 25,
        hobbies: ['swimming'],
      };
      database.createUser(user1);
      database.createUser(user2);

      const response = await request(server).get('/api/users');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body).toContainEqual(user1);
      expect(response.body).toContainEqual(user2);
    });
  });

  describe('GET /api/users/:userId', () => {
    it('should return 400 for invalid UUID', async () => {
      const response = await request(server).get('/api/users/invalid-id');
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid userId format');
    });

    it('should return 404 for non-existent user', async () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(server).get(`/api/users/${validUUID}`);
      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });

    it('should return user by id', async () => {
      const user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'John',
        age: 30,
        hobbies: ['reading'],
      };
      database.createUser(user);

      const response = await request(server).get(`/api/users/${user.id}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(user);
    });
  });

  describe('POST /api/users', () => {
    it('should return 400 if required fields are missing', async () => {
      const response = await request(server).post('/api/users').send({
        username: 'John',
        // age and hobbies missing
      });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required fields');
    });

    it('should return 400 if age is not a number', async () => {
      const response = await request(server).post('/api/users').send({
        username: 'John',
        age: 'thirty',
        hobbies: ['reading'],
      });
      expect(response.status).toBe(400);
    });

    it('should return 400 if hobbies is not an array', async () => {
      const response = await request(server).post('/api/users').send({
        username: 'John',
        age: 30,
        hobbies: 'reading',
      });
      expect(response.status).toBe(400);
    });

    it('should create a new user', async () => {
      const newUser = {
        username: 'John',
        age: 30,
        hobbies: ['reading', 'coding'],
      };

      const response = await request(server).post('/api/users').send(newUser);
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject(newUser);
      expect(response.body.id).toBeDefined();
      expect(typeof response.body.id).toBe('string');
    });
  });

  describe('PUT /api/users/:userId', () => {
    it('should return 400 for invalid UUID', async () => {
      const response = await request(server).put('/api/users/invalid-id').send({
        username: 'Updated',
      });
      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent user', async () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(server).put(`/api/users/${validUUID}`).send({
        username: 'Updated',
      });
      expect(response.status).toBe(404);
    });

    it('should update user', async () => {
      const user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'John',
        age: 30,
        hobbies: ['reading'],
      };
      database.createUser(user);

      const updates = {
        username: 'Jane',
        age: 25,
      };

      const response = await request(server).put(`/api/users/${user.id}`).send(updates);
      expect(response.status).toBe(200);
      expect(response.body.username).toBe('Jane');
      expect(response.body.age).toBe(25);
      expect(response.body.id).toBe(user.id);
      expect(response.body.hobbies).toEqual(['reading']);
    });
  });

  describe('DELETE /api/users/:userId', () => {
    it('should return 400 for invalid UUID', async () => {
      const response = await request(server).delete('/api/users/invalid-id');
      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent user', async () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(server).delete(`/api/users/${validUUID}`);
      expect(response.status).toBe(404);
    });

    it('should delete user', async () => {
      const user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'John',
        age: 30,
        hobbies: ['reading'],
      };
      database.createUser(user);

      const response = await request(server).delete(`/api/users/${user.id}`);
      expect(response.status).toBe(204);

      // Verify user is deleted
      const getResponse = await request(server).get(`/api/users/${user.id}`);
      expect(getResponse.status).toBe(404);
    });
  });

  describe('Full CRUD scenario', () => {
    it('should complete full CRUD cycle', async () => {
      // 1. Get all records (empty array expected)
      let response = await request(server).get('/api/users');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);

      // 2. Create new user
      const newUser = {
        username: 'TestUser',
        age: 25,
        hobbies: ['coding', 'reading'],
      };
      response = await request(server).post('/api/users').send(newUser);
      expect(response.status).toBe(201);
      const createdUser = response.body;
      expect(createdUser).toMatchObject(newUser);
      expect(createdUser.id).toBeDefined();

      // 3. Get created user by id
      response = await request(server).get(`/api/users/${createdUser.id}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(createdUser);

      // 4. Update user
      const updates = {
        username: 'UpdatedUser',
        age: 26,
      };
      response = await request(server).put(`/api/users/${createdUser.id}`).send(updates);
      expect(response.status).toBe(200);
      expect(response.body.username).toBe('UpdatedUser');
      expect(response.body.age).toBe(26);
      expect(response.body.id).toBe(createdUser.id);

      // 5. Delete user
      response = await request(server).delete(`/api/users/${createdUser.id}`);
      expect(response.status).toBe(204);

      // 6. Try to get deleted user (should return 404)
      response = await request(server).get(`/api/users/${createdUser.id}`);
      expect(response.status).toBe(404);
    });
  });

  describe('Error handling', () => {
    it('should return 404 for non-existing endpoint', async () => {
      const response = await request(server).get('/api/non-existing');
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Endpoint not found');
    });
  });
});

