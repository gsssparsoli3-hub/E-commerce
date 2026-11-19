import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/product.dart';
import '../providers/auth_provider.dart';
import '../providers/settings_provider.dart';
import '../screens/product_detail_page.dart';
import '../services/api_service.dart';
import '../utils.dart';
import 'app_image.dart';
import 'price_text.dart';
import 'star_rating.dart';

/// Grid/horizontal product card: image with wishlist heart and discount
/// badge, 2-line name, rating and the price row. Tapping opens the detail
/// page; the heart toggles the wishlist optimistically.
class ProductCard extends StatefulWidget {
  const ProductCard({
    super.key,
    required this.product,
    this.wishlisted = false,
    this.onWishlistChanged,
  });

  final Product product;
  final bool wishlisted;
  final ValueChanged<bool>? onWishlistChanged;

  @override
  State<ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends State<ProductCard> {
  late bool _wishlisted = widget.wishlisted;
  bool _busy = false;

  Future<void> _toggleWishlist() async {
    if (_busy) return;
    setState(() => _busy = true);
    final optimistic = !_wishlisted;
    setState(() => _wishlisted = optimistic);
    try {
      final added = await context
          .read<AuthProvider>()
          .api
          .toggleWishlist(widget.product.id);
      if (!mounted) return;
      setState(() => _wishlisted = added);
      widget.onWishlistChanged?.call(added);
    } on ApiException catch (e) {
      if (mounted) {
        setState(() => _wishlisted = !optimistic);
        showSnack(context, e.message);
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final product = widget.product;
    final wishlistEnabled =
        context.watch<SettingsProvider>().settings?.wishlistEnabled ?? true;
    return Card(
      clipBehavior: Clip.antiAlias,
      margin: EdgeInsets.zero,
      child: InkWell(
        onTap: () => Navigator.of(context).push(MaterialPageRoute(
          builder: (_) => ProductDetailPage(slug: product.slug),
        )),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  AppImage(url: product.image),
                  if (product.discountPercent > 0)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: _discountBadge(theme, product.discountPercent),
                    ),
                  if (wishlistEnabled)
                    Positioned(
                      top: 2,
                      right: 2,
                      child: IconButton(
                        onPressed: _busy ? null : _toggleWishlist,
                        icon: Icon(
                          _wishlisted ? Icons.favorite : Icons.favorite_border,
                          size: 20,
                          color: _wishlisted ? Colors.red : Colors.grey.shade700,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    height: 36,
                    child: Text(
                      product.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall
                          ?.copyWith(fontWeight: FontWeight.w600),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      StarRating(rating: product.rating, size: 12),
                      const SizedBox(width: 4),
                      Text(
                        '(${product.reviewCount})',
                        style: theme.textTheme.labelSmall
                            ?.copyWith(color: theme.hintColor),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Flexible(
                        child: PriceText(
                          paise: product.price,
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w800,
                            color: theme.colorScheme.primary,
                          ),
                        ),
                      ),
                      if (product.mrp > product.price) ...[
                        const SizedBox(width: 6),
                        Flexible(
                          child: PriceText(
                            paise: product.mrp,
                            style: theme.textTheme.bodySmall?.copyWith(
                              decoration: TextDecoration.lineThrough,
                              color: theme.hintColor,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _discountBadge(ThemeData theme, int percent) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
        decoration: BoxDecoration(
          color: theme.colorScheme.primary,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(
          '$percent% OFF',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 10,
            fontWeight: FontWeight.w700,
          ),
        ),
      );
}
