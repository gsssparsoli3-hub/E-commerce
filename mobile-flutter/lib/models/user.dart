/// A Shoperic customer account (from /api/auth/* responses).
class User {
  const User({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.role,
  });

  final String id;
  final String name;
  final String email;
  final String? phone;
  final String? role;

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id']?.toString() ?? '',
        name: json['name'] as String? ?? '',
        email: json['email'] as String? ?? '',
        phone: json['phone'] as String?,
        role: json['role'] as String?,
      );

  /// First word of the full name, e.g. for greetings. Empty when unnamed.
  String get firstName {
    final parts = name.trim().split(RegExp(r'\s+'));
    return parts.isEmpty ? '' : parts.first;
  }
}
