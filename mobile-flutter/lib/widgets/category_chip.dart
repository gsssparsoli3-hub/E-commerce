import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../models/category.dart';
import '../screens/shop_page.dart';

/// Circular category tile; tapping opens the shop filtered by that category.
class CategoryChip extends StatelessWidget {
  const CategoryChip({super.key, required this.category});

  final Category category;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: () => Navigator.of(context).push(MaterialPageRoute(
        builder: (_) => ShopPage(initialCategory: category.slug),
      )),
      child: SizedBox(
        width: 78,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircleAvatar(
              radius: 27,
              backgroundColor: theme.colorScheme.primary.withOpacity(0.10),
              backgroundImage: category.image != null
                  ? CachedNetworkImageProvider(category.image!)
                  : null,
              child: category.image == null
                  ? Icon(Icons.category_outlined,
                      color: theme.colorScheme.primary)
                  : null,
            ),
            const SizedBox(height: 6),
            Text(
              category.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: theme.textTheme.labelMedium
                  ?.copyWith(fontWeight: FontWeight.w600),
            ),
            Text(
              '${category.productCount ?? 0} items',
              style:
                  theme.textTheme.labelSmall?.copyWith(color: theme.hintColor),
            ),
          ],
        ),
      ),
    );
  }
}
