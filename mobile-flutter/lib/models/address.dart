/// A saved delivery address (from /api/addresses).
class Address {
  const Address({
    required this.id,
    required this.fullName,
    required this.phone,
    required this.line1,
    this.line2,
    required this.city,
    required this.state,
    required this.pincode,
    this.isDefault = false,
  });

  final String id;
  final String fullName;
  final String phone;
  final String line1;
  final String? line2;
  final String city;
  final String state;
  final String pincode;
  final bool isDefault;

  /// Single-line address, e.g. "12 MG Road, Indiranagar, Bengaluru, KA 560038".
  String get fullAddress {
    final parts = <String>[
      line1,
      if (line2 != null && line2!.isNotEmpty) line2!,
      city,
      state,
      pincode,
    ];
    return parts.where((p) => p.isNotEmpty).join(', ');
  }

  factory Address.fromJson(Map<String, dynamic> json) => Address(
        id: json['id']?.toString() ?? '',
        fullName: json['fullName'] as String? ?? '',
        phone: json['phone'] as String? ?? '',
        line1: json['line1'] as String? ?? '',
        line2: (json['line2'] as String?)?.isNotEmpty == true
            ? json['line2'] as String?
            : null,
        city: json['city'] as String? ?? '',
        state: json['state'] as String? ?? '',
        pincode: json['pincode'] as String? ?? '',
        isDefault: json['isDefault'] == true,
      );
}
