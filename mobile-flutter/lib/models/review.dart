/// A published product review (from /api/reviews?productId=).
class Review {
  const Review({
    required this.id,
    required this.rating,
    required this.title,
    required this.comment,
    required this.createdAt,
    required this.userName,
  });

  final String id;
  final double rating;
  final String title;
  final String comment;
  final DateTime createdAt;
  final String userName;

  factory Review.fromJson(Map<String, dynamic> json) => Review(
        id: json['id']?.toString() ?? '',
        rating: (json['rating'] as num?)?.toDouble() ?? 0,
        title: json['title'] as String? ?? '',
        comment: json['comment'] as String? ?? '',
        createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
            DateTime.now(),
        userName: json['user'] is Map
            ? ((json['user'] as Map)['name'] as String? ?? 'Customer')
            : 'Customer',
      );
}
