import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/product.dart';
import '../providers/auth_provider.dart';
import '../providers/catalog_provider.dart';
import '../providers/settings_provider.dart';
import '../widgets/announcement_bar.dart';
import '../widgets/category_chip.dart';
import '../widgets/empty_state.dart';
import '../widgets/product_card.dart';
import '../widgets/section_header.dart';
import 'shop_page.dart';

/// Home tab: announcement bar, greeting, category chips, featured picks and
/// bestsellers.
class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CatalogProvider>().loadHome();
    });
  }

  void _openShop({String? category, String sort = 'newest'}) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => ShopPage(initialCategory: category, initialSort: sort),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final catalog = context.watch<CatalogProvider>();
    final settings = context.watch<SettingsProvider>().settings;
    final user = context.watch<AuthProvider>().user;
    final announcement = settings?.announcement;

    final showSpinner = catalog.homeLoading &&
        catalog.featured.isEmpty &&
        catalog.bestsellers.isEmpty;
    final showError = catalog.homeError != null &&
        catalog.featured.isEmpty &&
        catalog.bestsellers.isEmpty;

    return Scaffold(
      appBar: AppBar(
        title: Text(settings?.siteName ?? 'Shoperic'),
        actions: [
          IconButton(
            onPressed: _openShop,
            icon: const Icon(Icons.search),
            tooltip: 'Browse the shop',
          ),
        ],
      ),
      body: showSpinner
          ? const Center(child: CircularProgressIndicator())
          : showError
              ? EmptyState(
                  icon: Icons.cloud_off,
                  title: 'Could not load the store',
                  message: catalog.homeError,
                  actionLabel: 'Retry',
                  onAction: () => context.read<CatalogProvider>().loadHome(),
                )
              : ListView(
                  children: [
                    if (announcement != null) AnnouncementBar(text: announcement),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user == null || user.firstName.isEmpty
                                ? 'Welcome back'
                                : 'Hi ${user.firstName}',
                            style: theme.textTheme.headlineSmall
                                ?.copyWith(fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            (settings?.tagline ?? '').isEmpty
                                ? 'Fresh picks for you today'
                                : settings!.tagline,
                            style: theme.textTheme.bodySmall
                                ?.copyWith(color: theme.hintColor),
                          ),
                        ],
                      ),
                    ),
                    SectionHeader(title: 'Shop by Category'),
                    _buildCategories(catalog),
                    SectionHeader(
                      title: 'Featured Picks',
                      onViewAll: () => _openShop(sort: 'newest'),
                    ),
                    _productGrid(catalog.featured),
                    SectionHeader(
                      title: 'Bestsellers',
                      onViewAll: () => _openShop(sort: 'popular'),
                    ),
                    _productGrid(catalog.bestsellers),
                    const SizedBox(height: 24),
                  ],
                ),
    );
  }

  Widget _buildCategories(CatalogProvider catalog) {
    if (catalog.categories.isEmpty) return const SizedBox.shrink();
    return SizedBox(
      height: 106,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        scrollDirection: Axis.horizontal,
        itemCount: catalog.categories.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (context, index) =>
            CategoryChip(category: catalog.categories[index]),
      ),
    );
  }

  Widget _productGrid(List<Product> products) {
    if (products.isEmpty) return const SizedBox.shrink();
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      crossAxisCount: 2,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 0.66,
      children: [for (final product in products) ProductCard(product: product)],
    );
  }
}
