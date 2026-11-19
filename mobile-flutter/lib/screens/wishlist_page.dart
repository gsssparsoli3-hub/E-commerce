import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/product.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../widgets/empty_state.dart';
import '../widgets/product_card.dart';
import 'auth_page.dart';

/// Wishlist tab: grid of saved products with one-tap un-save.
class WishlistPage extends StatefulWidget {
  const WishlistPage({super.key});

  @override
  State<WishlistPage> createState() => _WishlistPageState();
}

class _WishlistPageState extends State<WishlistPage> {
  List<Product> _items = [];
  bool _loading = true;
  String? _error;

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
      final items = await context.read<AuthProvider>().api.fetchWishlist();
      if (!mounted) return;
      setState(() {
        _items = items;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (mounted) {
        setState(() {
          _error = e.message;
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authed = context.watch<AuthProvider>().isAuthed;
    Widget body;
    if (!authed) {
      body = EmptyState(
        icon: Icons.lock_outline,
        title: 'Sign in to view your wishlist',
        actionLabel: 'Sign in',
        onAction: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const AuthPage()),
        ),
      );
    } else if (_loading) {
      body = const Center(child: CircularProgressIndicator());
    } else if (_error != null) {
      body = EmptyState(
        icon: Icons.cloud_off,
        title: 'Could not load your wishlist',
        message: _error,
        actionLabel: 'Retry',
        onAction: _load,
      );
    } else if (_items.isEmpty) {
      body = const EmptyState(
        icon: Icons.favorite_border,
        title: 'Your wishlist is empty',
        message: 'Tap the heart on any product to save it here.',
      );
    } else {
      body = RefreshIndicator(
        onRefresh: _load,
        child: GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 0.64,
          ),
          itemCount: _items.length,
          itemBuilder: (context, index) {
            final product = _items[index];
            return ProductCard(
              product: product,
              wishlisted: true,
              onWishlistChanged: (added) {
                if (!added) setState(() => _items.removeAt(index));
              },
            );
          },
        ),
      );
    }
    return Scaffold(
      appBar: AppBar(title: const Text('My Wishlist')),
      body: body,
    );
  }
}
