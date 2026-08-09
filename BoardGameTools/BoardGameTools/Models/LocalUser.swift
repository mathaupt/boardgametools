import Foundation
import SwiftData

@Model
final class LocalUser {
    @Attribute(.unique) var id: String
    var email: String
    var name: String
    var role: String
    var isActive: Bool
    var updatedAt: String

    init(dto: UserDTO) {
        self.id = dto.id
        self.email = dto.email
        self.name = dto.name
        self.role = dto.role
        self.isActive = true
        self.updatedAt = ISO8601DateFormatter().string(from: Date())
    }

    func update(from dto: UserDTO) {
        email = dto.email
        name = dto.name
        role = dto.role
        updatedAt = ISO8601DateFormatter().string(from: Date())
    }
}
