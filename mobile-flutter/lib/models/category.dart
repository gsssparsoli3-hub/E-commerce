/// A product category (from /api/categories).
///
/// The category object embedded inside a Product JSON has the same base
/// shape ({id, name, slug}), so this model is reused there as well.
class Category {
  const Category({
    required this.id,
    required this.name,
    required this.slug,
    this.image,
    this.productCount,
  });

  final String id;
  final String name;
  final String slug;
  final String? image;
  final int? productCount;

  factory Category.fromJson(Map<String, dynamic> json) => Category(
        id: json['id']?.toString() ?? '',
        name: json['name'] as String? ?? '',
        slug: json['slug'] as String? ?? '',
        image: json['image'] as String?,
        productCount: json['productCount'] is num
            ? (json['productCount'] as num).toInt()
            : null,
      );
}
