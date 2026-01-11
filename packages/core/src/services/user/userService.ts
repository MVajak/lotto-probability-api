import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';

import {type User, UserRepository} from '@lotto/database';
import type {UpdateUserProfileDto, UserProfileResponseDto} from '../../models';

@injectable({scope: BindingScope.TRANSIENT})
export class UserService {
  constructor(
    @repository(UserRepository)
    private userRepository: UserRepository,
  ) {}

  /**
   * Get user profile by ID
   * Throws 404 if user not found or has been deleted
   */
  async getUserProfile(userId: string): Promise<UserProfileResponseDto> {
    const user = await this.userRepository.findById(userId);

    if (!user || user.deletedAt) {
      throw new HttpErrors.NotFound('User not found');
    }

    return this.toProfileResponse(user);
  }

  /**
   * Update user profile
   * Only allows updating: firstName, lastName, phoneNumber, country
   */
  async updateUserProfile(
    userId: string,
    data: UpdateUserProfileDto,
  ): Promise<UserProfileResponseDto> {
    // First verify user exists and is not deleted
    const user = await this.userRepository.findById(userId);

    if (!user || user.deletedAt) {
      throw new HttpErrors.NotFound('User not found');
    }

    // Build update object with only allowed fields
    const updateData: Partial<User> = {};

    if (data.firstName !== undefined) {
      updateData.firstName = data.firstName;
    }
    if (data.lastName !== undefined) {
      updateData.lastName = data.lastName;
    }
    if (data.phoneNumber !== undefined) {
      updateData.phoneNumber = data.phoneNumber;
    }
    if (data.country !== undefined) {
      updateData.country = data.country;
    }

    // Only update if there's something to update
    if (Object.keys(updateData).length > 0) {
      await this.userRepository.updateById(userId, updateData);
    }

    // Fetch and return updated user
    const updatedUser = await this.userRepository.findById(userId);
    return this.toProfileResponse(updatedUser);
  }

  /**
   * Soft delete user
   * Sets deletedAt timestamp and userState to 'deleted'
   */
  async deleteUser(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);

    if (!user || user.deletedAt) {
      throw new HttpErrors.NotFound('User not found');
    }

    await this.userRepository.updateById(userId, {
      deletedAt: new Date(),
      userState: 'deleted',
    });
  }

  /**
   * Check if user has accepted terms of service
   */
  async hasAcceptedTerms(userId: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    return user.acceptedTermsVersion !== null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  /**
   * Find user by ID
   */
  async findById(userId: string): Promise<User> {
    return this.userRepository.findById(userId);
  }

  /**
   * Create a new user with default settings
   */
  async createUser(email: string): Promise<User> {
    const now = new Date();

    return this.userRepository.create({
      email,
      emailVerified: false,
      userState: 'pending',
      language: 'en',
      timezone: 'UTC',
      emailNotifications: true,
      loginCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Activate user (change state from pending to active)
   */
  async activateUser(userId: string): Promise<void> {
    await this.userRepository.updateById(userId, {
      userState: 'active',
      emailVerified: true,
    });
  }

  /**
   * Track user login
   */
  async trackLogin(userId: string, ipAddress?: string): Promise<void> {
    await this.userRepository.trackLogin(userId, ipAddress);
  }

  /**
   * Accept terms of service
   */
  async acceptTerms(userId: string, acceptedTermsVersion: string): Promise<void> {
    await this.userRepository.updateById(userId, {
      acceptedTermsVersion,
      acceptedTermsAt: new Date(),
    });
  }

  /**
   * Transform User entity to profile response DTO
   * Excludes sensitive and system fields
   */
  private toProfileResponse(user: User): UserProfileResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      country: user.country,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };
  }
}
