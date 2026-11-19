import 'dart:ui' show Color;

/// Store-wide settings (from /api/settings). Money fields are paise.
class AppSettings {
  const AppSettings({
    required this.siteName,
    required this.tagline,
    this.logoUrl,
    this.primaryColor,
    required this.shippingFee,
    this.freeShippingAbove,
    required this.codEnabled,
    required this.razorpayEnabled,
    required this.wishlistEnabled,
    required this.reviewsEnabled,
    required this.couponsEnabled,
    this.announcement,
  });

  final String siteName;
  final String tagline;
  final String? logoUrl;
  final String? primaryColor; // hex, e.g. "#EA580C"
  final int shippingFee; // paise
  final int? freeShippingAbove; // paise, null when disabled
  final bool codEnabled;
  final bool razorpayEnabled;
  final bool wishlistEnabled;
  final bool reviewsEnabled;
  final bool couponsEnabled;
  final String? announcement;

  /// Parsed brand color, or null when missing/unparseable.
  Color? get primaryColorValue {
    final hex = primaryColor?.replaceFirst('#', '').trim();
    if (hex == null || hex.isEmpty) return null;
    final value = int.tryParse(hex, radix: 16);
    if (value == null) return null;
    if (hex.length == 6) return Color(0xFF000000 | value);
    if (hex.length == 8) return Color(value);
    return null;
  }

  factory AppSettings.fromJson(Map<String, dynamic> json) => AppSettings(
        siteName: json['siteName'] as String? ?? 'Shoperic',
        tagline: json['tagline'] as String? ?? '',
        logoUrl: json['logoUrl'] as String?,
        primaryColor: json['primaryColor'] as String?,
        shippingFee: _toInt(json['shippingFee']),
        freeShippingAbove: json['freeShippingAbove'] == null
            ? null
            : _toInt(json['freeShippingAbove']),
        codEnabled: json['codEnabled'] as bool? ?? true,
        razorpayEnabled: json['razorpayEnabled'] as bool? ?? false,
        wishlistEnabled: json['wishlistEnabled'] as bool? ?? true,
        reviewsEnabled: json['reviewsEnabled'] as bool? ?? true,
        couponsEnabled: json['couponsEnabled'] as bool? ?? true,
        announcement: (json['announcement'] as String?)?.trim().isEmpty == true
            ? null
            : json['announcement'] as String?,
      );
}

int _toInt(dynamic value) =>
    value is num ? value.toInt() : int.tryParse('$value') ?? 0;
