import 'package:flutter/foundation.dart';

import '../models/api_results.dart';
import '../models/category.dart';
import '../models/product.dart';
import '../services/api_service.dart';

/// Catalog state: categories, home highlights and the paginated shop list.
class CatalogProvider extends ChangeNotifier {
  CatalogProvider(this._api);

  final ApiService _api;

  // ---- Categories ---------------------------------------------------------
  List<Category> _categories = [];
  bool _categoriesLoading = false;
  String? _categoriesError;

  List<Category> get categories => _categories;
  bool get categoriesLoading => _categoriesLoading;
  String? get categoriesError => _categoriesError;

  // ---- Home highlights ------------------------------------------------------
  List<Product> _featured = [];
  List<Product> _bestsellers = [];
  bool _homeLoading = false;
  String? _homeError;

  List<Product> get featured => _featured;
  List<Product> get bestsellers => _bestsellers;
  bool get homeLoading => _homeLoading;
  String? get homeError => _homeError;

  // ---- Shop listing ---------------------------------------------------------
  List<Product> _products = [];
  bool _loading = false;
  bool _loadingMore = false;
  String? _error;
  String? _search;
  String? _category;
  String _sort = 'newest';
  int _page = 1;
  int _pages = 1;
  int _total = 0;

  List<Product> get products => _products;
  bool get loading => _loading;
  bool get loadingMore => _loadingMore;
  String? get error => _error;
  String? get search => _search;
  String? get category => _category;
  String get sort => _sort;
  int get total => _total;
  bool get hasMore => _page < _pages;

  // ---- Actions ---------------------------------------------------------------

  Future<void> fetchCategories() async {
    _categoriesLoading = true;
    notifyListeners();
    try {
      _categories = await _api.fetchCategories();
      _categoriesError = null;
    } on ApiException catch (e) {
      _categoriesError = e.message;
    } finally {
      _categoriesLoading = false;
      notifyListeners();
    }
  }

  /// Loads the two home shelves: featured picks and bestsellers.
  Future<void> loadHome() async {
    _homeLoading = true;
    notifyListeners();
    try {
      var picks = (await _api.fetchProducts(featured: true, limit: 4)).products;
      if (picks.isEmpty) {
        // Store without featured flags: fall back to the newest arrivals.
        picks = (await _api.fetchProducts(sort: 'newest', limit: 4)).products;
      }
      final popular = await _api.fetchProducts(sort: 'popular', limit: 6);
      _featured = picks.take(4).toList();
      _bestsellers = popular.products.take(6).toList();
      _homeError = null;
    } on ApiException catch (e) {
      _homeError = e.message;
    } finally {
      _homeLoading = false;
      notifyListeners();
    }
  }

  /// Applies the search text ('' clears the search).
  void setSearch(String value) =>
      _search = value.trim().isEmpty ? null : value.trim();

  /// Applies the category slug ('' or null selects "All").
  void setCategory(String? slug) =>
      _category = (slug == null || slug.isEmpty) ? null : slug;

  void setSort(String value) => _sort = value;

  /// Fetches the shop list. [reset] starts a fresh first page; otherwise the
  /// next page is appended (load-more).
  Future<void> fetchProducts({bool reset = true}) async {
    if (reset) {
      _loading = true;
      _error = null;
      notifyListeners();
    } else {
      _loadingMore = true;
      notifyListeners();
    }
    try {
      final result = await _api.fetchProducts(
        search: _search,
        category: _category,
        sort: _sort,
        page: reset ? 1 : _page + 1,
      );
      _products = reset ? result.products : [..._products, ...result.products];
      _page = result.page;
      _pages = result.pages;
      _total = result.total;
    } on ApiException catch (e) {
      _error = e.message;
    } catch (_) {
      _error = 'Something went wrong while loading products.';
    } finally {
      _loading = false;
      _loadingMore = false;
      notifyListeners();
    }
  }

  /// Product detail (+ related products); throws [ApiException] on failure.
  Future<ProductDetailResult> fetchProduct(String slug) =>
      _api.fetchProduct(slug);
}
