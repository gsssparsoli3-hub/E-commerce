import 'category.dart';

/// A catalog product (from /api/products and /api/products/{slug}).
///
/// [price] and [mrp] are INTEGER PAISE (rupees x 100). Use
/// [ApiService.formatINR] to render them.
class Product {
  const Product({
    required this.id,
    required this.name,
    required this.slug,
    required this.description,
    required this.price,
    required this.mrp,
    required this.stock,
    required this.images,
    required this.tags,
    required this.rating,
    required this.reviewCount,
    required this.soldCount,
    required this.featured,
    this.sku,
    this.category,
    this.createdAt,
  });

  final String id;
  final String name;
  final String slug;
  final String description;
  final int price; // paise
  final int mrp; // paise
  final int stock;
  final List<String> images;
  final List<String> tags;
  final double rating;
  final int reviewCount;
  final int soldCount;
  final bool featured;
  final String? sku;
  final Category? category;
  final DateTime? createdAt;

  bool get inStock => stock > 0;

  String? get image => images.isNotEmpty ? images.first : null;

  /// Discount percentage off MRP, e.g. 24 for 24% off. 0 when no discount.
  int get discountPercent {
    if (mrp <= price || mrp <= 0) return 0;
    return (((mrp - price) / mrp) * 100).round();
  }

  factory Product.fromJson(Map<String, dynamic> json) {
    final price = _toInt(json['price']);
    return Product(
      id: json['id']?.toString() ?? '',
      name: json['name'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      description: json['description'] as String? ?? '',
      price: price,
      mrp: json['mrp'] == null ? price : _toInt(json['mrp']),
      stock: _toInt(json['stock']),
      images: (json['images'] as List?)?.whereType<String>().toList() ?? const [],
      tags: (json['tags'] as List?)?.whereType<String>().toList() ?? const [],
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
      reviewCount: _toInt(json['reviewCount']),
      soldCount: _toInt(json['soldCount']),
      featured: json['featured'] == true,
      sku: json['sku'] as String?,
      category: json['category'] is Map
          ? Category.fromJson((json['category'] as Map).cast<String, dynamic>())
          : null,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? ''),
    );
  }
}

int _toInt(dynamic value) =>
    value is num ? value.toInt() : int.tryParse('$value') ?? 0;
