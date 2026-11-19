import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../services/api_service.dart';

/// Dialog to submit (or update) a review: star rating, optional title and
/// a comment. Pops itself on success and calls [onSubmitted].
class ReviewFormDialog extends StatefulWidget {
  const ReviewFormDialog({
    super.key,
    required this.productId,
    required this.onSubmitted,
  });

  final String productId;
  final VoidCallback onSubmitted;

  @override
  State<ReviewFormDialog> createState() => _ReviewFormDialogState();
}

class _ReviewFormDialogState extends State<ReviewFormDialog> {
  final _titleController = TextEditingController();
  final _commentController = TextEditingController();
  int _rating = 5;
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _titleController.dispose();
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final comment = _commentController.text.trim();
    if (comment.length < 4) {
      setState(() => _error = 'Please write a short review first.');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await context.read<AuthProvider>().api.submitReview(
            productId: widget.productId,
            rating: _rating,
            title: _titleController.text.trim(),
            comment: comment,
          );
    } on ApiException catch (e) {
      if (mounted) {
        setState(() {
          _error = e.message;
          _submitting = false;
        });
      }
      return;
    }
    if (!mounted) return;
    final messenger = ScaffoldMessenger.of(context);
    Navigator.of(context).pop();
    messenger.showSnackBar(const SnackBar(
      content: Text('Thanks! Your review has been submitted.'),
      behavior: SnackBarBehavior.floating,
    ));
    widget.onSubmitted();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return AlertDialog(
      title: const Text('Write a review'),
      content: SizedBox(
        width: double.maxFinite,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (index) {
                final filled = index < _rating;
                return IconButton(
                  onPressed: () => setState(() => _rating = index + 1),
                  icon: Icon(
                    filled ? Icons.star_rounded : Icons.star_border_rounded,
                    size: 34,
                    color: filled
                        ? const Color(0xFFF59E0B)
                        : theme.hintColor,
                  ),
                );
              }),
            ),
            TextField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Title (optional)',
                isDense: true,
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _commentController,
              maxLines: 3,
              maxLength: 500,
              decoration: const InputDecoration(
                labelText: 'Your review',
                isDense: true,
                border: OutlineInputBorder(),
              ),
            ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  _error!,
                  style: TextStyle(color: theme.colorScheme.error),
                ),
              ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _submitting ? null : () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _submitting ? null : _submit,
          child: _submitting
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Submit'),
        ),
      ],
    );
  }
}
