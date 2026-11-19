import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../models/review.dart';
import '../providers/auth_provider.dart';
import '../providers/settings_provider.dart';
import '../services/api_service.dart';
import 'review_form_dialog.dart';
import 'star_rating.dart';

/// Reviews block for the product detail page: list + "write a review"
/// button. Hidden entirely when reviews are disabled in settings.
class ReviewsSection extends StatefulWidget {
  const ReviewsSection({super.key, required this.productId});

  final String productId;

  @override
  State<ReviewsSection> createState() => _ReviewsSectionState();
}

class _ReviewsSectionState extends State<ReviewsSection> {
  List<Review> _reviews = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final reviews =
          await context.read<AuthProvider>().api.fetchReviews(widget.productId);
      if (!mounted) return;
      setState(() {
        _reviews = reviews;
        _error = null;
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

  Future<void> _openReviewDialog() async {
    await showDialog<void>(
      context: context,
      builder: (_) => ReviewFormDialog(
        productId: widget.productId,
        onSubmitted: _load,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final enabled =
        context.watch<SettingsProvider>().settings?.reviewsEnabled ?? true;
    if (!enabled) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Divider(height: 32),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  'Reviews (${_reviews.length})',
                  style: theme.textTheme.titleMedium
                      ?.copyWith(fontWeight: FontWeight.w700),
                ),
              ),
              TextButton.icon(
                onPressed: _openReviewDialog,
                icon: const Icon(Icons.rate_review_outlined, size: 18),
                label: const Text('Write a review'),
              ),
            ],
          ),
        ),
        if (_loading)
          const Padding(
            padding: EdgeInsets.all(16),
            child: Center(child: CircularProgressIndicator()),
          )
        else if (_error != null)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: TextButton(
              onPressed: _load,
              child: const Text('Could not load reviews. Tap to retry.'),
            ),
          )
        else if (_reviews.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Text(
              'No reviews yet. Be the first to review this product.',
              style:
                  theme.textTheme.bodySmall?.copyWith(color: theme.hintColor),
            ),
          )
        else
          for (final review in _reviews) _reviewTile(theme, review),
      ],
    );
  }

  Widget _reviewTile(ThemeData theme, Review review) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 13,
                backgroundColor: theme.colorScheme.primary.withOpacity(0.12),
                child: Text(
                  review.userName.isNotEmpty
                      ? review.userName[0].toUpperCase()
                      : '?',
                  style: TextStyle(fontSize: 12, color: theme.colorScheme.primary),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  review.userName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.bodySmall
                      ?.copyWith(fontWeight: FontWeight.w700),
                ),
              ),
              Text(
                DateFormat('d MMM yyyy').format(review.createdAt),
                style: theme.textTheme.labelSmall
                    ?.copyWith(color: theme.hintColor),
              ),
            ],
          ),
          const SizedBox(height: 4),
          StarRating(rating: review.rating, size: 14),
          if (review.title.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              review.title,
              style:
                  theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w700),
            ),
          ],
          const SizedBox(height: 2),
          Text(
            review.comment,
            style: theme.textTheme.bodySmall?.copyWith(height: 1.4),
          ),
        ],
      ),
    );
  }
}
