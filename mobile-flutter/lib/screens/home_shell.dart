import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../providers/catalog_provider.dart';
import 'account_page.dart';
import 'cart_page.dart';
import 'home_page.dart';
import 'shop_page.dart';
import 'wishlist_page.dart';

/// Main app scaffold: keeps the five top-level tabs alive in an
/// [IndexedStack] and shows a badge with the cart item count.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CatalogProvider>().fetchCategories();
      if (context.read<AuthProvider>().isAuthed) {
        context.read<CartProvider>().fetch();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cartCount = context.watch<CartProvider>().itemCount;
    return Scaffold(
      body: IndexedStack(
        index: _index,
        children: [
          const HomePage(),
          const ShopPage(),
          CartPage(onBrowse: () => setState(() => _index = 1)),
          const WishlistPage(),
          const AccountPage(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: _index,
        selectedItemColor: theme.colorScheme.primary,
        unselectedItemColor: theme.hintColor,
        onTap: (index) => setState(() => _index = index),
        items: [
          const BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Home',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.storefront_outlined),
            activeIcon: Icon(Icons.storefront),
            label: 'Shop',
          ),
          BottomNavigationBarItem(
            icon: Badge.count(
              count: cartCount,
              isLabelVisible: cartCount > 0,
              child: const Icon(Icons.shopping_cart_outlined),
            ),
            activeIcon: Badge.count(
              count: cartCount,
              isLabelVisible: cartCount > 0,
              child: const Icon(Icons.shopping_cart),
            ),
            label: 'Cart',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.favorite_outline),
            activeIcon: Icon(Icons.favorite),
            label: 'Wishlist',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Account',
          ),
        ],
      ),
    );
  }
}
