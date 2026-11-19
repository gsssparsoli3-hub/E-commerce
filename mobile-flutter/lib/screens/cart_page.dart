import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../providers/settings_provider.dart';
import '../widgets/cart_summary_card.dart';
import '../widgets/cart_tile.dart';
import '../widgets/empty_state.dart';
import 'auth_page.dart';
import 'checkout_page.dart';

/// Cart tab: line items with steppers, coupon + totals card and a
/// "Proceed to Checkout" bar. [onBrowse] (when provided) switches to the
/// shop tab instead of pushing a new route.
class CartPage extends StatefulWidget {
  const CartPage({super.key, this.onBrowse});

  final VoidCallback? onBrowse;

  @override
  State<CartPage> createState() => _CartPageState();
}

class _CartPageState extends State<CartPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (context.read<AuthProvider>().isAuthed) {
        context.read<CartProvider>().fetch();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final authed = context.watch<AuthProvider>().isAuthed;
    final cart = context.watch<CartProvider>();
    final settings = context.watch<SettingsProvider>().settings;

    Widget body;
    if (!authed) {
      body = EmptyState(
        icon: Icons.lock_outline,
        title: 'Sign in to view your cart',
        message: 'Your cart syncs with your Shoperic account.',
        actionLabel: 'Sign in',
        onAction: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const AuthPage()),
        ),
      );
    } else if (cart.loading && cart.isEmpty) {
      body = const Center(child: CircularProgressIndicator());
    } else if (cart.isEmpty) {
      body = EmptyState(
        icon: Icons.shopping_cart_outlined,
        title: 'Your cart is empty',
        message: 'Browse the store and add items you love.',
        actionLabel: widget.onBrowse != null ? 'Start shopping' : null,
        onAction: widget.onBrowse,
      );
    } else {
      body = RefreshIndicator(
        onRefresh: () => cart.fetch(),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
          children: [
            for (final item in cart.items) CartTile(item: item),
            const SizedBox(height: 8),
            CartSummaryCard(cart: cart, settings: settings),
            const SizedBox(height: 96),
          ],
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
            cart.itemCount > 0 ? 'My Cart (${cart.itemCount})' : 'My Cart'),
      ),
      body: body,
      bottomNavigationBar: (!authed || cart.isEmpty)
          ? null
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: FilledButton.icon(
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const CheckoutPage()),
                  ),
                  icon: const Icon(Icons.lock_outline),
                  label: const Text('Proceed to Checkout'),
                ),
              ),
            ),
    );
  }
}
