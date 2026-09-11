import { StatusCodes } from "http-status-codes";
import { AppError } from "../errors/app-error.js";
import { UserRepository } from "../repositories/user.repository.js";

export class UserService {
  private readonly userRepository = new UserRepository();

  async getById(id: string) {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new AppError("User not found", StatusCodes.NOT_FOUND, "USER_NOT_FOUND");
    }

    return user;
  }

  listAll() {
    return this.userRepository.findAllUsers();
  }
}
