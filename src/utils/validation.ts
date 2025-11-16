import { validate as uuidValidate } from 'uuid';
import { CreateUserDto, UpdateUserDto } from '../types/user';

export const isValidUUID = (id: string): boolean => {
  return uuidValidate(id);
};

export const validateCreateUserDto = (body: unknown): body is CreateUserDto => {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const dto = body as Record<string, unknown>;

  return (
    typeof dto.username === 'string' &&
    dto.username.trim().length > 0 &&
    typeof dto.age === 'number' &&
    Number.isInteger(dto.age) &&
    dto.age >= 0 &&
    Array.isArray(dto.hobbies) &&
    dto.hobbies.every((hobby) => typeof hobby === 'string')
  );
};

export const validateUpdateUserDto = (body: unknown): body is UpdateUserDto => {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const dto = body as Record<string, unknown>;

  if (dto.username !== undefined && typeof dto.username !== 'string') {
    return false;
  }

  if (dto.age !== undefined && (typeof dto.age !== 'number' || !Number.isInteger(dto.age) || dto.age < 0)) {
    return false;
  }

  if (dto.hobbies !== undefined && (!Array.isArray(dto.hobbies) || !dto.hobbies.every((hobby) => typeof hobby === 'string'))) {
    return false;
  }

  return Object.keys(dto).length > 0;
};

