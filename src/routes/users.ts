import { v4 as uuidv4 } from 'uuid';
import cluster from 'cluster';
import { database, clusterDatabase } from '../database/database';
import { isValidUUID, validateCreateUserDto, validateUpdateUserDto } from '../utils/validation';
import { User } from '../types/user';
import { Request, Response } from '../types/http';

const getDatabase = () => {
  return cluster.isWorker ? clusterDatabase : database;
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const users = cluster.isWorker ? await db.getAllUsers() : db.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const userId = req.params?.userId;

    if (!userId || !isValidUUID(userId)) {
      res.status(400).json({ error: 'Invalid userId format. Expected UUID.' });
      return;
    }

    const db = getDatabase();
    const user = cluster.isWorker ? await db.getUserById(userId) : db.getUserById(userId);

    if (!user) {
      res.status(404).json({ error: `User with id ${userId} not found` });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    if (!validateCreateUserDto(req.body)) {
      res.status(400).json({ error: 'Request body does not contain required fields or has invalid format' });
      return;
    }

    const newUser: User = {
      id: uuidv4(),
      username: req.body.username,
      age: req.body.age,
      hobbies: req.body.hobbies,
    };

    const db = getDatabase();
    const createdUser = cluster.isWorker ? await db.createUser(newUser) : db.createUser(newUser);
    res.status(201).json(createdUser);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params?.userId;

    if (!userId || !isValidUUID(userId)) {
      res.status(400).json({ error: 'Invalid userId format. Expected UUID.' });
      return;
    }

    if (!validateUpdateUserDto(req.body)) {
      res.status(400).json({ error: 'Request body has invalid format' });
      return;
    }

    const db = getDatabase();
    const user = cluster.isWorker ? await db.getUserById(userId) : db.getUserById(userId);

    if (!user) {
      res.status(404).json({ error: `User with id ${userId} not found` });
      return;
    }

    const updatedUser = cluster.isWorker ? await db.updateUser(userId, req.body) : db.updateUser(userId, req.body);

    if (!updatedUser) {
      res.status(404).json({ error: `User with id ${userId} not found` });
      return;
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params?.userId;

    if (!userId || !isValidUUID(userId)) {
      res.status(400).json({ error: 'Invalid userId format. Expected UUID.' });
      return;
    }

    const db = getDatabase();
    const deleted = cluster.isWorker ? await db.deleteUser(userId) : db.deleteUser(userId);

    if (!deleted) {
      res.status(404).json({ error: `User with id ${userId} not found` });
      return;
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
