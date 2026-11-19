import 'package:flutter/material.dart';

import '../models/product.dart';
import 'product_card.dart';

/// Horizontal "You may also like" shelf of related products.
class RelatedProducts extends StatelessWidget {
  const RelatedProducts({super.key, required this.products});

  final List<Product> products;

  @override
  Widget build(BuildContext context) {
    if (products.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Divider(height: 32),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'You may also like',
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
        ),
        SizedBox(
          height: 250,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            scrollDirection: Axis.horizontal,
            itemCount: products.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) => SizedBox(
              width: 155,
              child: ProductCard(product: products[index]),
            ),
          ),
        ),
      ],
    );
  }
}
