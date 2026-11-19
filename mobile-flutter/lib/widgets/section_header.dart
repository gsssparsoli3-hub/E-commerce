import 'package:flutter/material.dart';

/// Section title row with an optional "View all" link.
class SectionHeader extends StatelessWidget {
  const SectionHeader({
    super.key,
    required this.title,
    this.onViewAll,
    this.padding = const EdgeInsets.fromLTRB(16, 20, 16, 8),
  });

  final String title;
  final VoidCallback? onViewAll;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding,
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
          ),
          if (onViewAll != null)
            TextButton.icon(
              onPressed: onViewAll,
              icon: const Icon(Icons.arrow_forward, size: 16),
              label: const Text('View all'),
              visualDensity: VisualDensity.compact,
            ),
        ],
      ),
    );
  }
}
