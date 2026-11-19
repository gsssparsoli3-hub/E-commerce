import 'package:flutter/material.dart';

import '../models/category.dart';
import 'shop_page.dart' show ShopSort;

/// Search field + horizontal category chips + sort dropdown for the shop tab.
class ShopFilterBar extends StatelessWidget {
  const ShopFilterBar({
    super.key,
    required this.controller,
    required this.categories,
    required this.selectedCategory,
    required this.selectedSort,
    required this.onSearch,
    required this.onCategorySelected,
    required this.onSortSelected,
  });

  final TextEditingController controller;
  final List<Category> categories;
  final String? selectedCategory;
  final String selectedSort;
  final ValueChanged<String> onSearch;
  final ValueChanged<String> onCategorySelected;
  final ValueChanged<String> onSortSelected;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _searchField,
        if (categories.isNotEmpty) _categoryChips,
        _sortField,
        const SizedBox(height: 4),
      ],
    );
  }

  Widget get _searchField => Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
        child: ValueListenableBuilder<TextEditingValue>(
          valueListenable: controller,
          builder: (context, value, _) => TextField(
            controller: controller,
            textInputAction: TextInputAction.search,
            onSubmitted: onSearch,
            decoration: InputDecoration(
              hintText: 'Search products...',
              prefixIcon: const Icon(Icons.search),
              isDense: true,
              border: const OutlineInputBorder(),
              suffixIcon: value.text.isEmpty
                  ? null
                  : IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () {
                        controller.clear();
                        onSearch('');
                      },
                    ),
            ),
          ),
        ),
      );

  Widget get _categoryChips => SizedBox(
        height: 48,
        child: ListView.separated(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          scrollDirection: Axis.horizontal,
          itemCount: categories.length + 1,
          separatorBuilder: (_, __) => const SizedBox(width: 8),
          itemBuilder: (context, index) {
            if (index == 0) {
              return Center(
                child: ChoiceChip(
                  label: const Text('All'),
                  selected: selectedCategory == null,
                  onSelected: (_) => onCategorySelected(''),
                ),
              );
            }
            final category = categories[index - 1];
            return Center(
              child: ChoiceChip(
                label: Text(category.name),
                selected: selectedCategory == category.slug,
                onSelected: (_) => onCategorySelected(category.slug),
              ),
            );
          },
        ),
      );

  Widget get _sortField => Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
        child: DropdownButtonFormField<String>(
          value: ShopSort.labels.containsKey(selectedSort)
              ? selectedSort
              : 'newest',
          isExpanded: true,
          decoration: const InputDecoration(
            labelText: 'Sort by',
            prefixIcon: Icon(Icons.sort),
            isDense: true,
            border: OutlineInputBorder(),
          ),
          items: [
            for (final entry in ShopSort.labels.entries)
              DropdownMenuItem(value: entry.key, child: Text(entry.value)),
          ],
          onChanged: (value) {
            if (value != null) onSortSelected(value);
          },
        ),
      );
}
