import 'package:flutter/material.dart';

/// Read-only 5-star rating row (supports half stars).
class StarRating extends StatelessWidget {
  const StarRating({super.key, required this.rating, this.size = 14});

  final double rating;
  final double size;

  @override
  Widget build(BuildContext context) {
    const color = Color(0xFFF59E0B); // amber
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (index) {
        final IconData icon;
        if (rating >= index + 0.75) {
          icon = Icons.star;
        } else if (rating >= index + 0.25) {
          icon = Icons.star_half;
        } else {
          icon = Icons.star_border;
        }
        return Icon(icon, size: size, color: color);
      }),
    );
  }
}
