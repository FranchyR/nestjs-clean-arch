import { UserRepository } from "@/users/domain/repositories/user.repository"
import { UserOutput, UserOutputMapper } from "../dtos/user-output"
import { UseCase as DefaultUseCase } from "@/shared/application/usecases/use-case"
import { InvalidPasswordError } from "@/shared/application/errors/invalid-password-error"
import { HashProvider } from "@/shared/application/providers/hash-provider"

export namespace UpdatePasswordUseCase {

  export type Input = {
    id: string
    password: string
    oldPassword: string
  }

  export type Output = UserOutput

  export class UseCase implements DefaultUseCase<Input, Output> {
    constructor(
      private userRepository: UserRepository.Repository,
      private hassProvider: HashProvider
    ) { }

    async execute(input: Input): Promise<UserOutput> {
      const entity = await this.userRepository.findById(input.id)
      if (!input.password || !input.oldPassword) {
        throw new InvalidPasswordError('Old password and new password is required')
      }
      const checkOldPassword = await this.hassProvider.compareHash(input.oldPassword, entity.password)
      if (!checkOldPassword) {
        throw new InvalidPasswordError('Old password does not match')
      }
      const hashPassword = await this.hassProvider.generateHash(input.password)
      entity.updatePassword(hashPassword)
      await this.userRepository.update(entity)
      return UserOutputMapper.toOutput(entity)
    }
  }
}
