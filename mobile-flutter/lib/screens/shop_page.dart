import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/catalog_provider.dart';
import '../widgets/empty_state.dart';
import '../widgets/product_card.dart';
import '../widgets/shop_filter_bar.dart';

/// Catalog screen: search, category filter, sort and a paginated grid with
/// a "Load more" footer.
class ShopPage extends StatefulWidget {
  const ShopPage({super.key, this.initialCategory, this.initialSort});

  final String? initialCategory;
  final String? initialSort;

  @override
  State<ShopPage> createState() => _ShopPageState();
}

/// Sort options supported by GET /api/products.
class ShopSort {
  const ShopSort._();

  static const Map<String, String> labels = {
    'newest': 'Newest first',
    'popular': 'Most popular',
    'price-asc': 'Price: low to high',
    'price-desc': 'Price: high to low',
    'rating': 'Top rated',
    'discount': 'Biggest discount',
  };
}

class _ShopPageState extends State<ShopPage> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    final catalog = context.read<CatalogProvider>();
    if (widget.initialCategory != null) {
      catalog.setCategory(widget.initialCategory);
    }
    if (widget.initialSort != null &&
        ShopSort.labels.containsKey(widget.initialSort)) {
      catalog.setSort(widget.initialSort!);
    }
    // Load once for the embedded tab; standalone pushes (e.g. from Home with
    // a category) always refresh.
    final needsLoad = widget.initialCategory != null ||
        widget.initialSort != null ||
        (catalog.products.isEmpty && !catalog.loading);
    if (needsLoad) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) context.read<CatalogProvider>().fetchProducts();
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _applyFilters(
    CatalogProvider catalog, {
    String? search,
    String? category,
    String? sort,
  }) {
    if (search != null) catalog.setSearch(search);
    if (category != null) catalog.setCategory(category);
    if (sort != null) catalog.setSort(sort);
    catalog.fetchProducts();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<CatalogProvider>(
      builder: (context, catalog, _) => Scaffold(
        appBar: AppBar(title: const Text('Shop')),
        body: Column(
          children: [
            ShopFilterBar(
              controller: _searchController,
              categories: catalog.categories,
              selectedCategory: catalog.category,
              selectedSort: catalog.sort,
              onSearch: (value) => _applyFilters(catalog, search: value),
              onCategorySelected: (slug) =>
                  _applyFilters(catalog, category: slug),
              onSortSelected: (sort) => _applyFilters(catalog, sort: sort),
            ),
            const Divider(height: 1),
            Expanded(child: _buildBody(catalog)),
          ],
        ),
      ),
    );
  }

  Widget _buildBody(CatalogProvider catalog) {
    if (catalog.loading && catalog.products.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (catalog.error != null && catalog.products.isEmpty) {
      return EmptyState(
        icon: Icons.cloud_off,
        title: 'Could not load products',
        message: catalog.error,
        actionLabel: 'Retry',
        onAction: () => catalog.fetchProducts(),
      );
    }
    if (catalog.products.isEmpty) {
      return const EmptyState(
        icon: Icons.search_off,
        title: 'No products found',
        message: 'Try a different search term or category filter.',
      );
    }
    return RefreshIndicator(
      onRefresh: () => catalog.fetchProducts(),
      child: CustomScrollView(
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 0.64,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, index) =>
                    ProductCard(product: catalog.products[index]),
                childCount: catalog.products.length,
              ),
            ),
          ),
          if (catalog.loadingMore)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Center(child: CircularProgressIndicator()),
              ),
            )
          else if (catalog.hasMore)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: OutlinedButton.icon(
                  onPressed: () => catalog.fetchProducts(reset: false),
                  icon: const Icon(Icons.expand_more),
                  label: const Text('Load more'),
                ),
              ),
            )
          else
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Center(
                  child: Text(
                    "You've seen all products",
                    style: TextStyle(color: Colors.grey),
                  ),
                ),
              ),
            ),
          const SliverToBoxAdapter(child: SizedBox(height: 24)),
        ],
      ),
    );
  }
}
