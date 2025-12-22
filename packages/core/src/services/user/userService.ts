import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';

import {type User, UserRepository} from '@lotto/database';

/**
 * DTO for updating user profile
 */
export interface UpdateUserProfileDTO {
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  country?: string | null;
}

/**
 * Response DTO for user profile (excludes sensitive fields)
 */
export interface UserProfileResponse {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  country?: string | null;
  emailVerified: boolean;
  createdAt: Date;
}

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
  async getUserProfile(userId: string): Promise<UserProfileResponse> {
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
    data: UpdateUserProfileDTO,
  ): Promise<UserProfileResponse> {
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
   * Transform User entity to profile response DTO
   * Excludes sensitive and system fields
   */
  private toProfileResponse(user: User): UserProfileResponse {
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
