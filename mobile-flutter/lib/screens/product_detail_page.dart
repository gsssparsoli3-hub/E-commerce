import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/product.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../providers/catalog_provider.dart';
import '../providers/settings_provider.dart';
import '../services/api_service.dart';
import '../utils.dart';
import '../widgets/empty_state.dart';
import '../widgets/product_actions_bar.dart';
import '../widgets/product_images_carousel.dart';
import '../widgets/product_info_header.dart';
import '../widgets/related_products.dart';
import '../widgets/reviews_section.dart';
import 'checkout_page.dart';

/// Product detail: image carousel, pricing, quantity, add-to-cart / buy-now,
/// wishlist toggle, description, reviews and related products.
class ProductDetailPage extends StatefulWidget {
  const ProductDetailPage({super.key, required this.slug});

  final String slug;

  @override
  State<ProductDetailPage> createState() => _ProductDetailPageState();
}

class _ProductDetailPageState extends State<ProductDetailPage> {
  Product? _product;
  List<Product> _related = [];
  bool _loading = true;
  String? _error;
  int _quantity = 1;
  bool _wishlisted = false;
  bool _wishlistBusy = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result =
          await context.read<CatalogProvider>().fetchProduct(widget.slug);
      if (!mounted) return;
      setState(() {
        _product = result.product;
        _related = result.related;
        _loading = false;
      });
      _syncWishlistState(result.product.id);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    }
  }

  Future<void> _syncWishlistState(String productId) async {
    try {
      final items = await context.read<AuthProvider>().api.fetchWishlist();
      if (!mounted) return;
      setState(
          () => _wishlisted = items.any((product) => product.id == productId));
    } catch (_) {
      // Best effort only; the heart still works via toggling.
    }
  }

  Future<void> _toggleWishlist() async {
    final product = _product;
    if (product == null || _wishlistBusy) return;
    setState(() => _wishlistBusy = true);
    try {
      final added =
          await context.read<AuthProvider>().api.toggleWishlist(product.id);
      if (!mounted) return;
      setState(() => _wishlisted = added);
      showSnack(context, added ? 'Added to wishlist' : 'Removed from wishlist');
    } on ApiException catch (e) {
      if (mounted) showSnack(context, e.message);
    } finally {
      if (mounted) setState(() => _wishlistBusy = false);
    }
  }

  Future<void> _addToCart({required bool buyNow}) async {
    final product = _product;
    if (product == null) return;
    try {
      await context.read<CartProvider>().add(product.id, quantity: _quantity);
      if (!mounted) return;
      if (buyNow) {
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const CheckoutPage()),
        );
      } else {
        showSnack(context, 'Added to cart');
      }
    } on ApiException catch (e) {
      if (mounted) showSnack(context, e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final product = _product;
    final wishlistEnabled =
        context.watch<SettingsProvider>().settings?.wishlistEnabled ?? true;
    return Scaffold(
      appBar: AppBar(
        title: Text(
          product?.name ?? 'Product',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        actions: [
          if (wishlistEnabled && product != null)
            IconButton(
              onPressed: _wishlistBusy ? null : _toggleWishlist,
              icon: Icon(
                _wishlisted ? Icons.favorite : Icons.favorite_border,
                color: _wishlisted ? Colors.red : null,
              ),
              tooltip: 'Wishlist',
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? EmptyState(
                  icon: Icons.cloud_off,
                  title: 'Could not load this product',
                  message: _error,
                  actionLabel: 'Retry',
                  onAction: _load,
                )
              : _buildBody(product!),
      bottomNavigationBar: (product != null && product.inStock)
          ? ProductActionsBar(
              onAddToCart: () => _addToCart(buyNow: false),
              onBuyNow: () => _addToCart(buyNow: true),
            )
          : null,
    );
  }

  Widget _buildBody(Product product) {
    final theme = Theme.of(context);
    return ListView(
      padding: const EdgeInsets.only(bottom: 16),
      children: [
        ProductImagesCarousel(images: product.images),
        ProductInfoHeader(
          product: product,
          quantity: _quantity,
          onQuantityChanged: (value) => setState(() => _quantity = value),
        ),
        const Divider(height: 32),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'Description',
            style: theme.textTheme.titleMedium
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          child: Text(
            product.description.isEmpty
                ? 'No description available for this product yet.'
                : product.description,
            style: theme.textTheme.bodyMedium?.copyWith(height: 1.5),
          ),
        ),
        if (!product.inStock)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.colorScheme.error.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline, color: theme.colorScheme.error),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'This product is currently out of stock. Check back later.',
                      style: theme.textTheme.bodySmall,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ReviewsSection(productId: product.id),
        RelatedProducts(products: _related),
        const SizedBox(height: 80),
      ],
    );
  }
}
