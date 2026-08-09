import { UserRepository } from '../repositories/user.repository';
import { UserSchema, CreateUserDTO } from '../types/user.type';
import bcrypt from 'bcrypt';
import { Role } from '@/generated/prisma/client';

export class UserService {
  static async getAllUsers() {
    return UserRepository.findAll();
  }

  static async getSalesUsers() {
    return UserRepository.findSalesUsers();
  }

  static async createUser(data: CreateUserDTO) {
    const parsedData = UserSchema.parse(data);
    
    if (!parsedData.password) {
      throw new Error('Password wajib diisi untuk pengguna baru');
    }

    const existingUser = await UserRepository.findByEmail(parsedData.email);
    if (existingUser) {
      throw new Error('Email ini sudah terdaftar');
    }

    const hashedPassword = await bcrypt.hash(parsedData.password, 10);

    return UserRepository.create({
      name: parsedData.name,
      email: parsedData.email,
      password: hashedPassword,
      role: parsedData.role as Role
    });
  }

  static async updateUser(id: string, data: CreateUserDTO) {
    const parsedData = UserSchema.parse(data);

    const existingUser = await UserRepository.findByEmail(parsedData.email);
    if (existingUser && existingUser.id !== id) {
      throw new Error('Email ini sudah terdaftar pada pengguna lain');
    }

    const updateData: any = {
      name: parsedData.name,
      email: parsedData.email,
      role: parsedData.role as Role
    };

    if (parsedData.password && parsedData.password.trim() !== '') {
      updateData.password = await bcrypt.hash(parsedData.password, 10);
    }

    return UserRepository.update(id, updateData);
  }

  static async deleteUser(id: string, requestorId: string) {
    if (requestorId === id) {
      throw new Error('Anda tidak dapat menghapus akun Anda sendiri');
    }

    const userToDelete = await UserRepository.findById(id);
    if (userToDelete?.role === 'SUPER_ADMIN') {
      const superAdminCount = await UserRepository.countSuperAdmins();
      if (superAdminCount <= 1) {
        throw new Error('Tidak dapat menghapus satu-satunya Super Admin');
      }
    }

    return UserRepository.delete(id);
  }

  static async resetPassword(id: string) {
    const defaultPassword = 'multazam' + Math.floor(1000 + Math.random() * 9000);
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    await UserRepository.update(id, { password: hashedPassword });
    return defaultPassword;
  }
}
